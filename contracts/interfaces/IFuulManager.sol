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

    struct ClaimVoucher {
        string voucherId;
        address projectAddress;
        uint256 campaignId;
        address currency;
        TokenType tokenType;
        address account;
        uint256 amount;
        uint256[] tokenIds; // used for ERC721 and ERC1155
        uint256[] amounts; // used for ERC1155
        uint256 deadline;
    }

    /*╔═════════════════════════════╗
      ║           ERRORS            ║
      ╚═════════════════════════════╝*/

    error InvalidUintArgument(uint256 value);
    error InvalidAddressArgument(address value);
    error InvalidTokenTypeArgument(TokenType value);

    error TokenCurrencyAlreadyAccepted(address tokenAddress);
    error TokenCurrencyNotAccepted(address tokenAddress);

    // Voucher
    error InvalidSignature();
    error ClaimedVoucher(string voucherId);
    error VoucherExpired(uint256 deadline, uint256 now);
    error Unauthorized(address sender, address requiredSender);
    error ClaimingFreqNotFinished();
    error OverTheLimit(uint256 amount, uint256 limit);

    /*╔═════════════════════════════╗
      ║       PUBLIC VARIABLES      ║
      ╚═════════════════════════════╝*/

    function campaignBudgetCooldown() external view returns (uint256 period);

    function claimCooldown() external view returns (uint256 period);

    function claimFrequency() external view returns (uint256 period);

    function usersClaims(
        address user,
        address currency
    ) external view returns (uint256, uint256);

    /*╔═════════════════════════════╗
      ║       REMOVE VARIABLES      ║
      ╚═════════════════════════════╝*/

    function claimCooldownEnd(
        uint256 claimCooldownPeriodStarted
    ) external view returns (uint256);

    function setClaimCooldown(uint256 _period) external;

    function setCampaignBudgetCooldown(uint256 period) external;

    function setClaimFrequency(uint256 period) external;

    /*╔═════════════════════════════╗
      ║       TOKEN CURRENCIES      ║
      ╚═════════════════════════════╝*/

    function currencyTokens(
        address currencyToken
    ) external view returns (TokenType, uint256, uint256, uint256);

    function getTokenType(
        address currencyToken
    ) external view returns (TokenType tokenType);

    function isCurrencyTokenAccepted(
        address currencyToken
    ) external view returns (bool isAccepted);

    function addCurrencyToken(
        address tokenAddress,
        TokenType tokenType,
        uint256 claimLimitPerCooldown
    ) external;

    function removeCurrencyToken(address tokenAddress) external;

    function setCurrencyTokenLimit(
        address tokenAddress,
        uint256 limit
    ) external;

    function setCurrencyTokenType(
        address tokenAddress,
        TokenType tokenType
    ) external;

    /*╔═════════════════════════════╗
      ║            PAUSE            ║
      ╚═════════════════════════════╝*/

    function pauseAll() external;

    function unpauseAll() external;

    function isPaused() external view returns (bool);

    /*╔═════════════════════════════╗
      ║      CLAIM FROM CAMPAIGN    ║
      ╚═════════════════════════════╝*/

    // function claimFromCampaign(
    //     ClaimVoucher calldata voucher,
    //     bytes calldata signature
    // ) external;

    /*╔═════════════════════════════╗
      ║          EMERGENCY          ║
      ╚═════════════════════════════╝*/

    // function emergencyWithdrawFungibleTokensFromProjects(
    //     address to,
    //     FuulProjectFungibleCurrencies[] memory projectsCurrencies
    // ) external;

    // function emergencyWithdrawNFTTokensFromProject(
    //     address to,
    //     address fuulProject,
    //     address currency,
    //     uint256[] memory tokenIds,
    //     uint256[] memory amounts
    // ) external;
}
