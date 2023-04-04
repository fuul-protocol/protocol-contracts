// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
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
    ERC721URIStorage,
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

    struct CampaignBalance {
        uint256 totalDeposited;
        uint256 currentBudget;
        address currency;
        uint256 deactivatedAt;
    }

    /*╔═════════════════════════════╗
      ║          VARIABLES          ║
      ╚═════════════════════════════╝*/

    Counters.Counter private _campaignTokenIdTracker;

    address public fuulFactory;
    address public projectEventSigner;

    mapping(uint256 => CampaignBalance) public campaignBalances; //  campaignTokenId => Campaign balance
    mapping(address => mapping(address => uint256)) public amountClaimed; // Address => currency => amount claimed

    uint256[] private emptyArray;

    /*╔═════════════════════════════╗
      ║         CONSTRUCTOR         ║
      ╚═════════════════════════════╝*/

    constructor() ERC721("FuulV1Project", "FP") {
        fuulFactory = address(0);
    }

    // called once by the factory at time of deployment
    function initialize(address _projectEventSigner) external {
        require(fuulFactory == address(0), "FuulV1: FORBIDDEN"); // sufficient check
        fuulFactory = msg.sender;
        projectEventSigner = _projectEventSigner;

        _setupRole(DEFAULT_ADMIN_ROLE, tx.origin);
    }

    /*╔═════════════════════════════╗
      ║     FROM OTHER CONTRACTS    ║
      ╚═════════════════════════════╝*/

    modifier whenFundsNotFreezed() {
        require(!fuulManagerInstance().isPaused(), "Manager paused all");
        _;
    }

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
        return _campaignTokenIdTracker.current();
    }

    function createCampaign(
        string memory _tokenURI,
        address currency
    ) external nonReentrant onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            fuulManagerInstance().isCurrencyTokenAccepted(currency),
            "Token address is not accepted as currency"
        );
        // Mint NFT
        uint256 campaignTokenId = campaignsCreated() + 1;
        _mint(address(this), campaignTokenId);
        _setTokenURI(campaignTokenId, _tokenURI);
        _campaignTokenIdTracker.increment();

        // Create campaign object
        campaignBalances[campaignTokenId] = CampaignBalance({
            totalDeposited: 0,
            currentBudget: 0,
            currency: currency,
            deactivatedAt: 0
        });

        emit CampaignCreated(
            msg.sender,
            currency,
            campaignTokenId,
            fuulManagerInstance().getTokenType(currency)
        );
    }

    function reactivateCampaign(
        uint256 campaignTokenId
    ) external nonReentrant onlyRole(DEFAULT_ADMIN_ROLE) {
        CampaignBalance storage campaign = campaignBalances[campaignTokenId];

        require(campaign.deactivatedAt > 0, "Campaign is active");

        campaign.deactivatedAt = 0;
    }

    function deactivateCampaign(
        uint256 campaignTokenId
    ) external nonReentrant onlyRole(DEFAULT_ADMIN_ROLE) {
        CampaignBalance storage campaign = campaignBalances[campaignTokenId];

        require(campaign.deactivatedAt == 0, "Campaign is not active");

        campaign.deactivatedAt = block.timestamp;
    }

    function tokenURI(
        uint256 campaignTokenId
    ) public view override(ERC721URIStorage) returns (string memory) {
        return super.tokenURI(campaignTokenId);
    }

    function setTokenURI(
        uint256 _campaignTokenId,
        string memory _tokenURI
    ) external nonReentrant onlyRole(DEFAULT_ADMIN_ROLE) {
        _setTokenURI(_campaignTokenId, _tokenURI);
    }

    /*╔═════════════════════════════╗
      ║        DEPOSIT BUDGET       ║
      ╚═════════════════════════════╝*/

    function depositFungibleToken(
        uint256 campaignTokenId,
        uint256 amount
    )
        external
        payable
        nonReentrant
        whenFundsNotFreezed
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        CampaignBalance storage campaign = campaignBalances[campaignTokenId];

        address currency = campaign.currency;

        IFuulManager.TokenType tokenType = fuulManagerInstance().getTokenType(
            currency
        );

        require(campaign.deactivatedAt == 0, "Campaign is not active");
        // require(
        //     tokenType == IFuulManager.TokenType.NATIVE ||
        //         tokenType == IFuulManager.TokenType.ERC_20,
        //     "Currency is not a fungible token"
        // );

        uint256 depositedAmount;

        if (tokenType == IFuulManager.TokenType.NATIVE) {
            require(msg.value > 0, "msg.value should be greater than 0");
            depositedAmount = msg.value;
        } else if (tokenType == IFuulManager.TokenType.ERC_20) {
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
            campaignTokenId,
            tokenType,
            emptyArray,
            emptyArray
        );
    }

    function depositNFTToken(
        uint256 campaignTokenId,
        uint256[] memory rewardTokenIds,
        uint256[] memory amounts
    ) external nonReentrant whenFundsNotFreezed onlyRole(DEFAULT_ADMIN_ROLE) {
        CampaignBalance storage campaign = campaignBalances[campaignTokenId];
        address currency = campaign.currency;

        IFuulManager.TokenType tokenType = fuulManagerInstance().getTokenType(
            currency
        );

        require(campaign.deactivatedAt == 0, "Campaign is not active");

        // require(
        //     tokenType == IFuulManager.TokenType.ERC_721 ||
        //         tokenType == IFuulManager.TokenType.ERC_1155,
        //     "Currency is not an NFT token"
        // );

        uint256 depositedAmount;
        uint256[] memory tokenAmounts;

        if (tokenType == IFuulManager.TokenType.ERC_721) {
            for (uint256 i = 0; i < rewardTokenIds.length; i++) {
                _transferERC721Tokens(
                    currency,
                    msg.sender,
                    address(this),
                    rewardTokenIds[i]
                );
            }

            depositedAmount = rewardTokenIds.length;

            tokenAmounts = emptyArray;
        } else if (tokenType == IFuulManager.TokenType.ERC_1155) {
            _transferERC1155Tokens(
                currency,
                msg.sender,
                address(this),
                rewardTokenIds,
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
            campaignTokenId,
            tokenType,
            rewardTokenIds,
            tokenAmounts
        );
    }

    /*╔═════════════════════════════╗
      ║        REMOVE BUDGET        ║
      ╚═════════════════════════════╝*/

    function getBudgetCooldownPeriod(
        uint256 deactivatedAt
    ) public view returns (uint256) {
        require(
            deactivatedAt > 0,
            "Campaign is active. Please deactivate it first"
        );
        return deactivatedAt + fuulManagerInstance().campaignBudgetCooldown();
    }

    function removeFungibleBudget(
        uint256 campaignTokenId,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) whenFundsNotFreezed nonReentrant {
        CampaignBalance storage campaign = campaignBalances[campaignTokenId];

        address currency = campaign.currency;

        IFuulManager.TokenType tokenType = fuulManagerInstance().getTokenType(
            currency
        );

        // require(
        //     tokenType == IFuulManager.TokenType.NATIVE ||
        //         tokenType == IFuulManager.TokenType.ERC_20,
        //     "Currency is not a fungible token"
        // );

        require(
            block.timestamp > getBudgetCooldownPeriod(campaign.deactivatedAt),
            "Cooldown period not finished"
        );

        // Update campaign budget - By underflow it indirectly checks that amount <= campaign.currentBudget
        campaign.currentBudget -= amount;

        if (tokenType == IFuulManager.TokenType.NATIVE) {
            uint256 balance = address(this).balance;
            require(amount <= balance, "Amount exceeds balance");

            payable(msg.sender).sendValue(amount);
        } else if (tokenType == IFuulManager.TokenType.ERC_20) {
            uint256 balance = IERC20(currency).balanceOf(address(this));
            require(amount <= balance, "Amount exceeds balance");
            IERC20(currency).safeTransfer(msg.sender, amount);
        }

        emit BudgetRemoved(
            msg.sender,
            amount,
            currency,
            campaignTokenId,
            tokenType,
            emptyArray,
            emptyArray
        );
    }

    function removeNFTBudget(
        uint256 campaignTokenId,
        uint256[] memory rewardTokenIds,
        uint256[] memory amounts
    ) external onlyRole(DEFAULT_ADMIN_ROLE) whenFundsNotFreezed nonReentrant {
        CampaignBalance storage campaign = campaignBalances[campaignTokenId];

        require(
            block.timestamp > getBudgetCooldownPeriod(campaign.deactivatedAt),
            "Cooldown period not finished"
        );

        address currency = campaign.currency;

        IFuulManager.TokenType tokenType = fuulManagerInstance().getTokenType(
            currency
        );

        // require(
        //     tokenType == IFuulManager.TokenType.ERC_721 ||
        //         tokenType == IFuulManager.TokenType.ERC_1155,
        //     "Currency is not an NFT token"
        // );

        uint256 removeAmount;

        if (tokenType == IFuulManager.TokenType.ERC_721) {
            for (uint256 i = 0; i < rewardTokenIds.length; i++) {
                _transferERC721Tokens(
                    currency,
                    address(this),
                    msg.sender,
                    rewardTokenIds[i]
                );
            }

            removeAmount = rewardTokenIds.length;
        } else if (tokenType == IFuulManager.TokenType.ERC_1155) {
            _transferERC1155Tokens(
                currency,
                address(this),
                msg.sender,
                rewardTokenIds,
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
            campaignTokenId,
            tokenType,
            rewardTokenIds,
            amounts
        );
    }

    function claimFromCampaign(
        IFuulManager.ClaimVoucher calldata voucher
    ) external returns (uint256 amount) {
        require(
            msg.sender == fuulManagerAddress(),
            "Only Fuul manager can claim"
        );

        CampaignBalance storage campaign = campaignBalances[
            voucher.campaignTokenId
        ];

        uint256 voucherAmount = voucher.amount;
        address currency = campaign.currency;

        uint256 tokenAmount;

        if (voucher.tokenType == IFuulManager.TokenType.NATIVE) {
            tokenAmount = voucherAmount;

            require(address(this).balance > 0, "Contract has no balance");
            payable(voucher.account).sendValue(voucherAmount);
        } else if (voucher.tokenType == IFuulManager.TokenType.ERC_20) {
            tokenAmount = voucherAmount;

            require(
                IERC20(currency).balanceOf(address(this)) > 0,
                "Contract has no balance"
            );
            IERC20(currency).safeTransfer(voucher.account, voucherAmount);
        } else if (voucher.tokenType == IFuulManager.TokenType.ERC_721) {
            tokenAmount = voucher.rewardTokenIds.length;

            for (uint256 i = 0; i < voucher.rewardTokenIds.length; i++) {
                _transferERC721Tokens(
                    currency,
                    address(this),
                    voucher.account,
                    voucher.rewardTokenIds[i]
                );
            }
        } else if (voucher.tokenType == IFuulManager.TokenType.ERC_1155) {
            tokenAmount = _getSumFromArray(voucher.amounts);

            _transferERC1155Tokens(
                currency,
                address(this),
                voucher.account,
                voucher.rewardTokenIds,
                voucher.amounts
            );
        }

        // Update campaign budget

        campaign.currentBudget -= tokenAmount;

        emit Claimed(
            voucher.voucherId,
            voucher.campaignTokenId,
            voucher.account,
            currency,
            tokenAmount,
            voucher.rewardTokenIds,
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
    ) external {
        require(
            msg.sender == fuulManagerAddress(),
            "Only Fuul manager can withdraw"
        );

        if (currency == address(0)) {
            uint256 balance = address(this).balance;
            require(balance > 0, "Contract has no balance");

            payable(msg.sender).sendValue(balance);
        } else {
            uint256 balance = IERC20(currency).balanceOf(address(this));

            require(balance > 0, "Contract has no balance");

            IERC20(currency).safeTransfer(to, balance);
        }
    }

    function emergencyWithdrawNFTTokens(
        address to,
        address currency,
        uint256[] memory rewardTokenIds,
        uint256[] memory amounts
    ) external {
        require(
            msg.sender == fuulManagerAddress(),
            "Only Fuul manager can withdraw"
        );
        IFuulManager.TokenType tokenType = fuulManagerInstance().getTokenType(
            currency
        );

        if (tokenType == IFuulManager.TokenType.ERC_721) {
            for (uint256 i = 0; i < rewardTokenIds.length; i++) {
                _transferERC721Tokens(
                    currency,
                    address(this),
                    to,
                    rewardTokenIds[i]
                );
            }
        } else if (tokenType == IFuulManager.TokenType.ERC_1155) {
            _transferERC1155Tokens(
                currency,
                address(this),
                to,
                rewardTokenIds,
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
        require(tokenAddress != address(0), "No zero address");

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
        require(tokenAddress != address(0), "No zero address");

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
        require(
            _projectEventSigner != projectEventSigner,
            "Address cannot be the same as current"
        );
        projectEventSigner = _projectEventSigner;
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

    function _burn(
        uint256 campaignTokenId
    ) internal override(ERC721URIStorage) {
        super._burn(campaignTokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override(ERC721) {
        require(
            to == address(0) || from == address(0),
            "Err: token can only be burned or minted"
        );
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(AccessControlEnumerable, ERC721, ERC1155Receiver)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
