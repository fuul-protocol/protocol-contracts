// SPDX-License-Identifier: MIT
import "./IFuulManager.sol";

pragma solidity ^0.8.18;

interface IFuulProject {
    /*╔═════════════════════════════╗
      ║           STRUCT            ║
      ╚═════════════════════════════╝*/

    // Attribution
    struct Attribution {
        address currency;
        address partner;
        address endUser;
        uint256 amountToPartner;
        uint256 amountToEndUser;
    }

    /*╔═════════════════════════════╗
      ║           EVENTS            ║
      ╚═════════════════════════════╝*/

    // uint256[] tokenIds: used in ERC721 and ERC1155
    // uint256[] amounts: used in ERC1155

    event ProjectInfoUpdated(string projectInfoURI);

    event BudgetDeposited(
        address indexed account,
        uint256 amount,
        address currency,
        IFuulManager.TokenType tokenType,
        uint256[] tokenIds,
        uint256[] amounts
    );

    event BudgetRemoved(
        address indexed account,
        uint256 amount,
        address currency,
        IFuulManager.TokenType tokenType,
        uint256[] tokenIds,
        uint256[] amounts
    );

    event Claimed(
        address indexed account,
        address currency,
        uint256 amount,
        uint256[] rewardTokenIds,
        uint256[] amounts
    );

    // Array Order: protocol, client, attributor, partner, end user

    event Attributed(
        address currency,
        uint256 totalAmount,
        address[5] receivers,
        uint256[5] amounts
    );

    event FeeBudgetDeposited(
        address indexed account,
        uint256 amount,
        address currency
    );

    event FeeBudgetRemoved(
        address indexed account,
        uint256 amount,
        address currency
    );

    /*╔═════════════════════════════╗
      ║           ERRORS            ║
      ╚═════════════════════════════╝*/

    error ManagerIsPaused();
    error EmptyURI();
    error NoRemovalApplication();
    error IncorrectMsgValue();
    error CooldownPeriodNotFinished();
    error ZeroAmount();
    error Unauthorized();

    /*╔═════════════════════════════╗
      ║       PUBLIC VARIABLES      ║
      ╚═════════════════════════════╝*/

    function fuulFactory() external view returns (address);

    function availableToClaim(
        address account,
        address currency
    ) external view returns (uint256);

    /*╔═════════════════════════════╗
      ║     FROM OTHER CONTRACTS    ║
      ╚═════════════════════════════╝*/

    function fuulManagerAddress() external view returns (address);

    function fuulManagerInstance() external view returns (IFuulManager);

    /*╔═════════════════════════════╗
      ║        PROJECT INFO         ║
      ╚═════════════════════════════╝*/

    function projectInfoURI() external view returns (string memory);

    function setProjectURI(string memory _projectURI) external;

    function clientFeeCollector() external view returns (address);

    /*╔═════════════════════════════╗
      ║           DEPOSIT           ║
      ╚═════════════════════════════╝*/

    function depositFungibleToken(
        address currency,
        uint256 amount
    ) external payable;

    function depositNFTToken(
        address currency,
        uint256[] memory rewardTokenIds,
        uint256[] memory amounts
    ) external;

    /*╔═════════════════════════════╗
      ║           REMOVE            ║
      ╚═════════════════════════════╝*/

    function lastRemovalApplication() external view returns (uint256);

    function applyToRemoveBudget() external;

    function getBudgetCooldownPeriod() external view returns (uint256);

    function removeFungibleBudget(address currency, uint256 amount) external;

    function removeNFTBudget(
        address currency,
        uint256[] memory rewardTokenIds,
        uint256[] memory amounts
    ) external;

    /*╔═════════════════════════════╗
      ║          ATTRIBUTE          ║
      ╚═════════════════════════════╝*/

    function attributeTransactions(
        Attribution[] calldata attributions,
        address attributorFeeCollector
    ) external;

    /*╔═════════════════════════════╗
      ║            CLAIM            ║
      ╚═════════════════════════════╝*/

    function claimFromProject(
        address currency,
        address receiver,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) external returns (uint256, address);
}
