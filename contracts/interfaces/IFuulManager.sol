// SPDX-License-Identifier: MIT

import "./IFuulProject.sol";

pragma solidity ^0.8.18;

interface IFuulManager {
    enum TokenType {
        NATIVE,
        ERC_20,
        ERC_721,
        ERC_1155
    }

    struct ClaimCheck {
        address projectAddress;
        uint256 campaignId;
        uint256[] tokenIds;
        uint256[] amounts;
    }

    struct AttributeCheck {
        address projectAddress;
        uint256[] campaignIds;
        address[] receivers;
        uint256[] amounts;
    }

    struct FuulProjectFungibleCurrencies {
        address deployedAddress;
        address[] currencies;
    }
    /*╔═════════════════════════════╗
      ║           ERRORS            ║
      ╚═════════════════════════════╝*/

    error InvalidArgument();
    error TokenCurrencyAlreadyAccepted();
    error TokenCurrencyNotAccepted();
    error InvalidSignature();
    error Unauthorized();
    error OverTheLimit();

    /*╔═════════════════════════════╗
      ║       PUBLIC VARIABLES      ║
      ╚═════════════════════════════╝*/

    function campaignBudgetCooldown() external view returns (uint256 period);

    function claimCooldown() external view returns (uint256 period);

    function usersClaims(
        address user,
        address currency
    ) external view returns (uint256);

    /*╔═════════════════════════════╗
      ║       REMOVE VARIABLES      ║
      ╚═════════════════════════════╝*/

    function setClaimCooldown(uint256 _period) external;

    function setCampaignBudgetCooldown(uint256 period) external;

    /*╔═════════════════════════════╗
      ║       TOKEN CURRENCIES      ║
      ╚═════════════════════════════╝*/

    function currencyTokens(
        address currencyToken
    ) external view returns (TokenType, uint256, uint256, uint256, bool);

    function getTokenType(
        address currencyToken
    ) external view returns (TokenType tokenType);

    function isCurrencyTokenAccepted(
        address currencyToken
    ) external view returns (bool isAccepted);

    function addCurrencyToken(
        address tokenAddress,
        uint256 claimLimitPerCooldown
    ) external;

    function removeCurrencyToken(address tokenAddress) external;

    function setCurrencyTokenLimit(
        address tokenAddress,
        uint256 limit
    ) external;

    /*╔═════════════════════════════╗
      ║            PAUSE            ║
      ╚═════════════════════════════╝*/

    function pauseAll() external;

    function unpauseAll() external;

    function isPaused() external view returns (bool);

    /*╔═════════════════════════════╗
      ║      ATTRIBUTE AND CLAIM    ║
      ╚═════════════════════════════╝*/

    function attributeTransactions(
        AttributeCheck[] calldata attributeChecks
    ) external;

    function claim(ClaimCheck[] calldata claimChecks) external;

    /*╔═════════════════════════════╗
      ║          EMERGENCY          ║
      ╚═════════════════════════════╝*/

    function emergencyWithdrawFungibleTokensFromProjects(
        address to,
        FuulProjectFungibleCurrencies[] memory projectsCurrencies
    ) external;

    function emergencyWithdrawNFTsFromProject(
        address to,
        address fuulProject,
        address currency,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) external;
}
