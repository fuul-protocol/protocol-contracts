// SPDX-License-Identifier: MIT
import "./IFuulManager.sol";

pragma solidity ^0.8.18;

interface IFuulProject {
    /*╔═════════════════════════════╗
      ║           EVENTS            ║
      ╚═════════════════════════════╝*/

    // uint256[] tokenIds: used in ERC721 and ERC1155
    // uint256[] amounts: used in ERC1155

    event CampaignMetadataUpdated(uint256 campaignId, string campaignURI);

    event ProjectInfoUpdated(string projectInfoURI);

    event CampaignCreated(
        address indexed account,
        address currency,
        uint256 campaignTokenId,
        IFuulManager.TokenType tokenType,
        string _campaignURI
    );

    event BudgetDeposited(
        address indexed account,
        uint256 amount,
        address currency,
        uint256 campaignTokenId,
        IFuulManager.TokenType tokenType,
        uint256[] tokenIds,
        uint256[] amounts
    );

    event BudgetRemoved(
        address indexed account,
        uint256 amount,
        address currency,
        uint256 campaignTokenId,
        IFuulManager.TokenType tokenType,
        uint256[] tokenIds,
        uint256[] amounts
    );

    event Claimed(
        uint256 campaignTokenId,
        address indexed account,
        address currency,
        uint256 amount,
        uint256[] rewardTokenIds,
        uint256[] amounts
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
            string memory,
            IFuulManager.TokenType
        );

    function usersEarnings(
        address account,
        uint256 campaignId
    ) external view returns (uint256, uint256);

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

    function createCampaign(string memory _tokenURI, address currency) external;

    function reactivateCampaign(uint256 tokenId) external;

    function deactivateCampaign(uint256 tokenId) external;

    function setCampaignURI(uint256 _tokenId, string memory _tokenURI) external;

    /*╔═════════════════════════════╗
      ║           DEPOSIT           ║
      ╚═════════════════════════════╝*/

    function depositFungibleToken(
        uint256 campaignTokenId,
        uint256 amount
    ) external payable;

    function depositNFTToken(
        uint256 campaignTokenId,
        uint256[] memory rewardTokenIds,
        uint256[] memory amounts
    ) external;

    /*╔═════════════════════════════╗
      ║           REMOVE            ║
      ╚═════════════════════════════╝*/

    function getBudgetCooldownPeriod(
        uint256 deactivatedAt
    ) external view returns (uint256);

    function removeFungibleBudget(
        uint256 campaignTokenId,
        uint256 amount
    ) external;

    function removeNFTBudget(
        uint256 campaignTokenId,
        uint256[] memory rewardTokenIds,
        uint256[] memory amounts
    ) external;

    /*╔═════════════════════════════╗
      ║          ATTRIBUTE          ║
      ╚═════════════════════════════╝*/

    function attributeTransactions(
        uint256[] calldata campaignIds,
        address[] calldata receivers,
        uint256[] calldata amounts
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

    /*╔═════════════════════════════╗
      ║          EMERGENCY          ║
      ╚═════════════════════════════╝*/

    function emergencyWithdrawFungibleTokens(
        address to,
        address currency
    ) external;

    function emergencyWithdrawNFTTokens(
        address to,
        address currency,
        uint256[] memory rewardTokenIds,
        uint256[] memory amounts
    ) external;
}
