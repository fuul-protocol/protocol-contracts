// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

interface IFuulFactory {
    function createFuulProject(address _projectEventSigner) external;

    function projects(uint256 projectId) external returns (address);

    function projectsCreated() external view returns (uint256);

    function fuulManager() external view returns (address);

    function setFuulManager(address _fuulManager) external;
}
