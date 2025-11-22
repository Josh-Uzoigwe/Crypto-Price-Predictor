// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title PredictionMarket
 * @notice Gas-optimized binary options prediction market for CELO/USD
 * @dev Refactored to avoid "stack too deep" by splitting logic into helpers.
 */
contract PredictionMarket is Ownable, Pausable, ReentrancyGuard {
    // ============ Errors ============
    error RoundNotOpen();
    error RoundNotLocked();
    error RoundNotEnded();
    error RoundAlreadyExecuted();
    error RoundNotStarted();
    error InvalidEpoch();
    error InvalidAmount();
    error InvalidPriority();
    error NoReward();
    error OraclePriceInvalid();
    error RoundStuck();
    error InvalidAddress();

    // ============ Constants ============
    uint256 public constant PRECISION = 1e18;
    uint256 public constant TREASURY_FEE_BPS = 100; // 1%
    uint256 public constant MAX_BPS = 10000;

    uint256 public constant PROPOSAL_FEE_STANDARD = 0.5 ether;
    uint256 public constant PROPOSAL_FEE_HIGH = 2 ether;
    uint256 public constant PROPOSAL_FEE_CRITICAL = 5 ether;

    // ============ State ============
    AggregatorV3Interface public immutable priceFeed;

    uint256 public currentEpoch;
    uint256 public roundDuration;
    uint256 public bufferSeconds;
    uint256 public minBetAmount;

    // Accumulated treasury (in contract) from fees and proposals
    uint256 public treasuryBalance;

    // epoch => Round
    mapping(uint256 => Round) public rounds;
    // epoch => user => Bet
    mapping(uint256 => mapping(address => Bet)) public ledger;
    // epoch => user => claimed
    mapping(uint256 => mapping(address => bool)) public claimed;
    // user => total claimed (for analytics)
    mapping(address => uint256) public totalClaimed;

    // ============ Structs & Enums ============
    enum Position { None, Bull, Bear }

    struct Round {
        uint256 startTime;
        uint256 lockTime;
        uint256 closeTime;
        int256 startPrice;
        int256 lockPrice;
        int256 closePrice;
        uint256 totalAmount;
        uint256 bullAmount;
        uint256 bearAmount;
        uint256 rewardBaseCalAmount;
        uint256 rewardAmount;
        bool executed;
        Position winner;
    }

    struct Bet {
        Position position;
        uint256 amount;
    }

    // ============ Events ============
    event BetBull(address indexed sender, uint256 indexed epoch, uint256 amount);
    event BetBear(address indexed sender, uint256 indexed epoch, uint256 amount);
    event StartRound(uint256 indexed epoch);
    event LockRound(uint256 indexed epoch, int256 price);
    event EndRound(uint256 indexed epoch, int256 price, Position winner);
    event Claim(address indexed sender, uint256 indexed epoch, uint256 amount);
    event ClaimMultiple(address indexed sender, uint256[] epochs, uint256 totalAmount);
    event NewRoundDuration(uint256 roundDuration);
    event NewBufferSeconds(uint256 bufferSeconds);
    event NewMinBetAmount(uint256 minBetAmount);
    event ProposalCreated(address indexed proposer, uint8 priority, uint256 amount);
    event RoundCancelled(uint256 indexed epoch);
    event TreasuryWithdrawn(address indexed to, uint256 amount);
    event TreasuryDeposited(uint256 amount);

    // ============ Constructor (OpenZeppelin v5) ============
    constructor(
        address _priceFeed,
        uint256 _roundDuration,
        uint256 _bufferSeconds,
        uint256 _minBetAmount
    ) Ownable(msg.sender) {
        if (_priceFeed == address(0)) revert InvalidAddress();
        if (_roundDuration == 0) revert InvalidAmount();
        if (_bufferSeconds >= _roundDuration) revert InvalidAmount();
        if (_minBetAmount == 0) revert InvalidAmount();

        priceFeed = AggregatorV3Interface(_priceFeed);
        roundDuration = _roundDuration;
        bufferSeconds = _bufferSeconds;
        minBetAmount = _minBetAmount;
    }

    // ============ Modifiers ============
    modifier notContract() {
        if (_isContract(msg.sender)) revert RoundNotOpen();
        _;
    }

    // ============ External / Public ============

    /// @notice Start the genesis round (epoch 1)
    function genesisStartRound() external onlyOwner {
        if (currentEpoch != 0) revert RoundAlreadyExecuted(); // genesis already started
        _startRound(1);
    }

    /// @notice Lock current epoch (record lock price) — anyone can call once lock time passes
    function lockRound() external whenNotPaused {
        if (currentEpoch == 0) revert RoundNotStarted();
        Round storage round = rounds[currentEpoch];
        if (block.timestamp < round.lockTime) revert RoundNotOpen();
        if (round.lockPrice != 0) revert RoundStuck(); // already locked

        int256 price = _getLatestPrice();
        round.lockPrice = price;

        emit LockRound(currentEpoch, price);
    }

    /// @notice Execute the current round, compute winners and start the next round
    function executeRound() external whenNotPaused nonReentrant {
        if (currentEpoch == 0) revert RoundNotStarted();

        Round storage round = rounds[currentEpoch];
        if (block.timestamp < round.closeTime) revert RoundNotEnded();
        if (round.executed) revert RoundAlreadyExecuted();
        if (round.lockPrice == 0) revert RoundNotLocked();

        // set close price and executed flag immediately
        round.closePrice = _getLatestPrice();
        round.executed = true;

        // compute winner & reward accounting using helper to reduce stack pressure
        (Position winner, uint256 rewardAmount, uint256 treasuryAmount, uint256 rewardBase) =
            _determineWinnerAndRewards(currentEpoch);

        round.winner = winner;
        round.rewardAmount = rewardAmount;
        round.rewardBaseCalAmount = rewardBase;

        if (treasuryAmount > 0) {
            treasuryBalance += treasuryAmount;
            emit TreasuryDeposited(treasuryAmount);
        }

        emit EndRound(currentEpoch, round.closePrice, winner);

        // start next epoch
        _startRound(currentEpoch + 1);
    }

    /// @notice Place a bet on Bull (price going up)
    function betBull(uint256 epoch) external payable whenNotPaused nonReentrant notContract {
        _placeBet(epoch, Position.Bull);
    }

    /// @notice Place a bet on Bear (price going down)
    function betBear(uint256 epoch) external payable whenNotPaused nonReentrant notContract {
        _placeBet(epoch, Position.Bear);
    }

    /// @notice Claim rewards for multiple epochs
    function claim(uint256[] calldata epochs) external nonReentrant {
        uint256 totalReward = 0;
        // iterate and collect
        for (uint256 i = 0; i < epochs.length; ++i) {
            uint256 epoch = epochs[i];
            // handle single epoch claim into helper
            totalReward += _collectForEpoch(epoch, msg.sender);
        }

        if (totalReward == 0) revert NoReward();

        totalClaimed[msg.sender] += totalReward;

        (bool success, ) = payable(msg.sender).call{value: totalReward}("");
        require(success, "Claim transfer failed");

        emit ClaimMultiple(msg.sender, epochs, totalReward);
    }

    /// @notice Create a governance proposal with priority-based fee
    function createProposal(uint8 priority) external payable whenNotPaused {
        if (priority > 2) revert InvalidPriority();

        uint256 requiredFee = priority == 0
            ? PROPOSAL_FEE_STANDARD
            : (priority == 1 ? PROPOSAL_FEE_HIGH : PROPOSAL_FEE_CRITICAL);

        if (msg.value < requiredFee) revert InvalidAmount();

        // Add requiredFee to treasury
        treasuryBalance += requiredFee;
        emit TreasuryDeposited(requiredFee);

        // refund any overpayment
        uint256 over = msg.value - requiredFee;
        if (over > 0) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: over}("");
            require(refundSuccess, "Refund failed");
        }

        emit ProposalCreated(msg.sender, priority, requiredFee);
    }

    /// @notice Cancel a stuck round (owner only)
    function cancelRound(uint256 epoch) external onlyOwner {
        Round storage round = rounds[epoch];
        if (round.executed) revert RoundAlreadyExecuted();
        // require stuck long enough
        if (block.timestamp < round.closeTime + 1 hours) revert RoundStuck();

        // mark executed and winner none -> refunds allowed via claim
        round.executed = true;
        round.winner = Position.None;
        round.rewardAmount = 0;
        round.rewardBaseCalAmount = 0;

        emit RoundCancelled(epoch);
    }

    // ============ View Functions ============

    function getLatestPrice() external view returns (int256) {
        return _getLatestPrice();
    }

    function getRound(uint256 epoch) external view returns (Round memory) {
        return rounds[epoch];
    }

    function getUserBet(uint256 epoch, address user) external view returns (Bet memory) {
        return ledger[epoch][user];
    }

    function hasClaimed(uint256 epoch, address user) external view returns (bool) {
        return claimed[epoch][user];
    }

    function isRoundOpen(uint256 epoch) external view returns (bool) {
        Round memory round = rounds[epoch];
        return block.timestamp >= round.startTime && block.timestamp < round.lockTime && !round.executed;
    }

    function isRoundLocked(uint256 epoch) external view returns (bool) {
        Round memory round = rounds[epoch];
        return block.timestamp >= round.lockTime && round.lockPrice != 0 && !round.executed;
    }

    function getTreasuryBalance() external view returns (uint256) {
        return treasuryBalance;
    }

    // ============ Internal Functions ============

    /// @dev Determine winner & compute reward + treasury amounts (minimizes locals)
    function _determineWinnerAndRewards(uint256 epoch) internal view returns (
        Position winner,
        uint256 rewardAmount,
        uint256 treasuryAmount,
        uint256 rewardBase
    ) {
        Round storage r = rounds[epoch];

        // default
        winner = Position.None;
        rewardAmount = 0;
        treasuryAmount = 0;
        rewardBase = 0;

        // determine winner
        if (r.closePrice > r.startPrice) winner = Position.Bull;
        else if (r.closePrice < r.startPrice) winner = Position.Bear;
        else return (winner, 0, 0, 0); // tie

        // no bets at all
        if (r.totalAmount == 0) return (winner, 0, 0, 0);

        if (winner == Position.Bull && r.bullAmount > 0) {
            uint256 losing = r.bearAmount;
            treasuryAmount = (losing * TREASURY_FEE_BPS) / MAX_BPS;
            rewardAmount = losing - treasuryAmount;
            rewardBase = r.bullAmount;
            return (winner, rewardAmount, treasuryAmount, rewardBase);
        }

        if (winner == Position.Bear && r.bearAmount > 0) {
            uint256 losing = r.bullAmount;
            treasuryAmount = (losing * TREASURY_FEE_BPS) / MAX_BPS;
            rewardAmount = losing - treasuryAmount;
            rewardBase = r.bearAmount;
            return (winner, rewardAmount, treasuryAmount, rewardBase);
        }

        // fallback - no winners or no bets on winning side
        return (winner, 0, 0, 0);
    }

    /// @dev Start a new round (internal)
    function _startRound(uint256 epoch) internal {
        int256 currentPrice = _getLatestPrice();

        Round storage round = rounds[epoch];
        round.startTime = block.timestamp;
        round.lockTime = block.timestamp + (roundDuration - bufferSeconds);
        round.closeTime = block.timestamp + roundDuration;
        round.startPrice = currentPrice;

        // reset other fields just in case (safe)
        round.lockPrice = 0;
        round.closePrice = 0;
        round.totalAmount = 0;
        round.bullAmount = 0;
        round.bearAmount = 0;
        round.rewardBaseCalAmount = 0;
        round.rewardAmount = 0;
        round.executed = false;
        round.winner = Position.None;

        currentEpoch = epoch;

        emit StartRound(epoch);
    }

    /// @dev Place bet (internal) — reduced locals
    function _placeBet(uint256 epoch, Position position) internal {
        if (epoch != currentEpoch) revert InvalidEpoch();
        Round storage round = rounds[epoch];

        if (block.timestamp < round.startTime || block.timestamp >= round.lockTime) {
            revert RoundNotOpen();
        }

        if (msg.value < minBetAmount) revert InvalidAmount();
        if (round.executed) revert RoundNotOpen();
        if (position == Position.None) revert InvalidAmount();

        Bet storage bet = ledger[epoch][msg.sender];

        // If user already placed a bet, ensure they do not switch sides mid-round
        if (bet.amount > 0) {
            if (bet.position != position) revert InvalidAmount(); // cannot change position during same epoch
            // else allowed to increase amount
        } else {
            bet.position = position;
        }

        // update amounts (single updates to reduce temporaries)
        bet.amount += msg.value;
        round.totalAmount += msg.value;

        if (position == Position.Bull) {
            round.bullAmount += msg.value;
            emit BetBull(msg.sender, epoch, msg.value);
        } else {
            round.bearAmount += msg.value;
            emit BetBear(msg.sender, epoch, msg.value);
        }
    }

    /// @dev Collect reward/refund for a single epoch for a single user.
    /// Returns the amount collectible (0 if nothing) and marks as claimed where applicable.
    function _collectForEpoch(uint256 epoch, address user) internal returns (uint256) {
        Round memory r = rounds[epoch];

        // must be executed before claiming
        if (!r.executed) return 0;
        if (claimed[epoch][user]) return 0;

        Bet memory userBet = ledger[epoch][user];
        if (userBet.amount == 0) return 0;

        // Refund on tie or cancellation
        if (r.winner == Position.None) {
            claimed[epoch][user] = true;
            emit Claim(user, epoch, userBet.amount);
            return userBet.amount;
        }

        // If user didn't choose winning side
        if (userBet.position != r.winner) {
            // nothing to claim
            return 0;
        }

        if (r.rewardBaseCalAmount == 0) {
            // defensive: no base to calculate from
            claimed[epoch][user] = true;
            return 0;
        }

        // compute proportional reward
        uint256 reward = (userBet.amount * r.rewardAmount) / r.rewardBaseCalAmount;
        if (reward == 0) {
            claimed[epoch][user] = true;
            return 0;
        }

        claimed[epoch][user] = true;
        emit Claim(user, epoch, reward);
        return reward;
    }

    /// @dev Get latest Chainlink price & perform sanity checks
    function _getLatestPrice() internal view returns (int256) {
        (, int256 price, , uint256 updatedAt, uint80 answeredInRound) = priceFeed.latestRoundData();

        if (price <= 0) revert OraclePriceInvalid();
        if (updatedAt == 0) revert OraclePriceInvalid();
        if (block.timestamp - updatedAt >= 1 hours) revert OraclePriceInvalid();
        if (answeredInRound == 0) revert OraclePriceInvalid();

        return price;
    }

    /// @dev primitive contract check
    function _isContract(address addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }

    // ============ Admin Functions ============

    function setRoundDuration(uint256 _roundDuration) external onlyOwner {
        if (_roundDuration == 0) revert InvalidAmount();
        roundDuration = _roundDuration;
        emit NewRoundDuration(_roundDuration);
    }

    function setBufferSeconds(uint256 _bufferSeconds) external onlyOwner {
        if (_bufferSeconds >= roundDuration) revert InvalidAmount();
        bufferSeconds = _bufferSeconds;
        emit NewBufferSeconds(_bufferSeconds);
    }

    function setMinBetAmount(uint256 _minBetAmount) external onlyOwner {
        if (_minBetAmount == 0) revert InvalidAmount();
        minBetAmount = _minBetAmount;
        emit NewMinBetAmount(_minBetAmount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function withdrawTreasury(address payable to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (treasuryBalance < amount) revert NoReward();

        treasuryBalance -= amount;
        (bool success, ) = to.call{value: amount}("");
        require(success, "Withdrawal failed");

        emit TreasuryWithdrawn(to, amount);
    }

    // ============ Receive / Fallback ============
    receive() external payable {
        if (msg.value > 0) {
            treasuryBalance += msg.value;
            emit TreasuryDeposited(msg.value);
        }
    }

    fallback() external payable {
        if (msg.value > 0) {
            treasuryBalance += msg.value;
            emit TreasuryDeposited(msg.value);
        }
    }
}
