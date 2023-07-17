// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "./interfaces/IFuulReferralStorage.sol";

contract FuulReferralStorage is AccessControlEnumerable, IFuulReferralStorage {
    mapping(bytes32 => address) public codeOwners;

    /**
     * @dev Grants DEFAULT_ADMIN_ROLE role to the deployer.
     */
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /**
     * @dev Registers new code to msg.sender.
     *
     * Emits {CodeRegistered}.
     */

    function registerCode(bytes32 code) external {
        if (code == bytes32(0)) {
            revert InvalidCode();
        }

        if (codeOwners[code] != address(0)) {
            revert AlreadyExists();
        }

        codeOwners[code] = _msgSender();
        emit CodeRegistered(_msgSender(), code);
    }

    /*╔═════════════════════════════╗
      ║           UPDATE            ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Internal function to update code owner.
     *
     * Emits {CodeOwnerUpdated}.
     *
     * Requirements:
     *
     * - New account must not be the zero address.
     */

    function _updateCodeOwner(bytes32 code, address newAccount) internal {
        if (newAccount == address(0)) {
            revert ZeroAddress();
        }

        codeOwners[code] = newAccount;
        emit CodeOwnerUpdated(_msgSender(), newAccount, code);
    }

    /**
     * @dev Updates code owner.
     *
     * Requirements:
     *
     * - Sender must be the owner of the code.
     */

    function updateCodeOwner(bytes32 code, address newAccount) external {
        if (_msgSender() != codeOwners[code]) {
            revert Unauthorized();
        }

        _updateCodeOwner(code, newAccount);
    }

    /**
     * @dev Admin updates code owner.
     *
     * Requirements:
     *
     * - Only admins.
     * - Code must exist.

     */
    function adminUpdateCodeOwner(
        bytes32 code,
        address newAccount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (codeOwners[code] == address(0)) {
            revert NotExists();
        }

        _updateCodeOwner(code, newAccount);
    }

    /*╔═════════════════════════════╗
      ║           REMOVE            ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Internal function to remove code.
     *
     * Emits {CodeOwnerUpdated}.
     *
     */
    function _removeCode(bytes32 code) internal {
        codeOwners[code] = address(0);
        emit CodeOwnerUpdated(_msgSender(), address(0), code);
    }

    /**
     * @dev Removes code.
     *
     * Requirements:
     *
     * - Sender must be the owner of the code.
     */
    function removeCode(bytes32 code) external {
        if (_msgSender() != codeOwners[code]) {
            revert Unauthorized();
        }

        _removeCode(code);
    }

    /**
     * @dev Admin removes code from owner.
     *
     * Requirements:
     *
     * - Only admins.
     * - Code must exist.
     */
    function adminRemoveCode(
        bytes32 code
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (codeOwners[code] == address(0)) {
            revert NotExists();
        }
        _removeCode(code);
    }
}
