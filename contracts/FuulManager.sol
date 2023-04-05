// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "./interfaces/IFuulProject.sol";
import "./interfaces/IFuulManager.sol";

contract FuulManager is
    IFuulManager,
    AccessControlEnumerable,
    ReentrancyGuard,
    Pausable,
    EIP712
{
    struct CurrencyToken {
        TokenType tokenType;
        uint256 claimLimitPerCooldown;
        uint256 cumulativeClaimPerCooldown;
        uint256 claimCooldownPeriodStarted;
    }

    struct FuulProjectFungibleCurrencies {
        address deployedAddress;
        address[] currencies;
    }

    struct UserCurrencyClaim {
        uint256 totalAmountClaimed;
        uint256 lastClaimedAt;
    }

    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

    uint256 public campaignBudgetCooldown = 30 days;
    uint256 public claimCooldown = 1 days;
    uint256 public claimFrequency;

    mapping(address => mapping(address => UserCurrencyClaim))
        public usersClaims; // Address => currency => UserCurrencyClaim

    mapping(address => CurrencyToken) public currencyTokens;

    mapping(string => bool) public voucherRedeemed;

    /*╔═════════════════════════════╗
      ║         CONSTRUCTOR         ║
      ╚═════════════════════════════╝*/

    constructor(
        address _signer,
        address acceptedERC20CurrencyToken,
        uint256 initialTokenLimit,
        uint256 initialZeroTokenLimit
    ) EIP712("FuulManager", "1.0.0") {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

        _setupRole(SIGNER_ROLE, _signer);

        _addCurrencyToken(
            acceptedERC20CurrencyToken,
            TokenType(1),
            initialTokenLimit
        );
        _addCurrencyToken(address(0), TokenType(0), initialZeroTokenLimit);
    }

    /*╔═════════════════════════════╗
      ║       REMOVE VARIABLES      ║
      ╚═════════════════════════════╝*/

    function claimCooldownEnd(
        uint256 claimCooldownPeriodStarted
    ) public view returns (uint256) {
        return claimCooldownPeriodStarted + claimCooldown;
    }

    function setClaimFrequency(
        uint256 _period
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_period == claimFrequency) {
            revert InvalidUintArgument(_period);
        }

        claimFrequency = _period;
    }

    function setClaimCooldown(
        uint256 _period
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_period == claimCooldown) {
            revert InvalidUintArgument(_period);
        }

        claimCooldown = _period;
    }

    function setCampaignBudgetCooldown(
        uint256 _period
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_period == campaignBudgetCooldown) {
            revert InvalidUintArgument(_period);
        }

        campaignBudgetCooldown = _period;
    }

    /*╔═════════════════════════════╗
      ║       TOKEN CURRENCIES      ║
      ╚═════════════════════════════╝*/

    function getTokenType(
        address tokenAddress
    ) public view returns (TokenType tokenType) {
        return currencyTokens[tokenAddress].tokenType;
    }

    function isCurrencyTokenAccepted(
        address tokenAddress
    ) public view returns (bool isAccepted) {
        return currencyTokens[tokenAddress].claimLimitPerCooldown > 0;
    }

    function addCurrencyToken(
        address tokenAddress,
        TokenType tokenType,
        uint256 claimLimitPerCooldown
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _addCurrencyToken(tokenAddress, tokenType, claimLimitPerCooldown);
    }

    function removeCurrencyToken(
        address tokenAddress
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        CurrencyToken storage currency = currencyTokens[tokenAddress];

        if (currency.claimLimitPerCooldown == 0) {
            revert TokenCurrencyNotAccepted(tokenAddress);
        }

        currency.claimLimitPerCooldown = 0;
        currency.claimCooldownPeriodStarted = 0;
    }

    function setCurrencyTokenLimit(
        address tokenAddress,
        uint256 limit
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        CurrencyToken storage currency = currencyTokens[tokenAddress];

        if (limit == 0 || limit == currency.claimLimitPerCooldown) {
            revert InvalidUintArgument(limit);
        }

        if (currency.claimLimitPerCooldown == 0) {
            revert TokenCurrencyNotAccepted(tokenAddress);
        }

        currency.claimLimitPerCooldown = limit;
    }

    // Commenting this function
    // The only case it will be used if there was a mistake when adding the token.
    // In that case the token could be removed and readded

    // function setCurrencyTokenType(
    //     address tokenAddress,
    //     TokenType tokenType
    // ) external onlyRole(DEFAULT_ADMIN_ROLE) {
    //     CurrencyToken storage currency = currencyTokens[tokenAddress];

    //     if (currency.claimLimitPerCooldown == 0) {
    //         revert TokenCurrencyNotAccepted(tokenAddress);
    //     }

    //     if (tokenType == currency.tokenType) {
    //         revert InvalidTokenTypeArgument(tokenType);
    //     }

    //     currency.tokenType = tokenType;
    // }

    /*╔═════════════════════════════╗
      ║            PAUSE            ║
      ╚═════════════════════════════╝*/

    function pauseAll() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpauseAll() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function isPaused() external view returns (bool) {
        return paused();
    }

    /*╔═════════════════════════════╗
      ║      CLAIM FROM CAMPAIGN    ║
      ╚═════════════════════════════╝*/

    function claimFromCampaign(
        ClaimVoucher calldata voucher,
        bytes calldata signature
    ) external whenNotPaused nonReentrant {
        if (!_verify(_hash(voucher), signature)) {
            revert InvalidSignature();
        }

        address currency = voucher.currency;

        // Valid voucher
        if (voucherRedeemed[voucher.voucherId]) {
            revert ClaimedVoucher(voucher.voucherId);
        }

        if (voucher.deadline < block.timestamp) {
            revert VoucherExpired(voucher.deadline, block.timestamp);
        }

        if (voucher.account != msg.sender) {
            revert Unauthorized(msg.sender, voucher.account);
        }

        // Frequency
        UserCurrencyClaim storage userClaim = usersClaims[msg.sender][currency];

        if (
            userClaim.lastClaimedAt > 0 &&
            userClaim.lastClaimedAt + claimFrequency > block.timestamp
        ) {
            revert ClaimingFreqNotFinished();
        }

        CurrencyToken memory currencyInfo = currencyTokens[currency];

        // Send
        uint256 tokenAmount = IFuulProject(voucher.projectAddress)
            .claimFromCampaign(voucher);

        // Limit

        if (tokenAmount > currencyInfo.claimLimitPerCooldown) {
            revert OverTheLimit(
                tokenAmount,
                currencyInfo.claimLimitPerCooldown
            );
        }

        if (
            currencyInfo.claimCooldownPeriodStarted + claimCooldown >
            block.timestamp
        ) {
            // If cooldown not ended -> check that the limit is not reached and then sum amount to cumulative

            if (
                currencyInfo.cumulativeClaimPerCooldown + tokenAmount >
                currencyInfo.claimLimitPerCooldown
            ) {
                revert OverTheLimit(
                    currencyInfo.cumulativeClaimPerCooldown + tokenAmount,
                    currencyInfo.claimLimitPerCooldown
                );
            }

            currencyInfo.cumulativeClaimPerCooldown += tokenAmount;
        } else {
            // If cooldown ended -> set new values for cumulative and time (amount limit is checked before)
            currencyInfo.cumulativeClaimPerCooldown = tokenAmount;
            currencyInfo.claimCooldownPeriodStarted = block.timestamp;
        }

        // Update values
        voucherRedeemed[voucher.voucherId] = true;

        userClaim.lastClaimedAt = block.timestamp;
        userClaim.totalAmountClaimed += tokenAmount;
    }

    /*╔═════════════════════════════╗
      ║          EMERGENCY          ║
      ╚═════════════════════════════╝*/

    function emergencyWithdrawFungibleTokensFromProjects(
        address to,
        FuulProjectFungibleCurrencies[] memory projectsCurrencies
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        for (uint256 i = 0; i < projectsCurrencies.length; i++) {
            FuulProjectFungibleCurrencies memory project = projectsCurrencies[
                i
            ];

            for (uint256 j = 0; j < project.currencies.length; j++) {
                address currency = project.currencies[j];

                IFuulProject(project.deployedAddress)
                    .emergencyWithdrawFungibleTokens(to, currency);
            }
        }
    }

    function emergencyWithdrawNFTsFromProject(
        address to,
        address projectAddress,
        address currency,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        IFuulProject(projectAddress).emergencyWithdrawNFTTokens(
            to,
            currency,
            tokenIds,
            amounts
        );
    }

    /*╔═════════════════════════════╗
      ║      INTERNAL ADD TOKEN     ║
      ╚═════════════════════════════╝*/

    function _addCurrencyToken(
        address tokenAddress,
        TokenType tokenType,
        uint256 claimLimitPerCooldown
    ) internal {
        if (isCurrencyTokenAccepted(tokenAddress)) {
            revert TokenCurrencyAlreadyAccepted(tokenAddress);
        }

        if (claimLimitPerCooldown == 0) {
            revert InvalidUintArgument(claimLimitPerCooldown);
        }

        currencyTokens[tokenAddress] = CurrencyToken({
            tokenType: tokenType,
            claimLimitPerCooldown: claimLimitPerCooldown,
            cumulativeClaimPerCooldown: 0,
            claimCooldownPeriodStarted: block.timestamp
        });
    }

    /*╔═════════════════════════════╗
      ║      INTERNAL VOUCHER       ║
      ╚═════════════════════════════╝*/

    function _hash(
        ClaimVoucher memory voucher
    ) internal view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        keccak256(
                            "ClaimVoucher(string voucherId,uint256 campaignId,address account,uint256[] tokenIds,uint256[] amounts,uint256 deadline)"
                        ),
                        keccak256(bytes(voucher.voucherId)),
                        voucher.campaignId,
                        voucher.account,
                        keccak256(abi.encodePacked(voucher.tokenIds)),
                        keccak256(abi.encodePacked(voucher.amounts)),
                        voucher.deadline
                    )
                )
            );
    }

    function _verify(
        bytes32 digest,
        bytes memory signature
    ) internal view returns (bool) {
        return hasRole(SIGNER_ROLE, ECDSA.recover(digest, signature));
    }
}
