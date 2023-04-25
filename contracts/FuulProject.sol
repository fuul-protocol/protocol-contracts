// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

import "./interfaces/IFuulManager.sol";
import "./interfaces/IFuulFactory.sol";
import "./interfaces/IFuulProject.sol";

contract FuulProject is
    IFuulProject,
    AccessControlEnumerable,
    ERC721Holder,
    ERC1155Holder,
    ReentrancyGuard
{
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;
    using Address for address payable;

    // Factory contract address
    address public fuulFactory;

    // Campaigns created number tracker
    Counters.Counter private _campaignIdTracker;

    // Roles for allowed addresses to send events through our SDK (not used in the contract)
    bytes32 public constant EVENTS_SIGNER_ROLE =
        keccak256("EVENTS_SIGNER_ROLE");

    // Mapping campaign id with campaign info
    mapping(uint256 => Campaign) public campaigns;

    // Mapping owner address to campaignId to earnings
    mapping(address => mapping(uint256 => uint256)) public availableToClaim;

    // URI that points to a file with project information (image, name, description, etc)
    string public projectInfoURI;

    // Helper empty array to input in events
    uint256[] private emptyArray;

    // Mapping currency with fees when campaigns reward NFTs
    mapping(address => uint256) public nftFeeBudget;

    /**
     * @dev Modifier that checks that a campaign exists. Reverts
     * with a CampaignNotExists error including the inputed campaign id.
     */

    modifier campaignExists(uint256 _campaignId) {
        if (_campaignId == 0 || _campaignId > campaignsCreated()) {
            revert CampaignNotExists();
        }
        _;
    }

    /**
     * @dev Modifier that the sender is the fuul manager. Reverts
     * with an Unauthorized error including the sender and the required sender.
     */

    modifier onlyFuulManager() {
        if (_msgSender() != fuulManagerAddress()) {
            revert IFuulManager.Unauthorized();
        }
        _;
    }

    /**
     * @dev Modifier that the Fuul Manager contract is not paused. Reverts
     * with a ManagerIsPaused error.
     */
    modifier whenManagerIsPaused() {
        if (fuulManagerInstance().isPaused()) {
            revert ManagerIsPaused();
        }
        _;
    }

    /*╔═════════════════════════════╗
      ║         CONSTRUCTOR         ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Sets the value for {fuulFactory}.
     *
     * This value is immutable: it can only be set once during
     * construction.
     */
    constructor() {
        fuulFactory = address(0);
    }

    /**
     * @dev Initializes the contract when the Factory deploys a new clone}.
     *
     * Grants roles for project admin, the address allowed to send events 
     * through the SDK and the URI with the project information

     */
    function initialize(
        address projectAdmin,
        address _projectEventSigner,
        string memory _projectInfoURI
    ) external {
        require(fuulFactory == address(0), "FuulV1: FORBIDDEN");

        fuulFactory = _msgSender();
        projectInfoURI = _projectInfoURI;

        _setupRole(DEFAULT_ADMIN_ROLE, projectAdmin);

        _setupRole(EVENTS_SIGNER_ROLE, _projectEventSigner);
    }

    /*╔═════════════════════════════╗
      ║     FROM OTHER CONTRACTS    ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Returns the address of the active Fuul Manager contract.
     */
    function fuulManagerAddress() public view returns (address) {
        return IFuulFactory(fuulFactory).fuulManager();
    }

    /**
     * @dev Returns the instance of the Fuul Manager contract.
     */
    function fuulManagerInstance() public view returns (IFuulManager) {
        return IFuulManager(fuulManagerAddress());
    }

    /*╔═════════════════════════════╗
      ║        PROJECT INFO         ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Sets `projectInfoURI` as the information for the project.
     *
     * Emits {ProjectInfoUpdated}.
     *
     * Requirements:
     *
     * - `_projectURI` must not be an empty string.
     * - Only admins can deactivate campaigns.
     */
    function setProjectInfoURI(
        string memory _projectURI
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        // Commented to optimize contract size

        // if (bytes(_projectURI).length == 0) {
        //     revert EmptyURI();
        // }

        projectInfoURI = _projectURI;

        emit ProjectInfoUpdated(_projectURI);
    }

    /*╔═════════════════════════════╗
      ║          CAMPAIGNS          ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Returns the number of campaigns created.
     */
    function campaignsCreated() public view returns (uint256) {
        return _campaignIdTracker.current();
    }

    /**
     * @dev Creates a new `Campaign` object.
     * The `campaignId` follows the number of campaigns created.
     *
     * Emits {CampaignCreated}.
     *
     * Requirements:
     *
     * - `newProjectURI` must not be an empty string.
     * - `currency` must be accepted in the Fuul Manager contract.
     * - Only admins can create campaigns.
     */
    function createCampaign(
        string memory newProjectURI,
        address currency,
        address clientFeeCollector
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    // Commented to optimize contract size
    // nonReentrant
    {
        if (!fuulManagerInstance().isCurrencyTokenAccepted(currency)) {
            revert IFuulManager.TokenCurrencyNotAccepted();
        }

        // Set new project URI
        setProjectInfoURI(newProjectURI);

        _campaignIdTracker.increment();

        uint256 campaignId = campaignsCreated();

        IFuulManager.TokenType tokenType = fuulManagerInstance().getTokenType(
            currency
        );

        // Create campaign object
        campaigns[campaignId] = Campaign({
            totalDeposited: 0,
            currentBudget: 0,
            currency: currency,
            deactivatedAt: 0,
            tokenType: tokenType,
            clientFeeCollector: clientFeeCollector
        });

        emit CampaignCreated(
            _msgSender(),
            currency,
            campaignId,
            tokenType,
            clientFeeCollector
        );
    }

    // /**
    //  * @dev Activates or deactivates campaign.
    //  *
    //  * Requirements:
    //  *
    //  * - `campaignId` must exist and be active.
    //  * - Only admins can call this function.
    //  */

    function switchCampaignStatus(
        uint256 campaignId
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    // Commented to optimize contract size
    // campaignExists(campaignId)
    // nonReentrant
    {
        Campaign storage campaign = campaigns[campaignId];

        if (campaign.deactivatedAt == 0) {
            campaign.deactivatedAt = block.timestamp;
        } else {
            campaign.deactivatedAt == 0;
        }
    }

    /*╔═════════════════════════════╗
      ║        DEPOSIT BUDGET       ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Deposits fungible tokens in a campaign.
     * They can be native or ERC20 tokens.
     *
     * Emits {BudgetDeposited}.
     *
     * Requirements:
     *
     * - `campaignId` must exist and be active.
     * - `amount` must be greater than zero.
     * - Only admins can deposit.
     */
    function depositFungibleToken(
        uint256 campaignId,
        uint256 amount
    )
        external
        payable
        onlyRole(DEFAULT_ADMIN_ROLE)
        campaignExists(campaignId)
    // Commented to optimize contract size
    // nonReentrant

    {
        // Commented to optimize contract size

        // if (amount == 0) {
        //     revert ZeroAmount();
        // }
        Campaign storage campaign = campaigns[campaignId];

        address currency = campaign.currency;

        if (!fuulManagerInstance().isCurrencyTokenAccepted(currency)) {
            revert IFuulManager.TokenCurrencyNotAccepted();
        }

        IFuulManager.TokenType tokenType = campaign.tokenType;

        // Commented to optimize contract size

        // if (campaign.deactivatedAt > 0) {
        //     revert CampaignNotActive();
        // }

        // require(
        //     tokenType == IFuulManager.TokenType.NATIVE ||
        //         tokenType == IFuulManager.TokenType.ERC_20,
        //     "Currency is not a fungible token"
        // );

        if (tokenType == IFuulManager.TokenType.NATIVE) {
            if (msg.value != amount) {
                revert IncorrectMsgValue();
            }
        } else if (tokenType == IFuulManager.TokenType.ERC_20) {
            IERC20(currency).safeTransferFrom(
                _msgSender(),
                address(this),
                amount
            );
        }

        // Update balance
        campaign.totalDeposited += amount;
        campaign.currentBudget += amount;

        emit BudgetDeposited(
            _msgSender(),
            amount,
            currency,
            campaignId,
            tokenType,
            emptyArray,
            emptyArray
        );
    }

    /**
     * @dev Deposits NFTs in a campaign.
     * They can be ERC1155 or ERC721 tokens.
     * `amounts` parameter is only used when dealing with ERC1155 tokens.
     *
     * Emits {BudgetDeposited}.
     *
     * Requirements:
     *
     * - `campaignId` must exist and be active.
     * - Only admins can deposit.
     */
    function depositNFTToken(
        uint256 campaignId,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        campaignExists(campaignId)
    // Commented to optimize contract size
    // nonReentrant
    {
        Campaign storage campaign = campaigns[campaignId];
        address currency = campaign.currency;

        if (!fuulManagerInstance().isCurrencyTokenAccepted(currency)) {
            revert IFuulManager.TokenCurrencyNotAccepted();
        }

        IFuulManager.TokenType tokenType = campaign.tokenType;

        // Commented to optimize contract size

        // if (campaign.deactivatedAt > 0) {
        //     revert CampaignNotActive();
        // }

        // require(
        //     tokenType == IFuulManager.TokenType.ERC_721 ||
        //         tokenType == IFuulManager.TokenType.ERC_1155,
        //     "Currency is not an NFT token"
        // );

        uint256 depositedAmount;
        uint256[] memory tokenAmounts;

        if (tokenType == IFuulManager.TokenType.ERC_721) {
            for (uint256 i = 0; i < tokenIds.length; i++) {
                _transferERC721Tokens(
                    currency,
                    _msgSender(),
                    address(this),
                    tokenIds[i]
                );
            }

            depositedAmount = tokenIds.length;

            tokenAmounts = emptyArray;
        } else if (tokenType == IFuulManager.TokenType.ERC_1155) {
            _transferERC1155Tokens(
                currency,
                _msgSender(),
                address(this),
                tokenIds,
                amounts
            );

            depositedAmount = _getSumFromArray(amounts);
            tokenAmounts = amounts;
        }

        // Update balance
        campaign.totalDeposited += depositedAmount;
        campaign.currentBudget += depositedAmount;

        emit BudgetDeposited(
            _msgSender(),
            depositedAmount,
            currency,
            campaignId,
            tokenType,
            tokenIds,
            tokenAmounts
        );
    }

    /*╔═════════════════════════════╗
      ║        REMOVE BUDGET        ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Returns the timestamp when funds can be removed from a campaign.
     * This period starts when the campaign is deactivated and ends after the
     * `campaignBudgetCooldown` is passed.
     */
    function getBudgetCooldownPeriod(
        uint256 deactivatedAt
    ) public view returns (uint256) {
        if (deactivatedAt == 0) {
            revert CampaignNotInactive();
        }
        return deactivatedAt + fuulManagerInstance().campaignBudgetCooldown();
    }

    /**
     * @dev Removes fungible tokens from a campaign.
     * They can be native or ERC20 tokens.
     *
     * Emits {BudgetRemoved}.
     *
     * Requirements:
     *
     * - `campaignId` must exist and be active.
     * - `amount` must be greater than zero.
     * - Only admins can remove.
     * - Budget remove cooldown period has to be completed.
     */
    function removeFungibleBudget(
        uint256 campaignId,
        uint256 amount
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    // Commented to optimize contract size
    // campaignExists(campaignId)
    // nonReentrant
    {
        // Commented to optimize contract size

        // if (amount == 0) {
        //     revert ZeroAmount();
        // }

        Campaign storage campaign = campaigns[campaignId];

        address currency = campaign.currency;

        IFuulManager.TokenType tokenType = campaign.tokenType;

        // Commented to optimize contract size

        // require(
        //     tokenType == IFuulManager.TokenType.NATIVE ||
        //         tokenType == IFuulManager.TokenType.ERC_20,
        //     "Currency is not a fungible token"
        // );
        uint256 cooldownPeriod = getBudgetCooldownPeriod(
            campaign.deactivatedAt
        );

        if (block.timestamp < cooldownPeriod) {
            revert CooldownPeriodNotFinished();
        }

        // Update campaign budget - By underflow it indirectly checks that amount <= campaign.currentBudget
        campaign.currentBudget -= amount;

        if (tokenType == IFuulManager.TokenType.NATIVE) {
            payable(_msgSender()).sendValue(amount);
        } else if (tokenType == IFuulManager.TokenType.ERC_20) {
            IERC20(currency).safeTransfer(_msgSender(), amount);
        }

        emit BudgetRemoved(
            _msgSender(),
            amount,
            currency,
            campaignId,
            tokenType,
            emptyArray,
            emptyArray
        );
    }

    /**
     * @dev Removes NFT tokens from a campaign.
     * They can be ERC1155 or ERC721 tokens.
     * `amounts` parameter is only used when dealing with ERC1155 tokens.
     *
     * Emits {BudgetRemoved}.
     *
     * Requirements:
     *
     * - `campaignId` must exist and be active.
     * - `amount` must be greater than zero.
     * - Only admins can remove.
     * - Budget remove cooldown period has to be completed.
     */
    function removeNFTBudget(
        uint256 campaignId,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    // Commented to optimize contract size
    // campaignExists(campaignId)
    // nonReentrant
    {
        uint256 tokenIdsLength = tokenIds.length;

        // Commented to optimize contract size

        // if (tokenIdsLength == 0) {
        //     revert ZeroAmount();
        // }
        Campaign storage campaign = campaigns[campaignId];

        uint256 cooldownPeriod = getBudgetCooldownPeriod(
            campaign.deactivatedAt
        );

        if (block.timestamp < cooldownPeriod) {
            revert CooldownPeriodNotFinished();
        }

        address currency = campaign.currency;

        IFuulManager.TokenType tokenType = campaign.tokenType;

        // Commented to optimize contract size

        // require(
        //     tokenType == IFuulManager.TokenType.ERC_721 ||
        //         tokenType == IFuulManager.TokenType.ERC_1155,
        //     "Currency is not an NFT token"
        // );

        uint256 removeAmount;

        if (tokenType == IFuulManager.TokenType.ERC_721) {
            for (uint256 i = 0; i < tokenIdsLength; i++) {
                _transferERC721Tokens(
                    currency,
                    address(this),
                    _msgSender(),
                    tokenIds[i]
                );
            }

            removeAmount = tokenIdsLength;
        } else if (tokenType == IFuulManager.TokenType.ERC_1155) {
            _transferERC1155Tokens(
                currency,
                address(this),
                _msgSender(),
                tokenIds,
                amounts
            );

            removeAmount = _getSumFromArray(amounts);
        }

        // Update campaign budget - By underflow it indirectly checks that amount <= campaign.currentBudget
        campaign.currentBudget -= removeAmount;

        emit BudgetRemoved(
            _msgSender(),
            removeAmount,
            currency,
            campaignId,
            tokenType,
            tokenIds,
            amounts
        );
    }

    /*╔═════════════════════════════╗
      ║        NFT FEE BUDGET       ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Deposits budget to pay for fees when rewarding NFTs in a campaign.
     * The currency is defined in the Fuul Manager contract.
     *
     * Emits {FeeBudgetDeposit}.
     *
     * Requirements:
     *
     * - `amount` must be greater than zero.
     * - Only admins can deposit.
     */
    function depositFeeBudget(
        uint256 amount
    )
        external
        payable
        onlyRole(DEFAULT_ADMIN_ROLE)
    // Commented to optimize contract size
    // nonReentrant

    {
        // Commented to optimize contract size

        // if (amount == 0) {
        //     revert ZeroAmount();
        // }

        address currency = fuulManagerInstance().nftFeeCurrency();

        if (currency == address(0)) {
            if (msg.value != amount) {
                revert IncorrectMsgValue();
            }
        } else {
            IERC20(currency).safeTransferFrom(
                _msgSender(),
                address(this),
                amount
            );
        }

        // Update balance
        nftFeeBudget[currency] += amount;

        emit FeeBudgetDeposited(_msgSender(), amount, currency);
    }

    /**
     * @dev Removes fee budget for NFT rewards.
     *
     * Emits {BudgetRemoved}.
     *
     * Notes: Currency is an argument because if default is changed in Fuul Manager, projects will still be able to remove
     *
     * Requirements:
     *
     * - `amount` must be greater than zero.
     * - Only admins can remove.
     */
    function removeFeeBudget(
        address currency,
        uint256 amount
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    // Commented to optimize contract size
    //  nonReentrant
    {
        if (amount == 0) {
            revert ZeroAmount();
        }

        nftFeeBudget[currency] -= amount;

        if (currency == address(0)) {
            payable(_msgSender()).sendValue(amount);
        } else {
            IERC20(currency).safeTransfer(_msgSender(), amount);
        }

        emit FeeBudgetRemoved(_msgSender(), amount, currency);
    }

    /*╔═════════════════════════════╗
      ║         ATTRIBUTION         ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Internal function to calculate fees and amounts for campaigns that have a fungible token reward.
     *
     */

    function _calculateAmountsForFungibleTokenCampaigns(
        IFuulManager.FeesInformation memory feesInfo,
        uint256 totalAmount,
        uint256 amountToPartner,
        uint256 amountToEndUser
    )
        internal
        pure
        returns (
            uint256[3] memory fees,
            uint256 netAmountToPartner,
            uint256 netAmountToEndUser
        )
    {
        // Calculate the percentage to partners
        uint256 partnerPercentage = (100 * amountToPartner) /
            (amountToPartner + amountToEndUser);

        // Get all fees
        uint256[3] memory allFees = [
            (feesInfo.protocolFee * totalAmount) / 100,
            (feesInfo.clientFee * totalAmount) / 100,
            (feesInfo.attributorFee * totalAmount) / 100
        ];

        // Get net amounts
        uint256 netPartnerAmount = ((totalAmount -
            allFees[0] -
            allFees[1] -
            allFees[2]) * partnerPercentage) / 100;

        uint256 netEndUserAmount = totalAmount -
            allFees[0] -
            allFees[1] -
            allFees[2] -
            amountToPartner;

        return (allFees, netPartnerAmount, netEndUserAmount);
    }

    /**
     * @dev Internal function to calculate fees for campaigns that have a fungible token reward.
     *
     */
    function _calculateFeesForNFTCampaigns(
        IFuulManager.FeesInformation memory feesInfo
    ) internal pure returns (uint256[3] memory fees) {
        uint256 totalAmount = feesInfo.nftFixedFeeAmount;
        uint256[3] memory allFees = [
            (feesInfo.protocolFee * totalAmount) / 100,
            (feesInfo.clientFee * totalAmount) / 100,
            (feesInfo.attributorFee * totalAmount) / 100
        ];

        return allFees;
    }

    /**
     * @dev Attributes: removes amounts from campaign and adds them to corresponding partner and users.
     * It also allocates fees.
     * 
     * Emits {Attributed}.
     * 
     * Notes:
     * - When campaign rewards are fungible tokens, fees will be a percentage of the payment and it will be substracted from the payment
     * - When campaign rewards are NFTs, fees will be a fixed amount and the nftFeeBudget will be used
     *
     * Requirements:
     *
     * - All campaigns of `attributions` must exist and have the corresponding balance.
     * - All `totalAmount` of `attributions` must be greater than zero.
     * - Only Fuul Manager can attribute.
     * - Attribution must not be paused.

     */

    function attributeTransactions(
        Attribution[] calldata attributions,
        address attributorFeeCollector
    ) external onlyFuulManager nonReentrant whenManagerIsPaused {
        IFuulManager.FeesInformation memory feesInfo = fuulManagerInstance()
            .getFeesInformation();

        for (uint256 i = 0; i < attributions.length; i++) {
            Attribution memory attribution = attributions[i];

            // Commented to optimize contract size

            // if (
            //     attribution.campaignId == 0 ||
            //     attribution.campaignId > campaignsCreated()
            // ) {
            //     revert CampaignNotExists();
            // }

            // if (attribution.totalAmount == 0) {
            //     revert ZeroAmount();
            // }

            Campaign storage campaign = campaigns[attribution.campaignId];

            // Calculate fees and amounts

            uint256[3] memory fees;
            uint256 amountToPartner;
            uint256 amountToEndUser;

            if (
                campaign.tokenType == IFuulManager.TokenType.NATIVE ||
                campaign.tokenType == IFuulManager.TokenType.ERC_20
            ) {
                (
                    fees,
                    amountToPartner,
                    amountToEndUser
                ) = _calculateAmountsForFungibleTokenCampaigns(
                    feesInfo,
                    attribution.totalAmount,
                    attribution.amountToPartner,
                    attribution.amountToEndUser
                );
            } else {
                fees = _calculateFeesForNFTCampaigns(feesInfo);
                amountToPartner = attribution.amountToPartner;
                amountToEndUser = attribution.amountToEndUser;
            }

            // Update campaign balance
            campaign.currentBudget -= attribution.totalAmount;

            // Update protocol balance

            availableToClaim[feesInfo.protocolFeeCollector][
                attribution.campaignId
            ] += fees[0];

            // Update client balance

            availableToClaim[campaign.clientFeeCollector][
                attribution.campaignId
            ] += fees[1];

            // Update attributor balance
            availableToClaim[attributorFeeCollector][
                attribution.campaignId
            ] += fees[2];

            // Update partner balance
            availableToClaim[attribution.partner][
                attribution.campaignId
            ] += amountToPartner;

            // Update end user balance
            availableToClaim[attribution.endUser][
                attribution.campaignId
            ] += amountToEndUser;

            // Emit Event
            emit Attributed(
                attribution.campaignId,
                campaign.currency,
                attribution.totalAmount,
                [
                    feesInfo.protocolFeeCollector,
                    campaign.clientFeeCollector,
                    attributorFeeCollector,
                    attribution.partner,
                    attribution.endUser
                ],
                [fees[0], fees[1], fees[2], amountToPartner, amountToEndUser]
            );
        }
    }

    /**
     * @dev Claims: sends funds to `receiver` that has available to claim funds.
     *
     * `tokenIds` parameter is only used when dealing with ERC1155 and ERC721 tokens.
     * `amounts` parameter is only used when dealing with ERC1155 tokens.
     *
     * Requirements:
     *
     * - `receiver` must have available funds to claim in `campaignId`.
     * - Only Fuul Manager can call this function.
     * - Attribution must not be paused.
     */

    function claimFromCampaign(
        uint256 campaignId,
        address receiver,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    )
        external
        onlyFuulManager
        nonReentrant
        whenManagerIsPaused
        returns (uint256 claimAmount, address claimCurrency)
    {
        Campaign storage campaign = campaigns[campaignId];

        uint256 availableAmount = availableToClaim[receiver][campaignId];

        // Commented to optimize contract size

        // if (availableAmount == 0) {
        //     revert ZeroAmount();
        // }

        IFuulManager.TokenType tokenType = campaign.tokenType;
        address currency = campaign.currency;

        uint256 tokenAmount;

        if (tokenType == IFuulManager.TokenType.NATIVE) {
            tokenAmount = availableAmount;

            payable(receiver).sendValue(tokenAmount);
        } else if (tokenType == IFuulManager.TokenType.ERC_20) {
            tokenAmount = availableAmount;

            IERC20(currency).safeTransfer(receiver, tokenAmount);
        } else if (tokenType == IFuulManager.TokenType.ERC_721) {
            tokenAmount = tokenIds.length;

            for (uint256 i = 0; i < tokenIds.length; i++) {
                _transferERC721Tokens(
                    currency,
                    address(this),
                    receiver,
                    tokenIds[i]
                );
            }
        } else if (tokenType == IFuulManager.TokenType.ERC_1155) {
            tokenAmount = _getSumFromArray(amounts);

            _transferERC1155Tokens(
                currency,
                address(this),
                receiver,
                tokenIds,
                amounts
            );
        }

        // Update user budget

        availableToClaim[receiver][campaignId] -= tokenAmount;

        emit Claimed(
            campaignId,
            receiver,
            currency,
            tokenAmount,
            tokenIds,
            amounts
        );

        return (tokenAmount, currency);
    }

    /*╔═════════════════════════════╗
      ║   INTERNAL TRANSFER TOKENS  ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Helper function to transfer ERC721 tokens.
     */
    function _transferERC721Tokens(
        address tokenAddress,
        address senderAddress,
        address receiverAddress,
        uint256 tokenId
    ) internal {
        // Transfer from does not allow to send more funds than balance
        IERC721(tokenAddress).safeTransferFrom(
            senderAddress,
            receiverAddress,
            tokenId
        );
    }

    /**
     * @dev Helper function to transfer ERC1155 tokens.
     */
    function _transferERC1155Tokens(
        address tokenAddress,
        address senderAddress,
        address receiverAddress,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) internal {
        // Transfer from does not allow to send more funds than balance
        IERC1155(tokenAddress).safeBatchTransferFrom(
            senderAddress,
            receiverAddress,
            tokenIds,
            amounts,
            ""
        );
    }

    /*╔═════════════════════════════╗
      ║            OTHER            ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Helper function to sum all amounts inside the array.
     */
    function _getSumFromArray(
        uint256[] memory amounts
    ) internal pure returns (uint256 result) {
        for (uint256 i = 0; i < amounts.length; i++) {
            result += amounts[i];
        }

        return result;
    }

    /*╔═════════════════════════════╗
      ║          OVERRIDES          ║
      ╚═════════════════════════════╝*/

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(AccessControlEnumerable, ERC1155Receiver)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
