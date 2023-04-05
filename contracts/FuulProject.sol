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
    }

    /*╔═════════════════════════════╗
      ║          VARIABLES          ║
      ╚═════════════════════════════╝*/

    Counters.Counter private _campaignIdTracker;

    address public fuulFactory;
    address public projectEventSigner;

    mapping(uint256 => Campaign) public campaigns; //  campaignId => Campaign

    uint256[] private emptyArray;

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
        address _projectEventSigner
    ) external {
        require(fuulFactory == address(0), "FuulV1: FORBIDDEN");
        fuulFactory = msg.sender;
        projectEventSigner = _projectEventSigner;

        _setupRole(DEFAULT_ADMIN_ROLE, projectAdmin);
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
            revert EmptyCampaignURI(_campaignURI);
        }

        if (!fuulManagerInstance().isCurrencyTokenAccepted(currency)) {
            revert TokenCurrencyNotAccepted(currency);
        }

        uint256 campaignId = campaignsCreated() + 1;
        _campaignIdTracker.increment();

        // Create campaign object
        campaigns[campaignId] = Campaign({
            totalDeposited: 0,
            currentBudget: 0,
            currency: currency,
            deactivatedAt: 0,
            campaignURI: _campaignURI
        });

        emit CampaignCreated(
            msg.sender,
            currency,
            campaignId,
            fuulManagerInstance().getTokenType(currency),
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

        IFuulManager.TokenType tokenType = fuulManagerInstance().getTokenType(
            currency
        );

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

        IFuulManager.TokenType tokenType = fuulManagerInstance().getTokenType(
            currency
        );

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

        IFuulManager.TokenType tokenType = fuulManagerInstance().getTokenType(
            currency
        );

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

    function claimFromCampaign(
        IFuulManager.ClaimVoucher calldata voucher
    ) external onlyFuulManager returns (uint256 amount) {
        Campaign storage campaign = campaigns[voucher.campaignId];

        uint256 voucherAmount = voucher.amount;
        address currency = campaign.currency;

        uint256 tokenAmount;

        if (voucher.tokenType == IFuulManager.TokenType.NATIVE) {
            tokenAmount = voucherAmount;

            payable(voucher.account).sendValue(voucherAmount);
        } else if (voucher.tokenType == IFuulManager.TokenType.ERC_20) {
            tokenAmount = voucherAmount;

            IERC20(currency).safeTransfer(voucher.account, voucherAmount);
        } else if (voucher.tokenType == IFuulManager.TokenType.ERC_721) {
            tokenAmount = voucher.tokenIds.length;

            for (uint256 i = 0; i < voucher.tokenIds.length; i++) {
                _transferERC721Tokens(
                    currency,
                    address(this),
                    voucher.account,
                    voucher.tokenIds[i]
                );
            }
        } else if (voucher.tokenType == IFuulManager.TokenType.ERC_1155) {
            tokenAmount = _getSumFromArray(voucher.amounts);

            _transferERC1155Tokens(
                currency,
                address(this),
                voucher.account,
                voucher.tokenIds,
                voucher.amounts
            );
        }

        // Update campaign budget

        campaign.currentBudget -= tokenAmount;

        emit Claimed(
            voucher.voucherId,
            voucher.campaignId,
            voucher.account,
            currency,
            tokenAmount,
            voucher.tokenIds,
            voucher.amounts
        );

        return amount;
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

            payable(msg.sender).sendValue(address(this).balance);
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

    function setProjectEventSigner(
        address _projectEventSigner
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        // Commented to optimize contract size

        // if (_projectEventSigner == projectEventSigner) {
        //     revert SameValue(_projectEventSigner);
        // }

        projectEventSigner = _projectEventSigner;
        emit EventSignerUpdated(_projectEventSigner);
    }

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
