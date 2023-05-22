// SPDX-License-Identifier: MIT

import "./IFuulProject.sol";

pragma solidity ^0.8.18;

interface IFuulManager {
    struct CurrencyTokenLimit {
        uint256 claimLimitPerCooldown;
        uint256 cumulativeClaimPerCooldown;
        uint256 claimCooldownPeriodStarted;
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
    error LimitAlreadySet();
    error OverTheLimit();

    /*╔═════════════════════════════╗
      ║       PUBLIC VARIABLES      ║
      ╚═════════════════════════════╝*/

    function claimCooldown() external view returns (uint256 period);

    function usersClaims(
        address user,
        address currency
    ) external view returns (uint256);

    /*╔═════════════════════════════╗
      ║       CLAIM VARIABLES       ║
      ╚═════════════════════════════╝*/

    function setClaimCooldown(uint256 period) external;

    /*╔═════════════════════════════╗
      ║       TOKEN CURRENCIES      ║
      ╚═════════════════════════════╝*/

    function currencyLimits(
        address currencyToken
    ) external view returns (uint256, uint256, uint256);

    function addCurrencyLimit(
        address tokenAddress,
        uint256 claimLimitPerCooldown
    ) external;

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
