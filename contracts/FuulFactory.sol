// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./FuulProject.sol";
import "./interfaces/IFuulFactory.sol";

contract FuulFactory is IFuulFactory, AccessControlEnumerable {
    using Counters for Counters.Counter;

    address immutable fuulProjectImplementation;

    Counters.Counter private _projectTracker;

    address public fuulManager;

    mapping(uint256 => address) public projects;

    event ProjectCreated(
        uint256 projectId,
        address deployedAddress,
        address eventSigner,
        string projectInfoURI
    );

    constructor(address _fuulManager) {
        fuulManager = _fuulManager;
        fuulProjectImplementation = address(new FuulProject());

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function createFuulProject(
        address _projectAdmin,
        address _projectEventSigner,
        string memory _projectInfoURI
    ) external {
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

    function projectsCreated() public view returns (uint256) {
        return _projectTracker.current();
    }

    // Checked received?

    function setFuulManager(
        address _fuulManager
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_fuulManager == fuulManager) {
            revert SameAddressValue(_fuulManager);
        }
        fuulManager = _fuulManager;
    }
}
