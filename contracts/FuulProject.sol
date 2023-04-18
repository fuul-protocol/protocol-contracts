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

    // Campaign info
    struct Campaign {
        uint256 totalDeposited;
        uint256 currentBudget;
        address currency;
        uint256 deactivatedAt;
        string campaignURI;
        IFuulManager.TokenType tokenType;
    }

    // User earnings per campaign
    struct UserEarnings {
        uint256 totalEarnings;
        uint256 availableToClaim;
    }

    // Protocol fees per curency
    struct ProtocolFees {
        uint256 totalFees;
        uint256 availableToClaim;
    }

    // Factory contract address
    address public fuulFactory;

    // Campaigns created number tracker
    Counters.Counter private _campaignIdTracker;

    // Roles for allowed addresses to send events through our SDK (not used in the contract)
    bytes32 public constant EVENTS_SIGNER_ROLE =
        keccak256("EVENTS_SIGNER_ROLE");

    // Mapping campaign id with campaign info
    mapping(uint256 => Campaign) public campaigns;

    // Mapping owner address to campaign id to earnings
    mapping(address => mapping(uint256 => UserEarnings)) public usersEarnings;

    // Mapping token address to fees
    mapping(address => mapping(uint256 => ProtocolFees))
        public protocolFeesperCurrency;

    // URI that points to a file with project information (image, name, description, etc)
    string public projectInfoURI;

    // Helper empty array to input in events
    uint256[] private emptyArray;

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
    modifier whenFundsNotFreezed() {
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
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (bytes(_projectURI).length == 0) {
            revert EmptyURI();
        }

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
     * - `_campaignURI` must not be an empty string.
     * - `currency` must be accepted in the Fuul Manager contract.
     * - Only admins can create campaigns.
     */
    function createCampaign(
        string memory _campaignURI,
        address currency
    ) external nonReentrant onlyRole(DEFAULT_ADMIN_ROLE) {
        if (bytes(_campaignURI).length == 0) {
            revert EmptyURI();
        }

        if (!fuulManagerInstance().isCurrencyTokenAccepted(currency)) {
            revert IFuulManager.TokenCurrencyNotAccepted();
        }

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
            campaignURI: _campaignURI,
            tokenType: tokenType
        });

        emit CampaignCreated(
            _msgSender(),
            currency,
            campaignId,
            tokenType,
            _campaignURI
        );
    }

    /**
     * @dev Reactivates campaign. Sets the active value to be true
     *
     * Requirements:
     *
     * - `campaignId` must exist and be inactive.
     * - Only admins can reactivate campaigns.
     */
    function reactivateCampaign(
        uint256 campaignId
    )
        external
        nonReentrant
        onlyRole(DEFAULT_ADMIN_ROLE)
        campaignExists(campaignId)
    {
        Campaign storage campaign = campaigns[campaignId];

        if (campaign.deactivatedAt == 0) {
            revert CampaignNotInactive();
        }

        campaign.deactivatedAt = 0;
    }

    /**
     * @dev Deactivates campaign. Sets the active value to be false
     *
     * Requirements:
     *
     * - `campaignId` must exist and be active.
     * - Only admins can deactivate campaigns.
     */
    function deactivateCampaign(
        uint256 campaignId
    )
        external
        nonReentrant
        onlyRole(DEFAULT_ADMIN_ROLE)
        campaignExists(campaignId)
    {
        Campaign storage campaign = campaigns[campaignId];

        if (campaign.deactivatedAt > 0) {
            revert CampaignNotActive();
        }

        campaign.deactivatedAt = block.timestamp;
    }

    /**
     * @dev Sets `campaignURI` in the Campaign structure.
     *
     * Emits {CampaignMetadataUpdated}.
     *
     * Requirements:
     *
     * - `campaignId` must exist.
     * - `_campaignURI` must not be an empty string.
     * - Only admins can deactivate campaigns.
     */

    function setCampaignURI(
        uint256 _campaignId,
        string memory _campaignURI
    )
        external
        nonReentrant
        onlyRole(DEFAULT_ADMIN_ROLE)
        campaignExists(_campaignId)
    {
        if (bytes(_campaignURI).length == 0) {
            revert EmptyURI();
        }
        campaigns[_campaignId].campaignURI = _campaignURI;

        emit CampaignMetadataUpdated(_campaignId, _campaignURI);
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
     * - Funds must not be freezed.
     */
    function depositFungibleToken(
        uint256 campaignId,
        uint256 amount
    )
        external
        payable
        nonReentrant
        whenFundsNotFreezed
        onlyRole(DEFAULT_ADMIN_ROLE)
        campaignExists(campaignId)
    {
        if (amount == 0) {
            revert ZeroAmount();
        }
        Campaign storage campaign = campaigns[campaignId];

        address currency = campaign.currency;

        if (!fuulManagerInstance().isCurrencyTokenAccepted(currency)) {
            revert IFuulManager.TokenCurrencyNotAccepted();
        }

        IFuulManager.TokenType tokenType = campaign.tokenType;

        if (campaign.deactivatedAt > 0) {
            revert CampaignNotActive();
        }
        // Commented to optimize contract size

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
            if (msg.value > 0) {
                revert IncorrectMsgValue();
            }

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
     * - Funds must not be freezed.
     */
    function depositNFTToken(
        uint256 campaignId,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    )
        external
        nonReentrant
        whenFundsNotFreezed
        onlyRole(DEFAULT_ADMIN_ROLE)
        campaignExists(campaignId)
    {
        Campaign storage campaign = campaigns[campaignId];
        address currency = campaign.currency;

        if (!fuulManagerInstance().isCurrencyTokenAccepted(currency)) {
            revert IFuulManager.TokenCurrencyNotAccepted();
        }

        IFuulManager.TokenType tokenType = campaign.tokenType;

        if (campaign.deactivatedAt > 0) {
            revert CampaignNotActive();
        }
        // Commented to optimize contract size

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
     * - Funds must not be freezed.
     * - Budget remove cooldown period has to be completed.
     */
    function removeFungibleBudget(
        uint256 campaignId,
        uint256 amount
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        whenFundsNotFreezed
        nonReentrant
        campaignExists(campaignId)
    {
        if (amount == 0) {
            revert ZeroAmount();
        }
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
            // Commented to optimize contract size
            // uint256 balance = address(this).balance;

            // if (amount > balance)
            //     revert InsufficientBalance({
            //         available: balance,
            //         required: amount
            //     });

            payable(_msgSender()).sendValue(amount);
        } else if (tokenType == IFuulManager.TokenType.ERC_20) {
            // Commented to optimize contract size

            // uint256 balance = IERC20(currency).balanceOf(address(this));
            // if (amount > balance)
            //     revert InsufficientBalance({
            //         available: balance,
            //         required: amount
            //     });
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
     * - Funds must not be freezed.
     * - Budget remove cooldown period has to be completed.
     */
    function removeNFTBudget(
        uint256 campaignId,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        whenFundsNotFreezed
        nonReentrant
        campaignExists(campaignId)
    {
        uint256 tokenIdsLength = tokenIds.length;
        if (tokenIdsLength == 0) {
            revert ZeroAmount();
        }
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
      ║         ATTRIBUTION         ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Attributes: removes `amounts` from `campaignIds` balance and adds them to `receivers`.
     *
     * Requirements:
     *
     * - All arrays must have the same length.
     * - All elements of `campaignIds` must exist and have the corresponding balance.
     * - All elements of `amounts` must be greater than zero.
     * - Only Fuul Manager can attribute.
     */
    function attributeTransactions(
        uint256[] calldata campaignIds,
        address[] calldata receivers,
        uint256[] calldata amounts
    ) external onlyFuulManager nonReentrant {
        if (campaignIds.length != receivers.length) {
            revert IFuulManager.InvalidArgument();
        }

        if (campaignIds.length != amounts.length) {
            revert IFuulManager.InvalidArgument();
        }

        for (uint256 i = 0; i < campaignIds.length; i++) {
            uint256 campaignId = campaignIds[i];

            if (campaignId == 0 || campaignId > campaignsCreated()) {
                revert CampaignNotExists();
            }

            uint256 amount = amounts[i];

            if (amount == 0) {
                revert ZeroAmount();
            }

            campaigns[campaignId].currentBudget -= amount;

            UserEarnings storage user = usersEarnings[receivers[i]][campaignId];

            user.totalEarnings += amount;
            user.availableToClaim += amount;
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
     * - Funds must not be freezed.
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
        whenFundsNotFreezed
        returns (uint256 claimAmount, address claimCurrency)
    {
        UserEarnings storage user = usersEarnings[receiver][campaignId];

        Campaign storage campaign = campaigns[campaignId];

        uint256 availableAmount = user.availableToClaim;

        if (availableAmount == 0) {
            revert ZeroAmount();
        }

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

            // Check that tokenAmount is less than availableAmount?

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

            // Check that tokenAmount is less than availableAmount?

            _transferERC1155Tokens(
                currency,
                address(this),
                receiver,
                tokenIds,
                amounts
            );
        }

        // Update user budget

        user.availableToClaim -= tokenAmount;

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
      ║          EMERGENCY          ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Withdraws all fungible tokens from contract to a receiver `to`.
     * They can be native or ERC20 tokens.
     *
     * Requirements:
     *
     * - `to` must not be the zero address.
     * - Only Fuul Manager can call this function.
     */
    function emergencyWithdrawFungibleTokens(
        address to,
        address currency
    ) external onlyFuulManager {
        if (to == address(0)) {
            revert ZeroAddress();
        }

        if (currency == address(0)) {
            // uint256 balance = address(this).balance;
            // require(balance > 0, "Contract has no balance");

            payable(to).sendValue(address(this).balance);
        } else {
            // uint256 balance = IERC20(currency).balanceOf(address(this));

            // require(balance > 0, "Contract has no balance");

            IERC20(currency).safeTransfer(
                to,
                IERC20(currency).balanceOf(address(this))
            );
        }
    }

    /**
     * @dev Withdraws all NFTs from contract to a receiver `to`.
     * They can be ERC1155 or ERC721 tokens.
     *
     * Requirements:
     *
     * - `to` must not be the zero address.
     * - Only Fuul Manager can call this function.
     */

    function emergencyWithdrawNFTTokens(
        address to,
        address currency,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) external onlyFuulManager {
        if (to == address(0)) {
            revert ZeroAddress();
        }
        IFuulManager.TokenType tokenType = fuulManagerInstance().getTokenType(
            currency
        );

        if (tokenType == IFuulManager.TokenType.ERC_721) {
            for (uint256 i = 0; i < tokenIds.length; i++) {
                _transferERC721Tokens(currency, address(this), to, tokenIds[i]);
            }
        } else if (tokenType == IFuulManager.TokenType.ERC_1155) {
            _transferERC1155Tokens(
                currency,
                address(this),
                to,
                tokenIds,
                amounts
            );
        }
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
