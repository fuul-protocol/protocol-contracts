// SPDX-License-Identifier: MIT
import "./IFuulManager.sol";

pragma solidity ^0.8.18;

interface IFuulProject {
    /*╔═════════════════════════════╗
      ║           STRUCT            ║
      ╚═════════════════════════════╝*/
    // Campaign info
    struct Campaign {
        uint256 totalDeposited;
        uint256 currentBudget;
        address currency;
        uint256 deactivatedAt;
        IFuulManager.TokenType tokenType;
        address clientFeeCollector;
    }

    // Attribution
    struct Attribution {
        uint256 campaignId;
        uint256 totalAmount;
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

    event CampaignCreated(
        address indexed account,
        address currency,
        uint256 campaignId,
        IFuulManager.TokenType tokenType,
        address clientFeeCollector
    );

    event BudgetDeposited(
        address indexed account,
        uint256 amount,
        address currency,
        uint256 campaignId,
        IFuulManager.TokenType tokenType,
        uint256[] tokenIds,
        uint256[] amounts
    );

    event BudgetRemoved(
        address indexed account,
        uint256 amount,
        address currency,
        uint256 campaignId,
        IFuulManager.TokenType tokenType,
        uint256[] tokenIds,
        uint256[] amounts
    );

    event Claimed(
        uint256 campaignId,
        address indexed account,
        address currency,
        uint256 amount,
        uint256[] rewardTokenIds,
        uint256[] amounts
    );

    // Array Order: protocol, client, attributor, partner, end user

    event Attributed(
        uint256 campaignId,
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
    error ManagerIsNotPaused();

    error CampaignNotExists();
    error EmptyURI();

    error CampaignNotInactive();
    error CampaignNotActive();
    error IncorrectMsgValue();

    error CooldownPeriodNotFinished();
    error ZeroAddress();
    error ZeroAmount();

    // error SameValue(address value);

    /*╔═════════════════════════════╗
      ║       PUBLIC VARIABLES      ║
      ╚═════════════════════════════╝*/

    function fuulFactory() external view returns (address);

    function campaigns(
        uint256 tokenId
    )
        external
        view
        returns (
            uint256,
            uint256,
            address,
            uint256,
            IFuulManager.TokenType,
            address
        );

    function availableToClaim(
        address account,
        uint256 campaignId
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

    function setProjectInfoURI(string memory _projectURI) external;

    /*╔═════════════════════════════╗
      ║         CAMPAIGNS           ║
      ╚═════════════════════════════╝*/

    function campaignsCreated() external view returns (uint256);

    function createCampaign(
        string memory newProjectURI,
        address currency,
        address clientFeeCollector
    ) external;

    function switchCampaignStatus(uint256 tokenId) external;

    /*╔═════════════════════════════╗
      ║           DEPOSIT           ║
      ╚═════════════════════════════╝*/

    function depositFungibleToken(
        uint256 campaignId,
        uint256 amount
    ) external payable;

    function depositNFTToken(
        uint256 campaignId,
        uint256[] memory rewardTokenIds,
        uint256[] memory amounts
    ) external;

    /*╔═════════════════════════════╗
      ║           REMOVE            ║
      ╚═════════════════════════════╝*/

    function getBudgetCooldownPeriod(
        uint256 deactivatedAt
    ) external view returns (uint256);

    function removeFungibleBudget(uint256 campaignId, uint256 amount) external;

    function removeNFTBudget(
        uint256 campaignId,
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

    function claimFromCampaign(
        uint256 campaignId,
        address receiver,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) external returns (uint256, address);
}
