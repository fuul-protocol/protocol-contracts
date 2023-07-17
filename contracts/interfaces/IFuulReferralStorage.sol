// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/IAccessControlEnumerable.sol";

interface IFuulReferralStorage is IAccessControlEnumerable {
    event CodeRegistered(address account, bytes32 code);
    event CodeOwnerUpdated(address account, address newAccount, bytes32 code);

    error ZeroAddress();
    error Unauthorized();
    error AlreadyExists();
    error NotExists();
    error InvalidCode();

    function codeOwners(bytes32 code) external view returns (address);

    function registerCode(bytes32 code) external;

    function updateCodeOwner(bytes32 code, address newAccount) external;

    function adminUpdateCodeOwner(bytes32 code, address newAccount) external;

    function removeCode(bytes32 code) external;

    function adminRemoveCode(bytes32 code) external;
}
