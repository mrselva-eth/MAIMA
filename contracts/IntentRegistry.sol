// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title IntentRegistry
 * @dev Stores and manages intent metadata, execution history, and status
 * 
 * This contract is NOT responsible for holding assets - it's purely
 * a registry. Assets remain in the user's Safe wallet.
 */

interface IIntentRegistry {
    struct Intent {
        address creator;
        uint256 createdAt;
        uint256 expiresAt;
        bytes intentType; // "swap", "stake", "yield", "custom"
        bytes conditions; // Encoded conditions
        IntentStatus status;
        uint256 executionCount;
        bytes lastError;
    }

    enum IntentStatus {
        Active,
        Paused,
        Executed,
        Expired,
        Cancelled,
        Failed
    }

    // Events
    event IntentCreated(
        bytes32 indexed intentId,
        address indexed creator,
        bytes intentType,
        uint256 expiresAt
    );

    event IntentExecuted(
        bytes32 indexed intentId,
        address indexed executor,
        bytes32 indexed txHash,
        uint256 timestamp
    );

    event IntentStatusChanged(
        bytes32 indexed intentId,
        IntentStatus oldStatus,
        IntentStatus newStatus
    );

    event IntentPaused(bytes32 indexed intentId, string reason);
    event IntentResumed(bytes32 indexed intentId);

    // View functions
    function getIntent(bytes32 intentId) external view returns (Intent memory);
    function getIntentStatus(bytes32 intentId) external view returns (IntentStatus);
    function getUserIntents(address user) external view returns (bytes32[] memory);
    function getActiveIntents() external view returns (bytes32[] memory);

    // Write functions
    function createIntent(
        bytes memory intentType,
        bytes memory conditions,
        uint256 expirationTime
    ) external returns (bytes32 intentId);

    function executeIntent(bytes32 intentId, bytes32 txHash) external;
    function pauseIntent(bytes32 intentId, string memory reason) external;
    function resumeIntent(bytes32 intentId) external;
    function cancelIntent(bytes32 intentId) external;
    function recordError(bytes32 intentId, bytes memory error) external;
}

contract IntentRegistry is IIntentRegistry {
    // State variables
    mapping(bytes32 => Intent) public intents;
    mapping(address => bytes32[]) public userIntents;
    bytes32[] public activeIntents;

    address public owner;
    address public creExecutor; // CRE Executor address

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyExecutor() {
        require(msg.sender == creExecutor, "Only CRE executor");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ============= Admin Functions =============

    /**
     * Set CRE executor address (typically the Safe module)
     */
    function setCreExecutor(address _creExecutor) external onlyOwner {
        creExecutor = _creExecutor;
    }

    // ============= Intent Management =============

    /**
     * Create a new intent
     */
    function createIntent(
        bytes memory intentType,
        bytes memory conditions,
        uint256 expirationTime
    ) external override returns (bytes32 intentId) {
        require(expirationTime > block.timestamp, "Invalid expiration");

        // Generate intent ID
        intentId = keccak256(
            abi.encodePacked(msg.sender, block.timestamp, block.number)
        );

        // Store intent
        intents[intentId] = Intent({
            creator: msg.sender,
            createdAt: block.timestamp,
            expiresAt: expirationTime,
            intentType: intentType,
            conditions: conditions,
            status: IntentStatus.Active,
            executionCount: 0,
            lastError: ""
        });

        // Track user intents
        userIntents[msg.sender].push(intentId);
        activeIntents.push(intentId);

        emit IntentCreated(intentId, msg.sender, intentType, expirationTime);
    }

    /**
     * Execute intent (called by CRE executor)
     */
    function executeIntent(bytes32 intentId, bytes32 txHash)
        external
        override
        onlyExecutor
    {
        Intent storage intent = intents[intentId];
        require(intent.creator != address(0), "Intent not found");
        require(intent.status == IntentStatus.Active, "Intent not active");
        require(block.timestamp <= intent.expiresAt, "Intent expired");

        // Update status
        intent.status = IntentStatus.Executed;
        intent.executionCount++;

        // Remove from active intents
        _removeFromActive(intentId);

        emit IntentExecuted(intentId, msg.sender, txHash, block.timestamp);
    }

    /**
     * Pause intent execution
     */
    function pauseIntent(bytes32 intentId, string memory reason)
        external
        override
    {
        Intent storage intent = intents[intentId];
        require(intent.creator == msg.sender || msg.sender == owner, "Not authorized");
        require(intent.status == IntentStatus.Active, "Intent not active");

        intent.status = IntentStatus.Paused;
        emit IntentPaused(intentId, reason);
    }

    /**
     * Resume paused intent
     */
    function resumeIntent(bytes32 intentId) external override {
        Intent storage intent = intents[intentId];
        require(intent.creator == msg.sender || msg.sender == owner, "Not authorized");
        require(intent.status == IntentStatus.Paused, "Intent not paused");
        require(block.timestamp <= intent.expiresAt, "Intent expired");

        intent.status = IntentStatus.Active;
        activeIntents.push(intentId);

        emit IntentResumed(intentId);
    }

    /**
     * Cancel intent
     */
    function cancelIntent(bytes32 intentId) external override {
        Intent storage intent = intents[intentId];
        require(intent.creator == msg.sender || msg.sender == owner, "Not authorized");

        IntentStatus oldStatus = intent.status;
        intent.status = IntentStatus.Cancelled;

        _removeFromActive(intentId);
        emit IntentStatusChanged(intentId, oldStatus, IntentStatus.Cancelled);
    }

    /**
     * Record execution error
     */
    function recordError(bytes32 intentId, bytes memory error)
        external
        override
        onlyExecutor
    {
        Intent storage intent = intents[intentId];
        require(intent.creator != address(0), "Intent not found");

        intent.lastError = error;
        intent.status = IntentStatus.Failed;

        _removeFromActive(intentId);
    }

    // ============= View Functions =============

    /**
     * Get intent details
     */
    function getIntent(bytes32 intentId)
        external
        view
        override
        returns (Intent memory)
    {
        return intents[intentId];
    }

    /**
     * Get intent status
     */
    function getIntentStatus(bytes32 intentId)
        external
        view
        override
        returns (IntentStatus)
    {
        return intents[intentId].status;
    }

    /**
     * Get all intents for a user
     */
    function getUserIntents(address user)
        external
        view
        override
        returns (bytes32[] memory)
    {
        return userIntents[user];
    }

    /**
     * Get all active intents
     */
    function getActiveIntents()
        external
        view
        override
        returns (bytes32[] memory)
    {
        return activeIntents;
    }

    // ============= Internal Helpers =============

    /**
     * Remove intent from active list
     */
    function _removeFromActive(bytes32 intentId) internal {
        for (uint256 i = 0; i < activeIntents.length; i++) {
            if (activeIntents[i] == intentId) {
                activeIntents[i] = activeIntents[activeIntents.length - 1];
                activeIntents.pop();
                break;
            }
        }
    }
}
