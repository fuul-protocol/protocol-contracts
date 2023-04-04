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

    event ProjectCreated(address deployedAddress, address eventSigner);

    constructor(address _fuulManager) {
        fuulManager = _fuulManager;
        fuulProjectImplementation = address(new FuulProject());

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function createFuulProject(address _projectEventSigner) external {
        address clone = Clones.clone(fuulProjectImplementation);
        FuulProject(clone).initialize(_projectEventSigner);

        _projectTracker.increment();
        projects[projectsCreated()] = address(clone);

        emit ProjectCreated(address(clone), _projectEventSigner);
    }

    function projectsCreated() public view returns (uint256) {
        return _projectTracker.current();
    }

    function setFuulManager(
        address _fuulManager
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            _fuulManager != fuulManager,
            "Address cannot be the same as current"
        );
        fuulManager = _fuulManager;
    }
}
