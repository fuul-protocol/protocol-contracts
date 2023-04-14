// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

interface IFuulFactory {
    error SameAddressValue(address value);

    function createFuulProject(
        address _projectAdmin,
        address _projectEventSigner,
        string memory _projectInfoURI
    ) external;

    function projects(uint256 projectId) external returns (address);

    function projectsCreated() external view returns (uint256);

    function fuulManager() external view returns (address);

    function setFuulManager(address _fuulManager) external;
}
