// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

interface IFuulFactory {
    event ProjectCreated(
        uint256 indexed projectId,
        address indexed deployedAddress,
        address indexed eventSigner,
        string projectInfoURI,
        address clientFeeCollector
    );

    function createFuulProject(
        address _projectAdmin,
        address _projectEventSigner,
        string memory _projectInfoURI,
        address _clientFeeCollector
    ) external;

    error ZeroAddress();

    function projects(uint256 projectId) external returns (address);

    function totalProjectsCreated() external view returns (uint256);

    function getUserProjectByIndex(
        address account,
        uint256 index
    ) external view returns (address);

    function getUserProjectCount(
        address account
    ) external view returns (uint256);

    function fuulManager() external view returns (address);

    function setFuulManager(address _fuulManager) external;
}
