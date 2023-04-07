// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "./interfaces/IFuulProject.sol";
import "./interfaces/IFuulManager.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC165.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";

contract FuulManager is
    IFuulManager,
    AccessControlEnumerable,
    ReentrancyGuard,
    Pausable,
    EIP712
{
    using ERC165Checker for address;

    uint256 public testAmount;

    struct CurrencyToken {
        TokenType tokenType;
        uint256 claimLimitPerCooldown;
        uint256 cumulativeClaimPerCooldown;
        uint256 claimCooldownPeriodStarted;
    }

    bytes32 public constant ATTRIBUTOR_ROLE = keccak256("ATTRIBUTOR_ROLE");

    uint256 public campaignBudgetCooldown = 30 days;
    uint256 public claimCooldown = 1 days;

    mapping(address => mapping(address => uint256)) public usersClaims; // Address => currency => total claimed

    mapping(address => CurrencyToken) public currencyTokens;

    bytes4 public constant IID_IERC1155 = type(IERC1155).interfaceId;
    bytes4 public constant IID_IERC721 = type(IERC721).interfaceId;
    bytes4 public constant IID_IERC20 = type(IERC20).interfaceId;

    /*╔═════════════════════════════╗
      ║         CONSTRUCTOR         ║
      ╚═════════════════════════════╝*/

    constructor(
        address _attributor,
        address acceptedERC20CurrencyToken,
        uint256 initialTokenLimit,
        uint256 initialZeroTokenLimit
    ) EIP712("FuulManager", "1.0.0") {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

        _setupRole(ATTRIBUTOR_ROLE, _attributor);

        _addCurrencyToken(acceptedERC20CurrencyToken, initialTokenLimit);
        _addCurrencyToken(address(0), initialZeroTokenLimit);
    }

    /*╔═════════════════════════════╗
      ║       REMOVE VARIABLES      ║
      ╚═════════════════════════════╝*/

    function claimCooldownEnd(
        uint256 claimCooldownPeriodStarted
    ) public view returns (uint256) {
        return claimCooldownPeriodStarted + claimCooldown;
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
        uint256 claimLimitPerCooldown
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _addCurrencyToken(tokenAddress, claimLimitPerCooldown);
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
        // Projects will not be able to create new campaigns or deposit with the currency token
        // We keep the tokenType because campaigns using this currency will still be able to claim it
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
      ║       UPDATE BALANCES       ║
      ╚═════════════════════════════╝*/

    function attributeTransactions(
        AttributeCheck[] calldata attributeChecks
    ) external whenNotPaused nonReentrant onlyRole(ATTRIBUTOR_ROLE) {
        for (uint256 i = 0; i < attributeChecks.length; i++) {
            AttributeCheck memory attributeCheck = attributeChecks[i];

            IFuulProject(attributeCheck.projectAddress).attributeTransactions(
                attributeCheck.campaignIds,
                attributeCheck.receivers,
                attributeCheck.amounts
            );
        }
    }

    /*╔═════════════════════════════╗
      ║           CLAIM             ║
      ╚═════════════════════════════╝*/

    function claim(
        ClaimCheck[] calldata claimChecks
    ) external whenNotPaused nonReentrant {
        for (uint256 i = 0; i < claimChecks.length; i++) {
            ClaimCheck memory claimCheck = claimChecks[i];

            // Send
            uint256 tokenAmount;
            address currency;
            (tokenAmount, currency) = IFuulProject(claimCheck.projectAddress)
                .claimFromCampaign(
                    claimCheck.campaignId,
                    msg.sender,
                    claimCheck.tokenIds,
                    claimCheck.amounts
                );

            CurrencyToken storage currencyInfo = currencyTokens[currency];

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

            usersClaims[msg.sender][currency] += tokenAmount;
        }
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

    function isERC20(address tokenAddress) internal view returns (bool) {
        IERC20 token = IERC20(tokenAddress);
        try token.totalSupply() {
            try token.allowance(msg.sender, address(this)) {
                return true;
            } catch {}
        } catch {}
        return false;
    }

    function isContract(address _addr) internal view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }

    function _addCurrencyToken(
        address tokenAddress,
        uint256 claimLimitPerCooldown
    ) internal {
        if (tokenAddress != address(0) && !isContract(tokenAddress)) {
            revert InvalidAddressArgument(tokenAddress);
        }

        if (isCurrencyTokenAccepted(tokenAddress)) {
            revert TokenCurrencyAlreadyAccepted(tokenAddress);
        }

        if (claimLimitPerCooldown == 0) {
            revert InvalidUintArgument(claimLimitPerCooldown);
        }

        TokenType tokenType;

        if (tokenAddress == address(0)) {
            tokenType = TokenType(0);
        } else if (isERC20(tokenAddress)) {
            tokenType = TokenType(1);
        } else if (tokenAddress.supportsInterface(IID_IERC721)) {
            tokenType = TokenType(2);
        } else if (tokenAddress.supportsInterface(IID_IERC1155)) {
            tokenType = TokenType(3);
        } else {
            revert InvalidAddressArgument(tokenAddress);
        }

        currencyTokens[tokenAddress] = CurrencyToken({
            tokenType: tokenType,
            claimLimitPerCooldown: claimLimitPerCooldown,
            cumulativeClaimPerCooldown: 0,
            claimCooldownPeriodStarted: block.timestamp
        });
    }
}
