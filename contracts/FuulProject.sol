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

    // Address that will receive client fees (client that created the project)
    address public clientFeeCollector;

    // Roles for allowed addresses to send events through our SDK (not used in the contract)
    bytes32 public constant EVENTS_SIGNER_ROLE =
        keccak256("EVENTS_SIGNER_ROLE");

    // Hash for servers to know if they are synced with the last version of the project URI
    bytes32 public lastStatusHash;

    // URI that points to a file with project information (image, name, description, etc)
    string public projectInfoURI;

    // Timestamp for the last application to remove budget
    uint256 public lastRemovalApplication;

    // Mapping currency with amount
    mapping(address => uint256) public budgets;

    // Mapping owner address to currency to earnings
    mapping(address => mapping(address => uint256)) public availableToClaim;

    // Mapping currency with fees when rewarding NFTs
    mapping(address => uint256) public nftFeeBudget;

    // Mapping attribution proofs with already processed
    mapping(bytes32 => bool) public attributionProofs;

    /**
     * @dev Modifier that the sender is the fuul manager. Reverts
     * with an Unauthorized error including the sender and the required sender.
     */

    modifier onlyFuulManager() {
        _onlyFuulManager();
        _;
    }

    /**
     * @dev Internal function for {onlyFuulManager} modifier. Reverts with a Unauthorized error.
     */
    function _onlyFuulManager() internal view {
        if (_msgSender() != fuulManagerAddress()) {
            revert Unauthorized();
        }
    }

    /**
     * @dev Modifier that the Fuul Manager contract is not paused. Reverts
     * with a ManagerIsPaused error.
     */
    modifier whenManagerIsPaused() {
        _whenManagerIsPaused();
        _;
    }

    /**
     * @dev Internal function for {whenManagerIsPaused} modifier. Reverts with a ManagerIsPaused error.
     */
    function _whenManagerIsPaused() internal view {
        if (fuulManagerInstance().isPaused()) {
            revert ManagerIsPaused();
        }
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
        string memory _projectInfoURI,
        address _clientFeeCollector
    ) external {
        require(fuulFactory == address(0), "FuulV1: FORBIDDEN");

        fuulFactory = _msgSender();
        projectInfoURI = _projectInfoURI;

        clientFeeCollector = _clientFeeCollector;

        _setupRole(DEFAULT_ADMIN_ROLE, projectAdmin);

        _setupRole(EVENTS_SIGNER_ROLE, _projectEventSigner);

        lastStatusHash = keccak256(
            abi.encodePacked(block.prevrandao, block.timestamp)
        );
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
     * - Only admins can call this function.
     */
    function setProjectURI(
        string memory _projectURI
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (bytes(_projectURI).length == 0) {
            revert EmptyURI();
        }

        projectInfoURI = _projectURI;

        lastStatusHash = keccak256(
            abi.encodePacked(block.prevrandao, block.timestamp)
        );

        emit ProjectInfoUpdated(_projectURI);
    }

    /*╔═════════════════════════════╗
      ║        DEPOSIT BUDGET       ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Deposits fungible tokens.
     * They can be native or ERC20 tokens.
     *
     * Emits {BudgetDeposited}.
     *
     * Requirements:
     *
     * - `amount` must be greater than zero.
     * - Only admins can deposit.
     * - Token currency must be accepted in {Fuul Manager}
     */
    function depositFungibleToken(
        address currency,
        uint256 amount
    ) external payable onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        if (amount == 0) {
            revert ZeroAmount();
        }

        if (!fuulManagerInstance().isCurrencyTokenAccepted(currency)) {
            revert IFuulManager.TokenCurrencyNotAccepted();
        }

        IFuulManager.TokenType tokenType = fuulManagerInstance().getTokenType(
            currency
        );

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
            IERC20(currency).safeTransferFrom(
                _msgSender(),
                address(this),
                amount
            );
        }

        // Update balance
        budgets[currency] += amount;

        uint256[] memory emptyArray;

        emit BudgetDeposited(
            _msgSender(),
            amount,
            currency,
            tokenType,
            emptyArray,
            emptyArray
        );
    }

    /**
     * @dev Deposits NFTs.
     * They can be ERC1155 or ERC721 tokens.
     * `amounts` parameter is only used when dealing with ERC1155 tokens.
     *
     * Emits {BudgetDeposited}.
     *
     * Requirements:
     *
     * - Only admins can deposit.
     */
    function depositNFTToken(
        address currency,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        if (!fuulManagerInstance().isCurrencyTokenAccepted(currency)) {
            revert IFuulManager.TokenCurrencyNotAccepted();
        }

        IFuulManager.TokenType tokenType = fuulManagerInstance().getTokenType(
            currency
        );

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
        budgets[currency] += depositedAmount;

        emit BudgetDeposited(
            _msgSender(),
            depositedAmount,
            currency,
            tokenType,
            tokenIds,
            tokenAmounts
        );
    }

    /*╔═════════════════════════════╗
      ║        REMOVE BUDGET        ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Sets timestamp for which users request to remove their budgets.
     *     *
     * Requirements:
     *
     * - Only admins can call this function.
     */
    function applyToRemoveBudget() external onlyRole(DEFAULT_ADMIN_ROLE) {
        lastRemovalApplication = block.timestamp;
    }

    /**
     * @dev Returns the timestamp when funds can be removed.
     * The period for removing a project's budget begins upon calling the {applyToRemoveBudget} function
     * and ends once the {projectBudgetCooldown} period has elapsed.
     */
    function getBudgetCooldownPeriod() public view returns (uint256) {
        if (lastRemovalApplication == 0) {
            revert NoRemovalApplication();
        }
        return
            lastRemovalApplication +
            fuulManagerInstance().projectBudgetCooldown();
    }

    /**
     * @dev Removes fungible tokens.
     * They can be native or ERC20 tokens.
     *
     * Emits {BudgetRemoved}.
     *
     * Requirements:
     *
     * - `amount` must be greater than zero.
     * - Only admins can remove.
     * - Budget remove cooldown period has to be completed.
     */
    function removeFungibleBudget(
        address currency,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        if (amount == 0) {
            revert ZeroAmount();
        }

        IFuulManager.TokenType tokenType = fuulManagerInstance().getTokenType(
            currency
        );

        // Commented to optimize contract size

        // require(
        //     tokenType == IFuulManager.TokenType.NATIVE ||
        //         tokenType == IFuulManager.TokenType.ERC_20,
        //     "Currency is not a fungible token"
        // );
        uint256 cooldownPeriod = getBudgetCooldownPeriod();

        if (block.timestamp < cooldownPeriod) {
            revert CooldownPeriodNotFinished();
        }

        // Update budget - By underflow it indirectly checks that amount <= currentBudget
        budgets[currency] -= amount;

        if (tokenType == IFuulManager.TokenType.NATIVE) {
            payable(_msgSender()).sendValue(amount);
        } else if (tokenType == IFuulManager.TokenType.ERC_20) {
            IERC20(currency).safeTransfer(_msgSender(), amount);
        }

        uint256[] memory emptyArray;

        emit BudgetRemoved(
            _msgSender(),
            amount,
            currency,
            tokenType,
            emptyArray,
            emptyArray
        );
    }

    /**
     * @dev Removes NFT tokens.
     * They can be ERC1155 or ERC721 tokens.
     * `amounts` parameter is only used when dealing with ERC1155 tokens.
     *
     * Emits {BudgetRemoved}.
     *
     * Requirements:
     *
     * - `amount` must be greater than zero.
     * - Only admins can remove.
     * - Budget remove cooldown period has to be completed.
     */
    function removeNFTBudget(
        address currency,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        uint256 tokenIdsLength = tokenIds.length;

        if (tokenIdsLength == 0) {
            revert ZeroAmount();
        }

        uint256 cooldownPeriod = getBudgetCooldownPeriod();

        if (block.timestamp < cooldownPeriod) {
            revert CooldownPeriodNotFinished();
        }

        IFuulManager.TokenType tokenType = fuulManagerInstance().getTokenType(
            currency
        );
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

        // Update budget - By underflow it indirectly checks that amount <= budget
        budgets[currency] -= removeAmount;

        emit BudgetRemoved(
            _msgSender(),
            removeAmount,
            currency,
            tokenType,
            tokenIds,
            amounts
        );
    }

    /*╔═════════════════════════════╗
      ║        NFT FEE BUDGET       ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Deposits budget to pay for fees when rewarding NFTs.
     * The currency is defined in the {FuulManager} contract.
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
    ) external payable onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        if (amount == 0) {
            revert ZeroAmount();
        }

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
     * Emits {FeeBudgetRemoved}.
     *
     * Notes: Currency is an argument because if the default is changed in {FuulManager}, projects will still be able to remove
     *
     * Requirements:
     *
     * - `amount` must be greater than zero.
     * - Only admins can remove.
     * - Budget remove cooldown period has to be completed.
     */
    function removeFeeBudget(
        address currency,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        if (amount == 0) {
            revert ZeroAmount();
        }

        uint256 cooldownPeriod = getBudgetCooldownPeriod();

        if (block.timestamp < cooldownPeriod) {
            revert CooldownPeriodNotFinished();
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
     * @dev Internal function to calculate fees and amounts for fungible token reward.
     *
     */

    function _calculateAmountsForFungibleToken(
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
            (feesInfo.protocolFee * totalAmount) / 10000,
            (feesInfo.clientFee * totalAmount) / 10000,
            (feesInfo.attributorFee * totalAmount) / 10000
        ];

        // Get net amounts
        uint256 netTotal = (totalAmount - allFees[0] - allFees[1] - allFees[2]);
        uint256 netPartnerAmount = (netTotal * partnerPercentage) / 100;

        uint256 netEndUserAmount = netTotal - netPartnerAmount;

        return (allFees, netPartnerAmount, netEndUserAmount);
    }

    /**
     * @dev Internal function to calculate fees for non fungible token reward.
     *
     */
    function _calculateFeesForNFT(
        IFuulManager.FeesInformation memory feesInfo
    ) internal pure returns (uint256[3] memory fees) {
        uint256 totalAmount = feesInfo.nftFixedFeeAmount;
        uint256[3] memory allFees = [
            (feesInfo.protocolFee * totalAmount) / 10000,
            (feesInfo.clientFee * totalAmount) / 10000,
            (feesInfo.attributorFee * totalAmount) / 10000
        ];

        return allFees;
    }

    /**
     * @dev Attributes: removes amounts from budget and adds them to corresponding partners, users and fee collectors.
     * 
     * Emits {Attributed}.
     * 
     * Notes:
     * - When rewards are fungible tokens, fees will be a percentage of the payment and it will be substracted from the payment.
     * - When rewards are NFTs, fees will be a fixed amount and the {nftFeeBudget} will be used.
     *
     * Requirements:
     *
     * - Currency budgets have to be greater than amounts attributed.
     * - The sum of  {amountToPartner} and {amountToEndUser} of each {Attribution} must be greater than zero.
     * - Only {FuulManager} can attribute.
     * - {FuulManager} must not be paused.

     */

    function attributeTransactions(
        Attribution[] calldata attributions,
        address attributorFeeCollector
    ) external onlyFuulManager nonReentrant whenManagerIsPaused {
        IFuulManager.FeesInformation memory feesInfo = fuulManagerInstance()
            .getFeesInformation();

        for (uint256 i = 0; i < attributions.length; i++) {
            Attribution memory attribution = attributions[i];

            if (attributionProofs[attribution.proof]) {
                revert AlreadyAttributed();
            }

            attributionProofs[attribution.proof] = true;

            uint256 totalAmount = attribution.amountToPartner +
                attribution.amountToEndUser;

            if (totalAmount == 0) {
                revert ZeroAmount();
            }

            address currency = attribution.currency;

            IFuulManager.TokenType tokenType = fuulManagerInstance()
                .getTokenType(currency);

            // Calculate fees and amounts

            uint256[3] memory fees;
            uint256 amountToPartner;
            uint256 amountToEndUser;
            address feeCurrency;

            if (
                tokenType == IFuulManager.TokenType.NATIVE ||
                tokenType == IFuulManager.TokenType.ERC_20
            ) {
                (
                    fees,
                    amountToPartner,
                    amountToEndUser
                ) = _calculateAmountsForFungibleToken(
                    feesInfo,
                    totalAmount,
                    attribution.amountToPartner,
                    attribution.amountToEndUser
                );

                feeCurrency = currency;
            } else {
                fees = _calculateFeesForNFT(feesInfo);
                amountToPartner = attribution.amountToPartner;
                amountToEndUser = attribution.amountToEndUser;

                feeCurrency = feesInfo.nftFeeCurrency;

                // Remove from fees budget
                nftFeeBudget[feeCurrency] -= (fees[0] + fees[1] + fees[2]);
            }

            // Update budget balance
            budgets[currency] -= totalAmount;

            // Update protocol balance
            availableToClaim[feesInfo.protocolFeeCollector][
                feeCurrency
            ] += fees[0];

            // Update client balance
            availableToClaim[clientFeeCollector][feeCurrency] += fees[1];

            // Update attributor balance
            availableToClaim[attributorFeeCollector][feeCurrency] += fees[2];

            // Update partner balance
            availableToClaim[attribution.partner][currency] += amountToPartner;

            // Update end user balance
            availableToClaim[attribution.endUser][currency] += amountToEndUser;

            // Emit Event
            emit Attributed(
                currency,
                totalAmount,
                [
                    feesInfo.protocolFeeCollector,
                    clientFeeCollector,
                    attributorFeeCollector,
                    attribution.partner,
                    attribution.endUser
                ],
                [fees[0], fees[1], fees[2], amountToPartner, amountToEndUser],
                attribution.proof
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
     * - `receiver` must have available funds to claim for {currency}.
     * - Only {FuulManager} can call this function.
     * - {FuulManager} must not be paused.
     */

    function claimFromProject(
        address currency,
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
        uint256 availableAmount = availableToClaim[receiver][currency];

        if (availableAmount == 0) {
            revert ZeroAmount();
        }

        IFuulManager.TokenType tokenType = fuulManagerInstance().getTokenType(
            currency
        );

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

        // Update user budget - it will fail from underflow if insufficient funds

        availableToClaim[receiver][currency] -= tokenAmount;

        emit Claimed(receiver, currency, tokenAmount, tokenIds, amounts);

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
