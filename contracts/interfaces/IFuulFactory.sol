// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

interface IFuulFactory {
    struct FeesInformation {
        uint256 protocolFee;
        uint256 attributorFee;
        uint256 clientFee;
        address protocolFeeCollector;
        uint256 nftFixedFeeAmount;
        address nftFeeCurrency;
    }
    event ProjectCreated(
        uint256 indexed projectId,
        address indexed deployedAddress,
        address indexed eventSigner,
        string projectInfoURI,
        address clientFeeCollector
    );

    /*╔═════════════════════════════╗
      ║           ERRORS            ║
      ╚═════════════════════════════╝*/

    error ZeroAddress();
    error TokenCurrencyAlreadyAccepted();
    error TokenCurrencyNotAccepted();

    /*╔═════════════════════════════╗
      ║        CREATE PROJECT       ║
      ╚═════════════════════════════╝*/

    function createFuulProject(
        address _projectAdmin,
        address _projectEventSigner,
        string memory _projectInfoURI,
        address _clientFeeCollector
    ) external;

    function projects(uint256 projectId) external returns (address);

    function totalProjectsCreated() external view returns (uint256);

    function getUserProjectByIndex(
        address account,
        uint256 index
    ) external view returns (address);

    function getUserProjectCount(
        address account
    ) external view returns (uint256);

    /*╔═════════════════════════════╗
      ║           MANAGER           ║
      ╚═════════════════════════════╝*/

    function fuulManager() external view returns (address);

    function setFuulManager(address _fuulManager) external;

    /*╔═════════════════════════════╗
      ║        FEES VARIABLES       ║
      ╚═════════════════════════════╝*/

    function protocolFee() external view returns (uint256 fees);

    function protocolFeeCollector() external view returns (address);

    function getFeesInformation()
        external
        returns (FeesInformation memory, address);

    function clientFee() external view returns (uint256 fees);

    function attributorFee() external view returns (uint256 fees);

    function nftFeeCurrency() external view returns (address);

    function setProtocolFee(uint256 value) external;

    function setClientFee(uint256 value) external;

    function setAttributorFee(uint256 value) external;

    function setNftFixedFeeAmounte(uint256 _value) external;

    function setNftFeeCurrency(address newCurrency) external;

    /*╔═════════════════════════════╗
      ║       TOKEN CURRENCIES      ║
      ╚═════════════════════════════╝*/

    function acceptedCurrencies(
        address tokenAddress
    ) external view returns (bool);

    function addCurrencyToken(address tokenAddress) external;

    function removeCurrencyToken(address tokenAddress) external;

    /*╔═════════════════════════════╗
      ║       REMOVE VARIABLES      ║
      ╚═════════════════════════════╝*/

    function projectBudgetCooldown() external view returns (uint256 period);

    function getBudgetRemoveInfo()
        external
        view
        returns (uint256 cooldown, uint256 removeWindow);

    function setProjectBudgetCooldown(uint256 period) external;

    function setProjectRemoveBudgetPeriod(uint256 period) external;
}
