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

    /*╔═════════════════════════════╗
      ║          STRUCTS            ║
      ╚═════════════════════════════╝*/

    struct Campaign {
        uint256 totalDeposited;
        uint256 currentBudget;
        address currency;
        uint256 deactivatedAt;
        string campaignURI;
        IFuulManager.TokenType tokenType;
    }

    struct UserEarnings {
        uint256 totalEarnings;
        uint256 availableToClaim;
    }

    /*╔═════════════════════════════╗
      ║          VARIABLES          ║
      ╚═════════════════════════════╝*/

    Counters.Counter private _campaignIdTracker;

    bytes32 public constant EVENTS_SIGNER_ROLE =
        keccak256("EVENTS_SIGNER_ROLE");

    address public fuulFactory;

    mapping(uint256 => Campaign) public campaigns; //  campaignId => Campaign

    mapping(address => mapping(uint256 => UserEarnings)) public usersEarnings; // Address => campaign => UserEarnings

    uint256[] private emptyArray;

    string public projectInfoURI;

    /*╔═════════════════════════════╗
      ║           MODIFIER          ║
      ╚═════════════════════════════╝*/

    modifier campaignExists(uint256 _campaignId) {
        if (_campaignId == 0 || _campaignId > campaignsCreated()) {
            revert CampaignNotExists(_campaignId);
        }
        _;
    }

    modifier onlyFuulManager() {
        if (msg.sender != fuulManagerAddress()) {
            revert Unauthorized({
                sender: msg.sender,
                requiredSender: fuulManagerAddress()
            });
        }
        _;
    }

    modifier whenFundsNotFreezed() {
        if (fuulManagerInstance().isPaused()) {
            revert ManagerIsPaused();
        }
        _;
    }

    /*╔═════════════════════════════╗
      ║         CONSTRUCTOR         ║
      ╚═════════════════════════════╝*/

    constructor() {
        fuulFactory = address(0);
    }

    // called once by the factory at time of deployment
    function initialize(
        address projectAdmin,
        address _projectEventSigner,
        string memory _projectInfoURI
    ) external {
        require(fuulFactory == address(0), "FuulV1: FORBIDDEN");

        if (bytes(_projectInfoURI).length == 0) {
            revert EmptyURI(_projectInfoURI);
        }
        fuulFactory = msg.sender;
        projectInfoURI = _projectInfoURI;

        _setupRole(DEFAULT_ADMIN_ROLE, projectAdmin);
        _setupRole(EVENTS_SIGNER_ROLE, _projectEventSigner);
    }

    /*╔═════════════════════════════╗
      ║     FROM OTHER CONTRACTS    ║
      ╚═════════════════════════════╝*/

    function fuulManagerAddress() public view returns (address) {
        return IFuulFactory(fuulFactory).fuulManager();
    }

    function fuulManagerInstance() public view returns (IFuulManager) {
        return IFuulManager(fuulManagerAddress());
    }

    /*╔═════════════════════════════╗
      ║        PROJECT INFO         ║
      ╚═════════════════════════════╝*/

    function setProjectInfoURI(
        string memory _projectURI
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (bytes(_projectURI).length == 0) {
            revert EmptyURI(_projectURI);
        }

        projectInfoURI = _projectURI;

        emit ProjectInfoUpdated(_projectURI);
    }

    /*╔═════════════════════════════╗
      ║          CAMPAIGNS          ║
      ╚═════════════════════════════╝*/

    function campaignsCreated() public view returns (uint256) {
        return _campaignIdTracker.current();
    }

    function createCampaign(
        string memory _campaignURI,
        address currency
    ) external nonReentrant onlyRole(DEFAULT_ADMIN_ROLE) {
        if (bytes(_campaignURI).length == 0) {
            revert EmptyURI(_campaignURI);
        }

        if (!fuulManagerInstance().isCurrencyTokenAccepted(currency)) {
            revert TokenCurrencyNotAccepted(currency);
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
            msg.sender,
            currency,
            campaignId,
            tokenType,
            _campaignURI
        );
    }

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
            revert CampaignNotInactive(campaignId);
        }

        campaign.deactivatedAt = 0;
    }

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
            revert CampaignNotActive(campaignId);
        }

        campaign.deactivatedAt = block.timestamp;
    }

    function setCampaignURI(
        uint256 _campaignId,
        string memory _campaignURI
    )
        external
        nonReentrant
        onlyRole(DEFAULT_ADMIN_ROLE)
        campaignExists(_campaignId)
    {
        campaigns[_campaignId].campaignURI = _campaignURI;

        emit CampaignMetadataUpdated(_campaignId, _campaignURI);
    }

    /*╔═════════════════════════════╗
      ║        DEPOSIT BUDGET       ║
      ╚═════════════════════════════╝*/

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
        Campaign storage campaign = campaigns[campaignId];

        address currency = campaign.currency;

        if (!fuulManagerInstance().isCurrencyTokenAccepted(currency)) {
            revert TokenCurrencyNotAccepted(currency);
        }

        IFuulManager.TokenType tokenType = campaign.tokenType;

        if (campaign.deactivatedAt > 0) {
            revert CampaignNotActive(campaignId);
        }
        // Commented to optimize contract size

        // require(
        //     tokenType == IFuulManager.TokenType.NATIVE ||
        //         tokenType == IFuulManager.TokenType.ERC_20,
        //     "Currency is not a fungible token"
        // );

        uint256 depositedAmount;

        if (tokenType == IFuulManager.TokenType.NATIVE) {
            if (msg.value == 0) {
                revert IncorrectBalance(msg.value);
            }
            depositedAmount = msg.value;
        } else if (tokenType == IFuulManager.TokenType.ERC_20) {
            if (msg.value > 0) {
                revert IncorrectBalance(msg.value);
            }

            IERC20(currency).safeTransferFrom(
                msg.sender,
                address(this),
                amount
            );
            depositedAmount = amount;
        }

        // Update balance
        campaign.totalDeposited += depositedAmount;
        campaign.currentBudget += depositedAmount;

        emit BudgetDeposited(
            msg.sender,
            depositedAmount,
            currency,
            campaignId,
            tokenType,
            emptyArray,
            emptyArray
        );
    }

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
            revert TokenCurrencyNotAccepted(currency);
        }

        IFuulManager.TokenType tokenType = campaign.tokenType;

        if (campaign.deactivatedAt > 0) {
            revert CampaignNotActive(campaignId);
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
                    msg.sender,
                    address(this),
                    tokenIds[i]
                );
            }

            depositedAmount = tokenIds.length;

            tokenAmounts = emptyArray;
        } else if (tokenType == IFuulManager.TokenType.ERC_1155) {
            _transferERC1155Tokens(
                currency,
                msg.sender,
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
            msg.sender,
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

    function getBudgetCooldownPeriod(
        uint256 deactivatedAt
    ) public view returns (uint256) {
        return deactivatedAt + fuulManagerInstance().campaignBudgetCooldown();
    }

    function removeFungibleBudget(
        uint256 campaignId,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) whenFundsNotFreezed nonReentrant {
        Campaign storage campaign = campaigns[campaignId];

        if (campaign.deactivatedAt == 0) {
            revert CampaignNotInactive(campaignId);
        }

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
            revert CooldownPeriodNotFinished({
                now: block.timestamp,
                required: cooldownPeriod
            });
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

            payable(msg.sender).sendValue(amount);
        } else if (tokenType == IFuulManager.TokenType.ERC_20) {
            // Commented to optimize contract size

            // uint256 balance = IERC20(currency).balanceOf(address(this));
            // if (amount > balance)
            //     revert InsufficientBalance({
            //         available: balance,
            //         required: amount
            //     });
            IERC20(currency).safeTransfer(msg.sender, amount);
        }

        emit BudgetRemoved(
            msg.sender,
            amount,
            currency,
            campaignId,
            tokenType,
            emptyArray,
            emptyArray
        );
    }

    function removeNFTBudget(
        uint256 campaignId,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) external onlyRole(DEFAULT_ADMIN_ROLE) whenFundsNotFreezed nonReentrant {
        Campaign storage campaign = campaigns[campaignId];

        if (campaign.deactivatedAt == 0) {
            revert CampaignNotInactive(campaignId);
        }

        uint256 cooldownPeriod = getBudgetCooldownPeriod(
            campaign.deactivatedAt
        );

        if (block.timestamp < cooldownPeriod) {
            revert CooldownPeriodNotFinished({
                now: block.timestamp,
                required: cooldownPeriod
            });
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
            for (uint256 i = 0; i < tokenIds.length; i++) {
                _transferERC721Tokens(
                    currency,
                    address(this),
                    msg.sender,
                    tokenIds[i]
                );
            }

            removeAmount = tokenIds.length;
        } else if (tokenType == IFuulManager.TokenType.ERC_1155) {
            _transferERC1155Tokens(
                currency,
                address(this),
                msg.sender,
                tokenIds,
                amounts
            );

            removeAmount = _getSumFromArray(amounts);
        }

        // Update campaign budget - By underflow it indirectly checks that amount <= campaign.currentBudget
        campaign.currentBudget -= removeAmount;

        emit BudgetRemoved(
            msg.sender,
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

    function attributeTransactions(
        uint256[] calldata campaignIds,
        address[] calldata receivers,
        uint256[] calldata amounts
    ) external onlyFuulManager nonReentrant {
        if (campaignIds.length != receivers.length) {
            revert IFuulManager.UnequalLengths(
                campaignIds.length,
                receivers.length
            );
        }

        if (campaignIds.length != amounts.length) {
            revert IFuulManager.UnequalLengths(
                campaignIds.length,
                amounts.length
            );
        }

        for (uint256 i = 0; i < campaignIds.length; i++) {
            uint256 campaignId = campaignIds[i];
            uint256 amount = amounts[i];

            campaigns[campaignId].currentBudget -= amount;

            UserEarnings storage user = usersEarnings[receivers[i]][campaignId];

            user.totalEarnings += amount;
            user.availableToClaim += amount;
        }

        // emit ATTRIBUTION(asdas, proff)
    }

    function claimFromCampaign(
        uint256 campaignId,
        address receiver,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    )
        external
        onlyFuulManager
        nonReentrant
        returns (uint256 claimAmount, address claimCurrency)
    {
        UserEarnings storage user = usersEarnings[receiver][campaignId];

        Campaign storage campaign = campaigns[campaignId];

        uint256 availableAmount = user.availableToClaim;

        if (availableAmount == 0) {
            revert IncorrectBalance(availableAmount);
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

    function emergencyWithdrawFungibleTokens(
        address to,
        address currency
    ) external onlyFuulManager {
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

    function emergencyWithdrawNFTTokens(
        address to,
        address currency,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) external onlyFuulManager {
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

    function _transferERC721Tokens(
        address tokenAddress,
        address senderAddress,
        address receiverAddress,
        uint256 tokenId
    ) internal {
        if (tokenAddress == address(0)) {
            revert ZeroAddress();
        }

        // Transfer from does not allow to send more funds than balance
        IERC721(tokenAddress).safeTransferFrom(
            senderAddress,
            receiverAddress,
            tokenId
        );
    }

    function _transferERC1155Tokens(
        address tokenAddress,
        address senderAddress,
        address receiverAddress,
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) internal {
        if (tokenAddress == address(0)) {
            revert ZeroAddress();
        }
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
