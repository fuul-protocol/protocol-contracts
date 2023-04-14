// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./FuulProject.sol";
import "./interfaces/IFuulFactory.sol";

contract FuulFactory is IFuulFactory, AccessControlEnumerable {
    using Counters for Counters.Counter;

    // Tracker of the number of projects created
    Counters.Counter private _projectTracker;

    // Implementation contract address
    address immutable fuulProjectImplementation;

    // Fuul Manager address
    address public fuulManager;

    // Mapping project id with deployed contract address
    mapping(uint256 => address) public projects;

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
        string memory _projectInfoURI
    ) external {
        if (_projectAdmin == address(0) || _projectEventSigner == address(0)) {
            revert IFuulProject.ZeroAddress();
        }

        if (bytes(_projectInfoURI).length == 0) {
            revert IFuulProject.EmptyURI();
        }

        address clone = Clones.clone(fuulProjectImplementation);
        FuulProject(clone).initialize(
            _projectAdmin,
            _projectEventSigner,
            _projectInfoURI
        );

        _projectTracker.increment();

        // Is it convenient to do project Ids increasingly or should they be random generated?

        projects[projectsCreated()] = address(clone);

        emit ProjectCreated(
            projectsCreated(),
            address(clone),
            _projectEventSigner,
            _projectInfoURI
        );
    }

    /**
     * @dev Returns the number of projects created.
     */
    function projectsCreated() public view returns (uint256) {
        return _projectTracker.current();
    }

    /**
     * @dev Sets `fuulManager` for all {FuulProject}s to read from.
     *
     * Requirements:
     *
     * - `_fuulManager` must not be the address zero.
     * - `_fuulManager` must be different from the current one.
     * - Only admins can call this function.
     */
    function setFuulManager(
        address _fuulManager
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_fuulManager == address(0)) {
            revert IFuulProject.ZeroAddress();
        }
        if (_fuulManager == fuulManager) {
            revert IFuulManager.InvalidArgument();
        }
        fuulManager = _fuulManager;
    }
}
