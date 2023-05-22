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
        bytes32 proof;
    }

    /*╔═════════════════════════════╗
      ║           EVENTS            ║
      ╚═════════════════════════════╝*/

    // uint256[] tokenIds: used in ERC721 and ERC1155
    // uint256[] amounts: used in ERC1155

    event ProjectInfoUpdated(string projectInfoURI);

    event FungibleBudgetDeposited(
        address indexed account,
        uint256 indexed amount,
        address indexed currency
    );

    event NFTBudgetDeposited(
        address indexed account,
        uint256 indexed amount,
        address indexed currency,
        uint256[] tokenIds,
        uint256[] amounts
    );

    event FungibleBudgetRemoved(
        address indexed account,
        uint256 indexed amount,
        address indexed currency
    );

    event NFTBudgetRemoved(
        address indexed account,
        uint256 indexed amount,
        address indexed currency,
        uint256[] tokenIds,
        uint256[] amounts
    );

    event Claimed(
        address indexed account,
        address indexed currency,
        uint256 indexed amount,
        uint256[] rewardTokenIds,
        uint256[] amounts
    );

    // Array Order: protocol, client, attributor, partner, end user

    event Attributed(
        address indexed currency,
        uint256 indexed totalAmount,
        address[5] receivers,
        uint256[5] amounts,
        bytes32 proof
    );

    event FeeBudgetDeposited(
        address indexed account,
        uint256 indexed amount,
        address indexed currency
    );

    event FeeBudgetRemoved(
        address indexed account,
        uint256 indexed amount,
        address indexed currency
    );

    /*╔═════════════════════════════╗
      ║           ERRORS            ║
      ╚═════════════════════════════╝*/

    error ManagerIsPaused();
    error EmptyURI();
    error NoRemovalApplication();
    error IncorrectMsgValue();
    error OutsideRemovalWindow();
    error ZeroAmount();
    error AlreadyAttributed();
    error Forbidden();
    error InvalidCurrency();
    error InvalidArgument();

    /*╔═════════════════════════════╗
      ║       PUBLIC VARIABLES      ║
      ╚═════════════════════════════╝*/

    function fuulFactory() external view returns (address);

    function availableToClaim(
        address account,
        address currency
    ) external view returns (uint256);

    /*╔═════════════════════════════╗
      ║        PROJECT INFO         ║
      ╚═════════════════════════════╝*/

    function projectInfoURI() external view returns (string memory);

    function setProjectURI(string memory projectURI) external;

    function clientFeeCollector() external view returns (address);

    function lastStatusHash() external view returns (bytes32);

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

    function getBudgetRemovePeriod() external view returns (uint256, uint256);

    function canRemoveFunds() external view returns (bool insideRemovalWindow);

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
    ) external returns (uint256);
}
