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
        address currency;
        uint256[] tokenIds;
        uint256[] amounts;
    }

    struct AttributionEntity {
        address projectAddress;
        IFuulProject.Attribution[] projectAttributions;
    }

    struct FeesInformation {
        uint8 protocolFee;
        uint8 attributorFee;
        uint8 clientFee;
        address protocolFeeCollector;
        uint256 nftFixedFeeAmount;
        address nftFeeCurrency;
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

    function claimCooldown() external view returns (uint256 period);

    function usersClaims(
        address user,
        address currency
    ) external view returns (uint256);

    function protocolFee() external view returns (uint8 fees);

    function protocolFeeCollector() external view returns (address);

    function getFeesInformation() external returns (FeesInformation memory);

    function clientFee() external view returns (uint8 fees);

    function attributorFee() external view returns (uint8 fees);

    function nftFeeCurrency() external view returns (address);

    /*╔═════════════════════════════╗
      ║       REMOVE VARIABLES      ║
      ╚═════════════════════════════╝*/

    function setClaimCooldown(uint256 _period) external;

    function setProjectBudgetCooldown(uint256 period) external;

    /*╔═════════════════════════════╗
      ║        FEES VARIABLES       ║
      ╚═════════════════════════════╝*/

    function setProtocolFee(uint8 value) external;

    function setClientFee(uint8 value) external;

    function setAttributorFee(uint8 value) external;

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

    // function attributeTransactions(
    //     AttributeCheck[] calldata attributeChecks
    // ) external;

    function claim(ClaimCheck[] calldata claimChecks) external;
}
