// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title MockSafe
 * @dev Minimal Safe-compatible contract for testnet deployment.
 *      IntentWallet expects a Safe with execTransactionFromModule.
 */
contract MockSafe {
    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes memory data,
        uint8 operation
    ) external returns (bool success) {
        (to); (value); (data); (operation);
        return true;
    }
}
