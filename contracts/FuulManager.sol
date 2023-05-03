// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import "./interfaces/IFuulManager.sol";

contract FuulManager is
    IFuulManager,
    AccessControlEnumerable,
    ReentrancyGuard,
    Pausable
{
    // Attributor role
    bytes32 public constant ATTRIBUTOR_ROLE = keccak256("ATTRIBUTOR_ROLE");
    // Pauser role
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Amount of time that must elapse after {claimCooldownPeriodStarted} for the cumulative amount to be restarted
    uint256 public claimCooldown = 1 days;

    // Mapping users and currency with total amount claimed
    mapping(address => mapping(address => uint256)) public usersClaims;

    // Mapping addresses with tokens info
    mapping(address => CurrencyTokenLimit) public currencyLimits;

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

        _addCurrencyLimit(acceptedERC20CurrencyToken, initialTokenLimit);
        _addCurrencyLimit(address(0), initialNativeTokenLimit);
    }

    /*╔═════════════════════════════╗
      ║       CLAIM VARIABLES       ║
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

    /*╔═════════════════════════════╗
      ║       TOKEN CURRENCIES      ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Adds a currency token.
     * See {_addCurrencyToken}
     *
     * Requirements:
     *
     * - Only admins can call this function.
     */
    function addCurrencyLimit(
        address tokenAddress,
        uint256 claimLimitPerCooldown
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _addCurrencyLimit(tokenAddress, claimLimitPerCooldown);
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
        CurrencyTokenLimit storage currency = currencyLimits[tokenAddress];

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
     * @dev Attributes: calls the `attributeTransactions` function in {FuulProject} from an array of {AttributionEntity}.
     *
     * Requirements:
     *
     * - Contract should not be paused.
     * - Only addresses with the ATTRIBUTOR_ROLE can call this function.
     */

    function attributeTransactions(
        AttributionEntity[] memory attributions,
        address attributorFeeCollector
    ) external whenNotPaused nonReentrant onlyRole(ATTRIBUTOR_ROLE) {
        uint256 attributionLength = attributions.length;
        for (uint256 i = 0; i < attributionLength; i++) {
            IFuulProject.Attribution[]
                memory projectAttributions = attributions[i]
                    .projectAttributions;

            IFuulProject(attributions[i].projectAddress).attributeTransactions(
                projectAttributions,
                attributorFeeCollector
            );
        }
    }

    /**
     * @dev Claims: calls the `claimFromProject` function in {FuulProject} from an array of of {ClaimCheck}.
     *
     * Requirements:
     *
     * - Contract should not be paused.
     */
    function claim(
        ClaimCheck[] calldata claimChecks
    ) external whenNotPaused nonReentrant {
        uint256 checksLength = claimChecks.length;

        for (uint256 i = 0; i < checksLength; i++) {
            ClaimCheck memory claimCheck = claimChecks[i];

            // Send
            address currency = claimCheck.currency;
            uint256 tokenAmount = IFuulProject(claimCheck.projectAddress)
                .claimFromProject(
                    currency,
                    _msgSender(),
                    claimCheck.tokenIds,
                    claimCheck.amounts
                );

            CurrencyTokenLimit storage currencyInfo = currencyLimits[currency];

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
     * @dev Adds a new `tokenAddress` to accepted currencies with its
     * corresponding `claimLimitPerCooldown`.
     *
     * Requirements:
     *
     * - `tokenAddress` must not be accepted yet.
     * - `claimLimitPerCooldown` should be greater than zero.
     */
    function _addCurrencyLimit(
        address tokenAddress,
        uint256 claimLimitPerCooldown
    ) internal {
        if (claimLimitPerCooldown == 0) {
            revert InvalidArgument();
        }

        currencyLimits[tokenAddress] = CurrencyTokenLimit({
            claimLimitPerCooldown: claimLimitPerCooldown,
            cumulativeClaimPerCooldown: 0,
            claimCooldownPeriodStarted: block.timestamp
        });
    }
}
