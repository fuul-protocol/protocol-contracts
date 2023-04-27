// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "./FuulProject.sol";
import "./interfaces/IFuulFactory.sol";

contract FuulFactory is IFuulFactory, AccessControlEnumerable {
    using Counters for Counters.Counter;
    using EnumerableSet for EnumerableSet.AddressSet;

    // Tracker of the number of projects created
    Counters.Counter private _projectTracker;

    // Implementation contract address
    address immutable fuulProjectImplementation;

    // Fuul Manager address
    address public fuulManager;

    // Mapping project id with deployed contract address
    mapping(uint256 => address) public projects;

    // Mapping accounts with created project contract address
    mapping(address => EnumerableSet.AddressSet) userProjects;

    /**
     * @dev Sets the values for {fuulManager} and {fuulProjectImplementation}.
     * It grants the DEFAULT_ADMIN_ROLE to the deployer.
     *
     * `fuulProjectImplementation` value is immutable: it can only be set once during
     * construction.
     */
    constructor(address _fuulManager) {
        fuulManager = _fuulManager;
        fuulProjectImplementation = address(new FuulProject());

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /**
     * @dev Creates a new Project. It deploys a new clone of the implementation
     * and initializes it.
     * The `projectId` follows the number of projects created.
     *
     * Emits {ProjectCreated}.
     *
     * Requirements:
     *
     * - `_projectAdmin` and `_projectEventSigner` must not be the zero address.
     * - `_projectInfoURI` must not be an empty string.
     */
    function createFuulProject(
        address _projectAdmin,
        address _projectEventSigner,
        string memory _projectInfoURI,
        address _clientFeeCollector
    ) external {
        if (_projectAdmin == address(0) || _projectEventSigner == address(0)) {
            revert ZeroAddress();
        }

        if (bytes(_projectInfoURI).length == 0) {
            revert IFuulProject.EmptyURI();
        }

        address clone = Clones.clone(fuulProjectImplementation);
        FuulProject(clone).initialize(
            _projectAdmin,
            _projectEventSigner,
            _projectInfoURI,
            _clientFeeCollector
        );

        _projectTracker.increment();

        // Is it convenient to do project Ids increasingly or should they be random generated?

        projects[totalProjectsCreated()] = address(clone);

        emit ProjectCreated(
            totalProjectsCreated(),
            address(clone),
            _projectEventSigner,
            _projectInfoURI,
            _clientFeeCollector
        );
    }

    /**
     * @dev Returns the number of total projects created.
     */
    function totalProjectsCreated() public view returns (uint256) {
        return _projectTracker.current();
    }

    /**
     * @dev Returns the project address for an account by index.
     */
    function getUserProjectByIndex(
        address account,
        uint256 index
    ) public view returns (address) {
        return userProjects[account].at(index);
    }

    /**
     * @dev Returns the number of projects created by an account.
     */
    function getUserProjectCount(
        address account
    ) public view returns (uint256) {
        return userProjects[account].length();
    }

    /**
     * @dev Sets `fuulManager` for all {FuulProject}s to read from.
     *
     * Requirements:
     *
     * - {_fuulManager} must not be the zero address.
     * - {_fuulManager} must be different from the current one.
     * - Only admins can call this function.
     */
    function setFuulManager(
        address _fuulManager
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_fuulManager == address(0)) {
            revert ZeroAddress();
        }
        if (_fuulManager == fuulManager) {
            revert IFuulManager.InvalidArgument();
        }
        fuulManager = _fuulManager;
    }
}
