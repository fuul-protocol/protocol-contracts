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

    // Address that will collect protocol fees
    address public protocolFeeCollector;

    // Currency paid for NFT fixed fees
    address public nftFeeCurrency;

    // Fixed fee for NFT rewards
    uint256 public nftFixedFeeAmount = 0.1 ether;

    // Protocol fee percentage. 1 => 0.01%
    uint256 public protocolFee = 100;

    // Client fee. 1 => 0.01%
    uint256 public clientFee = 100;

    // Attributor fee. 1 => 0.01%
    uint256 public attributorFee = 100;

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
    constructor(
        address _fuulManager,
        address _protocolFeeCollector,
        address _nftFeeCurrency
    ) {
        fuulManager = _fuulManager;
        fuulProjectImplementation = address(new FuulProject());

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

        protocolFeeCollector = _protocolFeeCollector;
        nftFeeCurrency = _nftFeeCurrency;
    }

    /*╔═════════════════════════════╗
      ║        CREATE PROJECT       ║
      ╚═════════════════════════════╝*/

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
        if (
            _projectAdmin == address(0) ||
            _projectEventSigner == address(0) ||
            _clientFeeCollector == address(0)
        ) {
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

    /*╔═════════════════════════════╗
      ║        FEES VARIABLES       ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Returns all fees for attribution.
     * The function purpose is to pass all data when attributing.
     * Reverts with a ManagerIsPaused error.
     */
    function getFeesInformation()
        external
        view
        returns (FeesInformation memory, address)
    {
        return (
            FeesInformation({
                protocolFee: protocolFee,
                attributorFee: attributorFee,
                clientFee: clientFee,
                protocolFeeCollector: protocolFeeCollector,
                nftFixedFeeAmount: nftFixedFeeAmount,
                nftFeeCurrency: nftFeeCurrency
            }),
            fuulManager
        );
    }

    /**
     * @dev Sets the protocol fees for each attribution.
     *
     * Requirements:
     *
     * - `_value` must be different from the current one.
     * - Only admins can call this function.
     */
    function setProtocolFee(
        uint256 _value
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_value == protocolFee) {
            revert IFuulManager.InvalidArgument();
        }

        protocolFee = _value;
    }

    /**
     * @dev Sets the fees for the client that was used to create the project.
     *
     * Requirements:
     *
     * - `_value` must be different from the current one.
     * - Only admins can call this function.
     */
    function setClientFee(
        uint256 _value
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_value == clientFee) {
            revert IFuulManager.InvalidArgument();
        }

        clientFee = _value;
    }

    /**
     * @dev Sets the fees for the attributor.
     *
     * Requirements:
     *
     * - `_value` must be different from the current one.
     * - Only admins can call this function.
     */
    function setAttributorFee(
        uint256 _value
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_value == attributorFee) {
            revert IFuulManager.InvalidArgument();
        }

        attributorFee = _value;
    }

    /**
     * @dev Sets the fixed fee amount for NFT rewards.
     *
     * Requirements:
     *
     * - `_value` must be different from the current one.
     * - Only admins can call this function.
     */
    function setNftFixedFeeAmounte(
        uint256 _value
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_value == nftFixedFeeAmount) {
            revert IFuulManager.InvalidArgument();
        }

        nftFixedFeeAmount = _value;
    }

    /**
     * @dev Sets the currency that will be used to pay NFT rewards fees.
     *
     * Requirements:
     *
     * - `_value` must be different from the current one.
     * - Only admins can call this function.
     */
    function setNftFeeCurrency(
        address newCurrency
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newCurrency == nftFeeCurrency) {
            revert IFuulManager.InvalidArgument();
        }

        nftFeeCurrency = newCurrency;
    }

    /**
     * @dev Sets the protocol fee collector address.
     *
     * Requirements:
     *
     * - `_value` must be different from the current one.
     * - Only admins can call this function.
     */
    function setProtocolFeeCollector(
        address newCollector
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newCollector == protocolFeeCollector) {
            revert IFuulManager.InvalidArgument();
        }

        protocolFeeCollector = newCollector;
    }
}
