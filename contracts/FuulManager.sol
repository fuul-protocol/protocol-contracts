// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC165.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";

import "./interfaces/IFuulManager.sol";

contract FuulManager is
    IFuulManager,
    AccessControlEnumerable,
    ReentrancyGuard,
    Pausable
{
    using ERC165Checker for address;

    // Attributor role
    bytes32 public constant ATTRIBUTOR_ROLE = keccak256("ATTRIBUTOR_ROLE");
    // Pauser role
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Currency token info
    struct CurrencyToken {
        TokenType tokenType;
        uint256 claimLimitPerCooldown;
        uint256 cumulativeClaimPerCooldown;
        uint256 claimCooldownPeriodStarted;
        bool isActive;
    }

    // Mapping addresses with tokens info
    mapping(address => CurrencyToken) public currencyTokens;

    // Period that should pass after campaign is deactivated for projects to be able to remove budget
    uint256 public campaignBudgetCooldown = 30 days;

    // Period that should pass after `claimCooldownPeriodStarted` for the cumulative amount to be restarted
    uint256 public claimCooldown = 1 days;

    // Mapping users and currency with total amount claimed
    mapping(address => mapping(address => uint256)) public usersClaims;

    // Interfaces for ERC721 and ERC1155 contracts
    bytes4 public constant IID_IERC1155 = type(IERC1155).interfaceId;
    bytes4 public constant IID_IERC721 = type(IERC721).interfaceId;

    uint8 public protocolFees;
    uint8 public clientFees;

    /*╔═════════════════════════════╗
      ║         CONSTRUCTOR         ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Grants roles to `_attributor`, `_pauser` and DEFAULT_ADMIN_ROLE to the deployer.
     *
     * Adds the initial `acceptedERC20CurrencyToken` as an accepted currency with its `initialTokenLimit`.
     * Adds the zero address (native token) as an accepted currency with its `initialNativeTokenLimit`.
     */
    constructor(
        address _attributor,
        address _pauser,
        address acceptedERC20CurrencyToken,
        uint256 initialTokenLimit,
        uint256 initialNativeTokenLimit
    ) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

        _setupRole(ATTRIBUTOR_ROLE, _attributor);
        _setupRole(PAUSER_ROLE, _pauser);

        _addCurrencyToken(acceptedERC20CurrencyToken, initialTokenLimit);
        _addCurrencyToken(address(0), initialNativeTokenLimit);
    }

    /*╔═════════════════════════════╗
      ║       REMOVE VARIABLES      ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Sets the period for `claimCooldown`.
     *
     * Requirements:
     *
     * - `_period` must be different from the current one.
     * - Only admins can call this function.
     */
    function setClaimCooldown(
        uint256 _period
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_period == claimCooldown) {
            revert InvalidArgument();
        }

        claimCooldown = _period;
    }

    /**
     * @dev Sets the period for `campaignBudgetCooldown`.
     *
     * Requirements:
     *
     * - `_period` must be different from the current one.
     * - Only admins can call this function.
     */
    function setCampaignBudgetCooldown(
        uint256 _period
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_period == campaignBudgetCooldown) {
            revert InvalidArgument();
        }

        campaignBudgetCooldown = _period;
    }

    /*╔═════════════════════════════╗
      ║        FEES VARIABLES       ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Sets the protocol fees for each attribution.
     *
     * Requirements:
     *
     * - `_value` must be different from the current one.
     * - Only admins can call this function.
     */
    function setProtocolFees(
        uint8 _value
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_value == protocolFees) {
            revert InvalidArgument();
        }

        protocolFees = _value;
    }

    /**
     * @dev Sets the fees for the client that was used to create the campaign.
     *
     * Requirements:
     *
     * - `_value` must be different from the current one.
     * - Only admins can call this function.
     */
    function setClientFees(uint8 _value) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_value == clientFees) {
            revert InvalidArgument();
        }

        clientFees = _value;
    }

    /*╔═════════════════════════════╗
      ║       TOKEN CURRENCIES      ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Returns TokenType enum from a tokenAddress.
     */
    function getTokenType(
        address tokenAddress
    ) public view returns (TokenType tokenType) {
        return currencyTokens[tokenAddress].tokenType;
    }

    /**
     * @dev Returns whether the currency token is accepted.
     */
    function isCurrencyTokenAccepted(
        address tokenAddress
    ) public view returns (bool isAccepted) {
        return currencyTokens[tokenAddress].isActive;
    }

    /**
     * @dev Adds a currency token.
     * See {_addCurrencyToken}
     *
     * Requirements:
     *
     * - Only admins can call this function.
     */
    function addCurrencyToken(
        address tokenAddress,
        uint256 claimLimitPerCooldown
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _addCurrencyToken(tokenAddress, claimLimitPerCooldown);
    }

    /**
     * @dev Removes a currency token.
     *
     * Requirements:
     *
     * - `tokenAddress` must be accepted.
     * - Only admins can call this function.
     */
    function removeCurrencyToken(
        address tokenAddress
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (!isCurrencyTokenAccepted(tokenAddress)) {
            revert TokenCurrencyNotAccepted();
        }
        CurrencyToken storage currency = currencyTokens[tokenAddress];

        currency.isActive = false;

        // Projects will not be able to create new campaigns or deposit with the currency token
        // We keep the tokenType because campaigns using this currency will still be able to claim it
    }

    /**
     * @dev Sets a new `claimLimitPerCooldown` for a currency token.
     *
     * Notes:
     * We are not checking that the tokenAddress is accepted because
     * users can claim from unaccepted currencies.
     *
     * Requirements:
     *
     * - `limit` must be greater than zero.
     * - `limit` must be different from the current one.
     * - Only admins can call this function.
     */
    function setCurrencyTokenLimit(
        address tokenAddress,
        uint256 limit
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        CurrencyToken storage currency = currencyTokens[tokenAddress];

        if (limit == 0 || limit == currency.claimLimitPerCooldown) {
            revert InvalidArgument();
        }

        currency.claimLimitPerCooldown = limit;
    }

    /*╔═════════════════════════════╗
      ║            PAUSE            ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Pauses the contract and all {FuulProject}s.
     * See {Pausable.sol}
     *
     * Requirements:
     *
     * - Only addresses with the PAUSER_ROLE can call this function.
     */
    function pauseAll() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpauses the contract and all {FuulProject}s.
     * See {Pausable.sol}
     *
     * Requirements:
     *
     * - Only addresses with the PAUSER_ROLE can call this function.
     */
    function unpauseAll() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Returns whether the contract is paused.
     * See {Pausable.sol}
     */
    function isPaused() external view returns (bool) {
        return paused();
    }

    /*╔═════════════════════════════╗
      ║      ATTRIBUTE & CLAIM      ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Attributes: calls the `attributeTransactions` function in {FuulProject} from a loop of `AttributeCheck`.
     *
     * Requirements:
     *
     * - Contract should not be paused.
     * - Only addresses with the ATTRIBUTOR_ROLE can call this function.
     */

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

    /**
     * @dev Claims: calls the `claimFromCampaign` function in {FuulProject} from a loop of `ClaimChecks`.
     *
     * Requirements:
     *
     * - Contract should not be paused.
     */
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
                    _msgSender(),
                    claimCheck.tokenIds,
                    claimCheck.amounts
                );

            CurrencyToken storage currencyInfo = currencyTokens[currency];

            // Limit

            if (tokenAmount > currencyInfo.claimLimitPerCooldown) {
                revert OverTheLimit();
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
                    revert OverTheLimit();
                }

                currencyInfo.cumulativeClaimPerCooldown += tokenAmount;
            } else {
                // If cooldown ended -> set new values for cumulative and time (amount limit is checked before)
                currencyInfo.cumulativeClaimPerCooldown = tokenAmount;
                currencyInfo.claimCooldownPeriodStarted = block.timestamp;
            }

            // Update values

            usersClaims[_msgSender()][currency] += tokenAmount;
        }
    }

    /*╔═════════════════════════════╗
      ║      INTERNAL ADD TOKEN     ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Returns whether the address is an ERC20 token.
     */
    function isERC20(address tokenAddress) internal view returns (bool) {
        IERC20 token = IERC20(tokenAddress);
        try token.totalSupply() {
            try token.allowance(_msgSender(), address(this)) {
                return true;
            } catch {}
        } catch {}
        return false;
    }

    /**
     * @dev Returns whether the address is a contract.
     */
    function isContract(address _addr) internal view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }

    /**
     * @dev Adds a new `tokenAddress` to accepted currencies with its
     * corresponding `claimLimitPerCooldown`.
     *
     * Requirements:
     *
     * - `tokenAddress` must be a contract (excepting for the zero address).
     * - `tokenAddress` must not be accepted yet.
     * - `claimLimitPerCooldown` should be greater than zero.
     */
    function _addCurrencyToken(
        address tokenAddress,
        uint256 claimLimitPerCooldown
    ) internal {
        if (tokenAddress != address(0) && !isContract(tokenAddress)) {
            revert InvalidArgument();
        }

        if (isCurrencyTokenAccepted(tokenAddress)) {
            revert TokenCurrencyAlreadyAccepted();
        }

        if (claimLimitPerCooldown == 0) {
            revert InvalidArgument();
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
            revert InvalidArgument();
        }

        currencyTokens[tokenAddress] = CurrencyToken({
            tokenType: tokenType,
            claimLimitPerCooldown: claimLimitPerCooldown,
            cumulativeClaimPerCooldown: 0,
            claimCooldownPeriodStarted: block.timestamp,
            isActive: true
        });
    }
}
