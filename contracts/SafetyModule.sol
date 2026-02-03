// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title SafetyModule
 * @dev Emergency controls and circuit breaker patterns for Intent Wallet
 * 
 * Provides:
 * - Emergency pause/freeze functionality
 * - Circuit breaker for abnormal activity
 * - Whitelist management
 * - Time-lock for critical operations
 */

interface IIntentRegistry {
    function pauseIntent(bytes32 intentId, string memory reason) external;
    function resumeIntent(bytes32 intentId) external;
}

interface IIntentWallet {
    function setMaxDailyTransactions(uint256 _max) external;
    function setMaxSingleValue(uint256 _value) external;
    function setMaxDailyValue(uint256 _value) external;
}

contract SafetyModule {
    // State
    address public owner;
    IIntentRegistry public registry;
    IIntentWallet public wallet;

    // Emergency controls
    bool public globalPause = false;
    mapping(bytes32 => bool) public pausedIntents;
    mapping(address => bool) public frozenWallets;

    // Whitelisting
    mapping(address => bool) public whitelistedTargets;
    bool public whitelistEnabled = false;

    // Time locks
    uint256 public constant TIMELOCK_DURATION = 2 days;

    struct TimeLock {
        address target;
        bytes data;
        uint256 executeTime;
        bool executed;
        bool cancelled;
    }

    mapping(bytes32 => TimeLock) public timeLocks;

    // Circuit breaker
    struct CircuitBreaker {
        bool triggered;
        uint256 triggeredAt;
        string reason;
        uint256 recoveryTime;
    }

    CircuitBreaker public circuitBreaker;
    uint256 public constant CIRCUIT_BREAKER_RECOVERY = 24 hours;

    // Activity monitoring
    struct ActivityMetrics {
        uint256 failureCount;
        uint256 lastFailureTime;
        uint256 successCount;
        uint256 lastSuccessTime;
    }

    mapping(bytes32 => ActivityMetrics) public metrics;

    // Events
    event EmergencyPause(string reason, uint256 timestamp);
    event EmergencyResume(uint256 timestamp);
    event CircuitBreakerTriggered(string reason, uint256 recoveryTime);
    event CircuitBreakerReset(uint256 timestamp);
    event WalletFrozen(address indexed wallet, string reason);
    event WalletUnfrozen(address indexed wallet);
    event WhitelistUpdated(address indexed target, bool whitelisted);
    event TimeLockCreated(bytes32 indexed lockId, uint256 executeTime);
    event TimeLockExecuted(bytes32 indexed lockId);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier notPaused() {
        require(!globalPause, "System is paused");
        _;
    }

    modifier circuitBreakerActive() {
        if (circuitBreaker.triggered) {
            if (block.timestamp >= circuitBreaker.triggeredAt + CIRCUIT_BREAKER_RECOVERY) {
                circuitBreaker.triggered = false;
                emit CircuitBreakerReset(block.timestamp);
            } else {
                require(!circuitBreaker.triggered, "Circuit breaker active");
            }
        }
        _;
    }

    constructor(address _registry, address _wallet) {
        owner = msg.sender;
        registry = IIntentRegistry(_registry);
        wallet = IIntentWallet(_wallet);
    }

    // ============= Emergency Controls =============

    /**
     * Global emergency pause
     */
    function emergencyPause(string memory reason) external onlyOwner {
        globalPause = true;
        emit EmergencyPause(reason, block.timestamp);
    }

    /**
     * Resume after emergency
     */
    function emergencyResume() external onlyOwner {
        globalPause = false;
        emit EmergencyResume(block.timestamp);
    }

    /**
     * Trigger circuit breaker
     */
    function triggerCircuitBreaker(string memory reason)
        external
        onlyOwner
    {
        circuitBreaker = CircuitBreaker({
            triggered: true,
            triggeredAt: block.timestamp,
            reason: reason,
            recoveryTime: block.timestamp + CIRCUIT_BREAKER_RECOVERY
        });

        emit CircuitBreakerTriggered(reason, CIRCUIT_BREAKER_RECOVERY);
    }

    // ============= Intent Controls =============

    /**
     * Pause specific intent
     */
    function pauseIntent(bytes32 intentId, string memory reason)
        external
        onlyOwner
    {
        pausedIntents[intentId] = true;
        registry.pauseIntent(intentId, reason);
    }

    /**
     * Resume paused intent
     */
    function resumeIntent(bytes32 intentId) external onlyOwner {
        pausedIntents[intentId] = false;
        registry.resumeIntent(intentId);
    }

    /**
     * Check if intent is paused
     */
    function isIntentPaused(bytes32 intentId) external view returns (bool) {
        return pausedIntents[intentId];
    }

    // ============= Wallet Controls =============

    /**
     * Freeze wallet (emergency stop all activities)
     */
    function freezeWallet(address user, string memory reason)
        external
        onlyOwner
    {
        frozenWallets[user] = true;
        emit WalletFrozen(user, reason);
    }

    /**
     * Unfreeze wallet
     */
    function unfreezeWallet(address user) external onlyOwner {
        frozenWallets[user] = false;
        emit WalletUnfrozen(user);
    }

    /**
     * Check if wallet is frozen
     */
    function isWalletFrozen(address user) external view returns (bool) {
        return frozenWallets[user];
    }

    // ============= Whitelisting =============

    /**
     * Enable/disable whitelist enforcement
     */
    function setWhitelistEnabled(bool enabled) external onlyOwner {
        whitelistEnabled = enabled;
    }

    /**
     * Add target to whitelist
     */
    function whitelistTarget(address target) external onlyOwner {
        whitelistedTargets[target] = true;
        emit WhitelistUpdated(target, true);
    }

    /**
     * Remove target from whitelist
     */
    function removeFromWhitelist(address target) external onlyOwner {
        whitelistedTargets[target] = false;
        emit WhitelistUpdated(target, false);
    }

    /**
     * Check if target is whitelisted
     */
    function isWhitelisted(address target) external view returns (bool) {
        if (!whitelistEnabled) return true;
        return whitelistedTargets[target];
    }

    // ============= Time Lock =============

    /**
     * Create time-locked action
     */
    function createTimeLock(
        address target,
        bytes calldata data
    ) external onlyOwner returns (bytes32 lockId) {
        lockId = keccak256(
            abi.encodePacked(target, data, block.timestamp, msg.sender)
        );

        timeLocks[lockId] = TimeLock({
            target: target,
            data: data,
            executeTime: block.timestamp + TIMELOCK_DURATION,
            executed: false,
            cancelled: false
        });

        emit TimeLockCreated(lockId, timeLocks[lockId].executeTime);
    }

    /**
     * Execute time-locked action
     */
    function executeTimeLock(bytes32 lockId) external onlyOwner {
        TimeLock storage lock = timeLocks[lockId];

        require(!lock.executed, "Already executed");
        require(!lock.cancelled, "Cancelled");
        require(block.timestamp >= lock.executeTime, "Not ready");

        lock.executed = true;

        (bool success, ) = lock.target.call(lock.data);
        require(success, "Execution failed");

        emit TimeLockExecuted(lockId);
    }

    /**
     * Cancel time lock
     */
    function cancelTimeLock(bytes32 lockId) external onlyOwner {
        TimeLock storage lock = timeLocks[lockId];
        require(!lock.executed, "Already executed");

        lock.cancelled = true;
    }

    // ============= Activity Monitoring =============

    /**
     * Record successful execution
     */
    function recordSuccess(bytes32 intentId) external onlyOwner {
        metrics[intentId].successCount++;
        metrics[intentId].lastSuccessTime = block.timestamp;

        // Reset failure count on success
        if (metrics[intentId].failureCount > 0) {
            metrics[intentId].failureCount = 0;
        }
    }

    /**
     * Record failed execution
     */
    function recordFailure(bytes32 intentId) external onlyOwner {
        metrics[intentId].failureCount++;
        metrics[intentId].lastFailureTime = block.timestamp;

        // Trigger circuit breaker if too many failures
        if (metrics[intentId].failureCount >= 5) {
            triggerCircuitBreaker(
                string(abi.encodePacked("Too many failures for intent: ", intentId))
            );
        }
    }

    /**
     * Get activity metrics
     */
    function getMetrics(bytes32 intentId)
        external
        view
        returns (ActivityMetrics memory)
    {
        return metrics[intentId];
    }

    // ============= Rate Limiting Adjustments =============

    /**
     * Adjust wallet rate limits
     */
    function adjustRateLimits(
        uint256 maxDaily,
        uint256 maxSingle,
        uint256 maxDailyValue
    ) external onlyOwner {
        wallet.setMaxDailyTransactions(maxDaily);
        wallet.setMaxSingleValue(maxSingle);
        wallet.setMaxDailyValue(maxDailyValue);
    }
}
