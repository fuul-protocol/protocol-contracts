// SPDX-License-Identifier: MIT

import "./IFuulProject.sol";

pragma solidity ^0.8.18;

interface IFuulManager {
    struct CurrencyToken {
        uint256 claimLimitPerCooldown;
        uint256 cumulativeClaimPerCooldown;
        uint256 claimCooldownPeriodStarted;
        bool isActive;
    }

    struct ClaimCheck {
        address projectAddress;
        address currency;
        uint256[] tokenIds;
        uint256[] amounts;
    }

    struct AttributionEntity {
        address projectAddress;
        IFuulProject.Attribution[] projectAttributions;
    }

    /*╔═════════════════════════════╗
      ║           ERRORS            ║
      ╚═════════════════════════════╝*/

    error InvalidArgument();
    error TokenCurrencyAlreadyAccepted();
    error TokenCurrencyNotAccepted();
    error OverTheLimit();

    /*╔═════════════════════════════╗
      ║       PUBLIC VARIABLES      ║
      ╚═════════════════════════════╝*/

    function projectBudgetCooldown() external view returns (uint256 period);

    function getBudgetRemoveInfo()
        external
        view
        returns (uint256 cooldown, uint256 removeWindow);

    function claimCooldown() external view returns (uint256 period);

    function usersClaims(
        address user,
        address currency
    ) external view returns (uint256);

    /*╔═════════════════════════════╗
      ║       REMOVE VARIABLES      ║
      ╚═════════════════════════════╝*/

    function setClaimCooldown(uint256 _period) external;

    function setProjectBudgetCooldown(uint256 period) external;

    /*╔═════════════════════════════╗
      ║       TOKEN CURRENCIES      ║
      ╚═════════════════════════════╝*/

    function currencyTokens(
        address currencyToken
    ) external view returns (uint256, uint256, uint256, bool);

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
        AttributionEntity[] memory attributions,
        address attributorFeeCollector
    ) external;

    function claim(ClaimCheck[] calldata claimChecks) external;
}
