// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "@openzeppelin/contracts/utils/Address.sol";

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
    using SafeERC20 for IERC20;
    using Address for address payable;
    using ERC165Checker for address;

    // Interfaces for ERC721 and ERC1155 contracts
    bytes4 public constant IID_IERC1155 = type(IERC1155).interfaceId;
    bytes4 public constant IID_IERC721 = type(IERC721).interfaceId;

    // Factory contract address
    address public immutable fuulFactory;

    // Address that will receive client fees (client that created the project)
    address public clientFeeCollector;

    // Roles for allowed addresses to send events through our SDK (not used in the contract)
    bytes32 public constant EVENTS_SIGNER_ROLE =
        keccak256("EVENTS_SIGNER_ROLE");

    // Mapping attribution proofs with already processed
    mapping(bytes32 => bool) public attributionProofs;

    // Hash for servers to know if they are synced with the last version of the project URI
    bytes32 public lastStatusHash;

    // URI that points to a file with project information (image, name, description, attribution conditions, etc)
    string public projectInfoURI;

    // Timestamp for the last application to remove budget
    uint256 public lastRemovalApplication;

    // Mapping currency with amount
    mapping(address => uint256) public budgets;

    // Mapping owner address to currency to earnings
    mapping(address => mapping(address => uint256)) public availableToClaim;

    // Mapping currency with fees when rewarding NFTs. Using mappings to be able to withdraw after fee currency changes
    mapping(address => uint256) public nftFeeBudget;

    /**
     * @dev Modifier to check if the project can remove funds. Reverts with an {OutsideRemovalWindow} error.
     */
    modifier canRemove() {
        canRemoveFunds();
        _;
    }

    /**
     * @dev Modifier to check if the currency is accepted in {FuulManager}.
     */
    modifier isCurrencyAccepted(address currency) {
        _isCurrencyAccepted(currency);
        _;
    }

    /**
     * @dev Internal function for {isCurrencyAccepted} modifier. Reverts with a {TokenCurrencyNotAccepted} error.
     */
    function _isCurrencyAccepted(address currency) internal view {
        if (!_fuulManagerInstance().isCurrencyTokenAccepted(currency)) {
            revert IFuulManager.TokenCurrencyNotAccepted();
        }
    }

    /**
     * @dev Modifier to check if the uint amount is zero.
     */
    modifier nonZeroAmount(uint256 amount) {
        _nonZeroAmount(amount);
        _;
    }

    /**
     * @dev Internal function for {nonZeroAmount} modifier. Reverts with a {TokenCurrencyNotAccepted} error.
     */
    function _nonZeroAmount(uint256 amount) internal pure {
        if (amount == 0) {
            revert ZeroAmount();
        }
    }

    /*╔═════════════════════════════╗
      ║         CONSTRUCTOR         ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Sets the value for {fuulFactory}.
     * This value is immutable.
     */
    constructor() {
        fuulFactory = _msgSender();
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
        if (fuulFactory != _msgSender()) {
            revert Forbidden();
        }

        _setupRole(DEFAULT_ADMIN_ROLE, projectAdmin);

        _setupRole(EVENTS_SIGNER_ROLE, _projectEventSigner);

        _setProjectURI(_projectInfoURI);

        clientFeeCollector = _clientFeeCollector;
    }

    /*╔═════════════════════════════╗
      ║     FROM OTHER CONTRACTS    ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Returns the address of the active Fuul Manager contract.
     */
    function _fuulManagerAddress() internal view returns (address) {
        return IFuulFactory(fuulFactory).fuulManager();
    }

    /**
     * @dev Returns the instance of the Fuul Manager contract.
     */
    function _fuulManagerInstance() internal view returns (IFuulManager) {
        return IFuulManager(_fuulManagerAddress());
    }

    /*╔═════════════════════════════╗
      ║        PROJECT INFO         ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Internal function that sets `projectInfoURI` as the information for the project.
     *
     * It also sets a new value for {lastStatusHash}.
     *
     * Requirements:
     *
     * - `_projectURI` must not be an empty string.
     */
    function _setProjectURI(string memory _projectURI) internal {
        if (bytes(_projectURI).length == 0) {
            revert EmptyURI();
        }

        projectInfoURI = _projectURI;

        lastStatusHash = keccak256(
            abi.encodePacked(block.prevrandao, block.timestamp)
        );
    }

    /**
     * @dev Sets `projectInfoURI` as the information for the project.
     *
     * Emits {ProjectInfoUpdated}.
     *
     * Requirements:
     *
     * - Only admins can call this function.
     */
    function setProjectURI(
        string memory _projectURI
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setProjectURI(_projectURI);
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
     * - Currency must be the address zero (nativa token) or ERC20.
     */
    function depositFungibleToken(
        address currency,
        uint256 amount
    )
        external
        payable
        onlyRole(DEFAULT_ADMIN_ROLE)
        nonReentrant
        isCurrencyAccepted(currency)
        nonZeroAmount(amount)
    {
        if (currency == address(0)) {
            if (msg.value != amount) {
                revert IncorrectMsgValue();
            }
        } else if (isERC20(currency)) {
            IERC20(currency).safeTransferFrom(
                _msgSender(),
                address(this),
                amount
            );
        } else {
            revert InvalidCurrency();
        }

        // Update balance
        budgets[currency] += amount;

        emit FungibleBudgetDeposited(_msgSender(), amount, currency);
    }

    /**
     * @dev Deposits NFTs.
     *
     * Note: `amounts` parameter is only used when dealing with ERC1155 tokens.
     *
     * Emits {BudgetDeposited}.
     *
     * Requirements:
     *
     * - `tokenIds` must not be an empty string.
     * - Only admins can deposit.
     * - Token currency must be accepted in {Fuul Manager}
     * - Currency must be an ERC721 or ERC1155.
     */
    function depositNFTToken(
        address currency,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        nonReentrant
        isCurrencyAccepted(currency)
    {
        // Set default values as if it's an ERC721
        uint256 depositedAmount = tokenIds.length;
        uint256[] memory tokenAmounts;

        _nonZeroAmount(depositedAmount);

        if (currency.supportsInterface(IID_IERC721)) {
            _transferERC721Tokens(
                currency,
                _msgSender(),
                address(this),
                tokenIds,
                tokenIds.length
            );
        } else if (currency.supportsInterface(IID_IERC1155)) {
            _transferERC1155Tokens(
                currency,
                _msgSender(),
                address(this),
                tokenIds,
                amounts
            );

            // Change values for ERC1155
            depositedAmount = _getSumFromArray(amounts);
            tokenAmounts = amounts;
        } else {
            revert InvalidCurrency();
        }

        // Update balance
        budgets[currency] += depositedAmount;

        emit NFTBudgetDeposited(
            _msgSender(),
            depositedAmount,
            currency,
            tokenIds,
            tokenAmounts
        );
    }

    /*╔═════════════════════════════╗
      ║        REMOVE BUDGET        ║
      ╚═════════════════════════════╝*/

    /**
     * @dev Sets timestamp for which users request to remove their budgets.
     *
     * Requirements:
     *
     * - Only admins can call this function.
     */
    function applyToRemoveBudget() external onlyRole(DEFAULT_ADMIN_ROLE) {
        lastRemovalApplication = block.timestamp;
    }

    /**
     * @dev Returns the window when projects can remove funds.
     * The cooldown period for removing a project's budget begins upon calling the {applyToRemoveBudget} function
     * and ends once the {projectBudgetCooldown} period has elapsed.
     *
     * The period to remove starts when the cooldown is completed, and ends after {removePeriod}.
     *
     * It is a public function for the UI to be able to read and display dates.
     */
    function getBudgetRemovePeriod()
        public
        view
        returns (uint256 cooldown, uint256 removePeriodEnds)
    {
        uint256 _lastApplication = lastRemovalApplication;

        if (_lastApplication == 0) {
            revert NoRemovalApplication();
        }

        (uint256 budgetCooldown, uint256 removePeriod) = _fuulManagerInstance()
            .getBudgetRemoveInfo();

        cooldown = _lastApplication + budgetCooldown;
        removePeriodEnds = cooldown + removePeriod;

        return (cooldown, removePeriodEnds);
    }

    /**
     * @dev Returns if the project is inside the removal window.
     * It should be after the cooldown is completed and before the removal period ends.
     * It is a public function for the UI to be able to check if the project can remove.
     */
    function canRemoveFunds() public view returns (bool) {
        (
            uint256 cooldownPeriodEnds,
            uint256 removePeriodEnds
        ) = getBudgetRemovePeriod();

        if (
            block.timestamp < cooldownPeriodEnds ||
            block.timestamp > removePeriodEnds
        ) {
            revert OutsideRemovalWindow();
        }

        return true;
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
     * - Must be within the Budget removal window.
     * - Currency must be the address zero (nativa token) or ERC20.
     */
    function removeFungibleBudget(
        address currency,
        uint256 amount
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        nonReentrant
        canRemove
        nonZeroAmount(amount)
    {
        // Update budget - By underflow it indirectly checks that amount <= currentBudget
        budgets[currency] -= amount;

        if (currency == address(0)) {
            payable(_msgSender()).sendValue(amount);
        } else if (isERC20(currency)) {
            IERC20(currency).safeTransfer(_msgSender(), amount);
        } else {
            revert InvalidCurrency();
        }

        emit FungibleBudgetRemoved(_msgSender(), amount, currency);
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
     * - Must be within the Budget removal window.
     * - Currency must be an ERC721 or ERC1155.
     */
    function removeNFTBudget(
        address currency,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant canRemove {
        uint256 tokenIdsLength = tokenIds.length;

        _nonZeroAmount(tokenIdsLength);

        uint256 removeAmount;

        if (currency.supportsInterface(IID_IERC721)) {
            _transferERC721Tokens(
                currency,
                address(this),
                _msgSender(),
                tokenIds,
                tokenIdsLength
            );

            removeAmount = tokenIdsLength;
        } else if (currency.supportsInterface(IID_IERC1155)) {
            _transferERC1155Tokens(
                currency,
                address(this),
                _msgSender(),
                tokenIds,
                amounts
            );

            removeAmount = _getSumFromArray(amounts);
        } else {
            revert InvalidCurrency();
        }

        // Update budget - By underflow it indirectly checks that amount <= budget
        budgets[currency] -= removeAmount;

        emit NFTBudgetRemoved(
            _msgSender(),
            removeAmount,
            currency,
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
    )
        external
        payable
        onlyRole(DEFAULT_ADMIN_ROLE)
        nonReentrant
        nonZeroAmount(amount)
    {
        address currency = _fuulManagerInstance().nftFeeCurrency();

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
     * - Must be within the Budget removal window.
     */
    function removeFeeBudget(
        address currency,
        uint256 amount
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        nonReentrant
        canRemove
        nonZeroAmount(amount)
    {
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
     * @dev Internal function for to check if the sender is the manager. Reverts with a Unauthorized error.
     */
    function _onlyFuulManager(address _managerAddress) internal view {
        if (_msgSender() != _managerAddress) {
            revert Unauthorized();
        }
    }

    /**
     * @dev Internal function to calculate fees and amounts for fungible token reward.
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
        // Can this be unchecked?

        // Calculate the percentage to partners
        uint256 partnerPercentage = (100 * amountToPartner) /
            (amountToPartner + amountToEndUser);

        // Get all fees
        fees = [
            (feesInfo.protocolFee * totalAmount) / 10000,
            (feesInfo.clientFee * totalAmount) / 10000,
            (feesInfo.attributorFee * totalAmount) / 10000
        ];

        // Get net amounts
        uint256 netTotal = (totalAmount - fees[0] - fees[1] - fees[2]);
        netAmountToPartner = (netTotal * partnerPercentage) / 100;

        netAmountToEndUser = netTotal - netAmountToPartner;

        return (fees, netAmountToPartner, netAmountToEndUser);
    }

    /**
     * @dev Internal function to calculate fees for non fungible token reward.
     *
     */
    function _calculateFeesForNFT(
        IFuulManager.FeesInformation memory feesInfo
    ) internal pure returns (uint256[3] memory fees) {
        // Can this be unchecked?

        uint256 totalAmount = feesInfo.nftFixedFeeAmount;
        fees = [
            (feesInfo.protocolFee * totalAmount) / 10000,
            (feesInfo.clientFee * totalAmount) / 10000,
            (feesInfo.attributorFee * totalAmount) / 10000
        ];

        return fees;
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
     * - The sum of {amountToPartner} and {amountToEndUser} for each {Attribution} must be greater than zero.
     * - Only {FuulManager} can attribute.
     * - Proof must not exist (be previously attributed).

     */

    function attributeTransactions(
        Attribution[] calldata attributions,
        address attributorFeeCollector
    ) external nonReentrant {
        address fuulManagerAddress = _fuulManagerAddress();

        _onlyFuulManager(fuulManagerAddress);
        // The `attributeTransactions` function in {FuulManager} already checks if manager is paused

        IFuulManager.FeesInformation memory feesInfo = IFuulManager(
            fuulManagerAddress
        ).getFeesInformation();

        for (uint256 i = 0; i < attributions.length; i++) {
            Attribution memory attribution = attributions[i];

            if (attributionProofs[attribution.proof]) {
                revert AlreadyAttributed();
            }

            attributionProofs[attribution.proof] = true;

            uint256 totalAmount = attribution.amountToPartner +
                attribution.amountToEndUser;

            _nonZeroAmount(totalAmount);

            address currency = attribution.currency;

            // Calculate fees and amounts

            uint256[3] memory fees;
            uint256 amountToPartner;
            uint256 amountToEndUser;
            address feeCurrency;

            if (currency == address(0) || isERC20(currency)) {
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
                // It is not necessary to check if it's an NFT address. If it has budget and it is not a fungible, then it's an NFT
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
    ) external nonReentrant returns (uint256 claimAmount) {
        address fuulManagerAddress = _fuulManagerAddress();
        _onlyFuulManager(fuulManagerAddress);

        // The `claim` function in {FuulManager} already checks if manager is paused

        uint256 availableAmount = availableToClaim[receiver][currency];

        _nonZeroAmount(availableAmount);

        if (currency == address(0)) {
            claimAmount = availableAmount;

            payable(receiver).sendValue(claimAmount);
        } else if (isERC20(currency)) {
            claimAmount = availableAmount;

            IERC20(currency).safeTransfer(receiver, claimAmount);
        } else if (currency.supportsInterface(IID_IERC721)) {
            uint256 tokenIdsLength = tokenIds.length;
            claimAmount = tokenIdsLength;

            _transferERC721Tokens(
                currency,
                address(this),
                receiver,
                tokenIds,
                tokenIdsLength
            );
        } else if (currency.supportsInterface(IID_IERC1155)) {
            claimAmount = _getSumFromArray(amounts);

            _transferERC1155Tokens(
                currency,
                address(this),
                receiver,
                tokenIds,
                amounts
            );
        } else {
            revert InvalidCurrency();
        }

        // Update user budget - it will fail from underflow if insufficient funds

        availableToClaim[receiver][currency] -= claimAmount;

        emit Claimed(receiver, currency, claimAmount, tokenIds, amounts);

        return claimAmount;
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
        uint256[] memory tokenIds,
        uint256 length
    ) internal {
        for (uint256 i = 0; i < length; i++) {
            IERC721(tokenAddress).safeTransferFrom(
                senderAddress,
                receiverAddress,
                tokenIds[i]
            );
        }
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
