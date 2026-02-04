// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title IntentWallet
 * @dev Safe module for executing intents with multisig approval
 * 
 * This module enables:
 * - Intent execution via Safe multisig
 * - Rate limiting and safety checks
 * - Transaction history and logging
 */

interface ISafe {
    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes memory data,
        uint8 operation
    ) external returns (bool success);
}

interface IIntentRegistry {
    function executeIntent(bytes32 intentId, bytes32 txHash) external;
    function recordError(bytes32 intentId, bytes memory error) external;
}

contract IntentWallet {
    // Constants
    uint256 public constant OPERATION_CALL = 0;
    uint256 public constant OPERATION_DELEGATECALL = 1;

    // State
    ISafe public safe;
    IIntentRegistry public registry;
    address public owner;

    // Rate limiting
    mapping(address => uint256) public lastExecutionTime;
    uint256 public executionCooldown = 1 minutes;
    uint256 public maxDailyTransactions = 100;
    mapping(address => uint256) public dailyExecutionCount;
    mapping(address => uint256) public lastDayReset;

    // Transaction history
    struct ExecutionRecord {
        address executor;
        bytes32 intentId;
        address target;
        uint256 value;
        bytes data;
        bool success;
        bytes result;
        uint256 timestamp;
    }

    ExecutionRecord[] public executionHistory;

    // Safety parameters
    uint256 public maxSingleExecutionValue = 1000 ether;
    uint256 public maxDailyValue = 10000 ether;
    mapping(address => uint256) public dailyValueSpent;
    mapping(address => uint256) public lastValueResetTime;

    // Events
    event IntentExecuted(
        bytes32 indexed intentId,
        address indexed executor,
        address indexed target,
        uint256 value,
        bytes32 txHash
    );

    event ExecutionFailed(
        bytes32 indexed intentId,
        string reason,
        bytes error
    );

    event RateLimitExceeded(address indexed executor, string reason);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier rateLimited(address executor, uint256 value) {
        // Check cooldown
        require(
            block.timestamp >= lastExecutionTime[executor] + executionCooldown,
            "Cooldown not elapsed"
        );

        // Reset daily counters if needed
        if (block.timestamp - lastDayReset[executor] > 1 days) {
            dailyExecutionCount[executor] = 0;
            lastDayReset[executor] = block.timestamp;
        }

        if (block.timestamp - lastValueResetTime[executor] > 1 days) {
            dailyValueSpent[executor] = 0;
            lastValueResetTime[executor] = block.timestamp;
        }

        // Check transaction count
        require(
            dailyExecutionCount[executor] < maxDailyTransactions,
            "Daily transaction limit exceeded"
        );

        // Check single execution value
        require(value <= maxSingleExecutionValue, "Single execution value exceeded");

        // Check daily value limit
        require(
            dailyValueSpent[executor] + value <= maxDailyValue,
            "Daily value limit exceeded"
        );

        _;

        // Update state
        lastExecutionTime[executor] = block.timestamp;
        dailyExecutionCount[executor]++;
        dailyValueSpent[executor] += value;
    }

    constructor(address _safe, address _registry) {
        safe = ISafe(_safe);
        registry = IIntentRegistry(_registry);
        owner = msg.sender;
    }

    // ============= Admin Functions =============

    function setRegistry(address _registry) external onlyOwner {
        registry = IIntentRegistry(_registry);
    }

    function setExecutionCooldown(uint256 _cooldown) external onlyOwner {
        executionCooldown = _cooldown;
    }

    function setMaxDailyTransactions(uint256 _max) external onlyOwner {
        maxDailyTransactions = _max;
    }

    function setMaxSingleValue(uint256 _value) external onlyOwner {
        maxSingleExecutionValue = _value;
    }

    function setMaxDailyValue(uint256 _value) external onlyOwner {
        maxDailyValue = _value;
    }

    // ============= Intent Execution =============

    /**
     * Execute an intent with safety checks
     */
    function executeIntent(
        bytes32 intentId,
        address target,
        uint256 value,
        bytes calldata data,
        uint8 operation
    ) external rateLimited(msg.sender, value) returns (bool success) {
        require(target != address(0), "Invalid target");

        // Log execution attempt
        ExecutionRecord memory record = ExecutionRecord({
            executor: msg.sender,
            intentId: intentId,
            target: target,
            value: value,
            data: data,
            success: false,
            result: "",
            timestamp: block.timestamp
        });

        try
            safe.execTransactionFromModule(target, value, data, operation)
        returns (bool _success) {
            success = _success;
            record.success = success;

            if (success) {
                // Calculate tx hash (for logging purposes)
                bytes32 txHash = keccak256(
                    abi.encodePacked(intentId, block.timestamp, target, value)
                );

                registry.executeIntent(intentId, txHash);

                emit IntentExecuted(intentId, msg.sender, target, value, txHash);
            } else {
                registry.recordError(
                    intentId,
                    abi.encodePacked("Execution returned false")
                );
                emit ExecutionFailed(intentId, "Execution failed", "");
            }
        } catch Error(string memory reason) {
            registry.recordError(intentId, abi.encodePacked(reason));
            emit ExecutionFailed(intentId, reason, "");
            success = false;
        } catch (bytes memory err) {
            registry.recordError(intentId, err);
            emit ExecutionFailed(intentId, "Unknown error", err);
            success = false;
        }

        // Store execution record
        executionHistory.push(record);
    }

    // ============= View Functions =============

    /**
     * Get execution history
     */
    function getExecutionCount() external view returns (uint256) {
        return executionHistory.length;
    }

    /**
     * Get recent executions
     */
    function getRecentExecutions(uint256 count)
        external
        view
        returns (ExecutionRecord[] memory)
    {
        require(count <= executionHistory.length, "Invalid count");

        ExecutionRecord[] memory recent = new ExecutionRecord[](count);
        uint256 startIdx = executionHistory.length - count;

        for (uint256 i = 0; i < count; i++) {
            recent[i] = executionHistory[startIdx + i];
        }

        return recent;
    }

    /**
     * Get execution record
     */
    function getExecutionRecord(uint256 index)
        external
        view
        returns (ExecutionRecord memory)
    {
        require(index < executionHistory.length, "Invalid index");
        return executionHistory[index];
    }

    /**
     * Check if user is rate limited
     */
    function isRateLimited(address user) external view returns (bool) {
        return block.timestamp < lastExecutionTime[user] + executionCooldown;
    }

    /**
     * Get user stats
     */
    function getUserStats(address user)
        external
        view
        returns (
            uint256 dailyCount,
            uint256 dailyValue,
            uint256 nextAvailableTime
        )
    {
        return (
            dailyExecutionCount[user],
            dailyValueSpent[user],
            lastExecutionTime[user] + executionCooldown
        );
    }
}
