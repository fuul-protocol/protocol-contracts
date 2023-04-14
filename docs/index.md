# Solidity API

## FuulFactory

### fuulProjectImplementation

```solidity
address fuulProjectImplementation
```

### fuulManager

```solidity
address fuulManager
```

### projects

```solidity
mapping(uint256 => address) projects
```

### constructor

```solidity
constructor(address _fuulManager) public
```

\_Sets the values for {fuulManager} and {fuulProjectImplementation}.
It grants the DEFAULT_ADMIN_ROLE to the deployer.

`fuulProjectImplementation` value is immutable: it can only be set once during
construction.\_

### createFuulProject

```solidity
function createFuulProject(address _projectAdmin, address _projectEventSigner, string _projectInfoURI) external
```

\_Creates a new Project. It deploys a new clone of the implementation
and initializes it.
The `projectId` follows the number of projects created.

Emits {ProjectCreated}.

Requirements:

- `_projectAdmin` and `_projectEventSigner` must not be the zero address.
- `_projectInfoURI` must not be an empty string.\_

### projectsCreated

```solidity
function projectsCreated() public view returns (uint256)
```

_Returns the number of projects created._

### setFuulManager

```solidity
function setFuulManager(address _fuulManager) external
```

\_Sets `fuulManager` for all {FuulProject}s to read from.

Requirements:

- `_fuulManager` must not be the address zero.
- `_fuulManager` must be different from the current one.
- Only admins can call this function.\_

## FuulProject

### Campaign

```solidity
struct Campaign {
  uint256 totalDeposited;
  uint256 currentBudget;
  address currency;
  uint256 deactivatedAt;
  string campaignURI;
  enum IFuulManager.TokenType tokenType;
}
```

### UserEarnings

```solidity
struct UserEarnings {
  uint256 totalEarnings;
  uint256 availableToClaim;
}
```

### fuulFactory

```solidity
address fuulFactory
```

### EVENTS_SIGNER_ROLE

```solidity
bytes32 EVENTS_SIGNER_ROLE
```

### campaigns

```solidity
mapping(uint256 => struct FuulProject.Campaign) campaigns
```

### usersEarnings

```solidity
mapping(address => mapping(uint256 => struct FuulProject.UserEarnings)) usersEarnings
```

### projectInfoURI

```solidity
string projectInfoURI
```

### campaignExists

```solidity
modifier campaignExists(uint256 _campaignId)
```

_Modifier that checks that a campaign exists. Reverts
with a CampaignNotExists error including the inputed campaign id._

### onlyFuulManager

```solidity
modifier onlyFuulManager()
```

_Modifier that the sender is the fuul manager. Reverts
with an Unauthorized error including the sender and the required sender._

### whenFundsNotFreezed

```solidity
modifier whenFundsNotFreezed()
```

_Modifier that the Fuul Manager contract is not paused. Reverts
with a ManagerIsPaused error._

### constructor

```solidity
constructor() public
```

\_Sets the value for {fuulFactory}.

This value is immutable: it can only be set once during
construction.\_

### initialize

```solidity
function initialize(address projectAdmin, address _projectEventSigner, string _projectInfoURI) external
```

\_Initializes the contract when the Factory deploys a new clone}.

Grants roles for project admin, the address allowed to send events
through the SDK and the URI with the project information\_

### fuulManagerAddress

```solidity
function fuulManagerAddress() public view returns (address)
```

_Returns the address of the active Fuul Manager contract._

### fuulManagerInstance

```solidity
function fuulManagerInstance() public view returns (contract IFuulManager)
```

_Returns the instance of the Fuul Manager contract._

### setProjectInfoURI

```solidity
function setProjectInfoURI(string _projectURI) external
```

\_Sets `projectInfoURI` as the information for the project.

Emits {ProjectInfoUpdated}.

Requirements:

- `_projectURI` must not be an empty string.
- Only admins can deactivate campaigns.\_

### campaignsCreated

```solidity
function campaignsCreated() public view returns (uint256)
```

_Returns the number of campaigns created._

### createCampaign

```solidity
function createCampaign(string _campaignURI, address currency) external
```

\_Creates a new `Campaign` object.
The `campaignId` follows the number of campaigns created.

Emits {CampaignCreated}.

Requirements:

- `_campaignURI` must not be an empty string.
- `currency` must be accepted in the Fuul Manager contract.
- Only admins can create campaigns.\_

### reactivateCampaign

```solidity
function reactivateCampaign(uint256 campaignId) external
```

\_Reactivates campaign. Sets the active value to be true

Requirements:

- `campaignId` must exist and be inactive.
- Only admins can reactivate campaigns.\_

### deactivateCampaign

```solidity
function deactivateCampaign(uint256 campaignId) external
```

\_Deactivates campaign. Sets the active value to be false

Requirements:

- `campaignId` must exist and be active.
- Only admins can deactivate campaigns.\_

### setCampaignURI

```solidity
function setCampaignURI(uint256 _campaignId, string _campaignURI) external
```

\_Sets `campaignURI` in the Campaign structure.

Emits {CampaignMetadataUpdated}.

Requirements:

- `campaignId` must exist.
- `_campaignURI` must not be an empty string.
- Only admins can deactivate campaigns.\_

### depositFungibleToken

```solidity
function depositFungibleToken(uint256 campaignId, uint256 amount) external payable
```

\_Deposits fungible tokens in a campaign.
They can be native or ERC20 tokens.

Emits {BudgetDeposited}.

Requirements:

- `campaignId` must exist and be active.
- `amount` must be greater than zero.
- Only admins can deposit.
- Funds must not be freezed.\_

### depositNFTToken

```solidity
function depositNFTToken(uint256 campaignId, uint256[] tokenIds, uint256[] amounts) external
```

\_Deposits NFTs in a campaign.
They can be ERC1155 or ERC721 tokens.
`amounts` parameter is only used when dealing with ERC1155 tokens.

Emits {BudgetDeposited}.

Requirements:

- `campaignId` must exist and be active.
- Only admins can deposit.
- Funds must not be freezed.\_

### getBudgetCooldownPeriod

```solidity
function getBudgetCooldownPeriod(uint256 deactivatedAt) public view returns (uint256)
```

_Returns the timestamp when funds can be removed from a campaign.
This period starts when the campaign is deactivated and ends after the
`campaignBudgetCooldown` is passed._

### removeFungibleBudget

```solidity
function removeFungibleBudget(uint256 campaignId, uint256 amount) external
```

\_Removes fungible tokens from a campaign.
They can be native or ERC20 tokens.

Emits {BudgetRemoved}.

Requirements:

- `campaignId` must exist and be active.
- `amount` must be greater than zero.
- Only admins can remove.
- Funds must not be freezed.
- Budget remove cooldown period has to be completed.\_

### removeNFTBudget

```solidity
function removeNFTBudget(uint256 campaignId, uint256[] tokenIds, uint256[] amounts) external
```

\_Removes NFT tokens from a campaign.
They can be ERC1155 or ERC721 tokens.
`amounts` parameter is only used when dealing with ERC1155 tokens.

Emits {BudgetRemoved}.

Requirements:

- `campaignId` must exist and be active.
- `amount` must be greater than zero.
- Only admins can remove.
- Funds must not be freezed.
- Budget remove cooldown period has to be completed.\_

### attributeTransactions

```solidity
function attributeTransactions(uint256[] campaignIds, address[] receivers, uint256[] amounts) external
```

\_Attributes: removes `amounts` from `campaignIds` balance and adds them to `receivers`.

Requirements:

- All arrays must have the same length.
- All elements of `campaignIds` must exist and have the corresponding balance.
- All elements of `amounts` must be greater than zero.
- Only Fuul Manager can attribute.\_

### claimFromCampaign

```solidity
function claimFromCampaign(uint256 campaignId, address receiver, uint256[] tokenIds, uint256[] amounts) external returns (uint256 claimAmount, address claimCurrency)
```

\_Claims: sends funds to `receiver` that has available to claim funds.

`tokenIds` parameter is only used when dealing with ERC1155 and ERC721 tokens.
`amounts` parameter is only used when dealing with ERC1155 tokens.

Requirements:

- `receiver` must have available funds to claim in `campaignId`.
- Only Fuul Manager can call this function.
- Funds must not be freezed.\_

### emergencyWithdrawFungibleTokens

```solidity
function emergencyWithdrawFungibleTokens(address to, address currency) external
```

\_Withdraws all fungible tokens from contract to a receiver `to`.
They can be native or ERC20 tokens.

Requirements:

- `to` must not be the zero address.
- Only Fuul Manager can call this function.\_

### emergencyWithdrawNFTTokens

```solidity
function emergencyWithdrawNFTTokens(address to, address currency, uint256[] tokenIds, uint256[] amounts) external
```

\_Withdraws all NFTs from contract to a receiver `to`.
They can be ERC1155 or ERC721 tokens.

Requirements:

- `to` must not be the zero address.
- Only Fuul Manager can call this function.\_

### \_transferERC721Tokens

```solidity
function _transferERC721Tokens(address tokenAddress, address senderAddress, address receiverAddress, uint256 tokenId) internal
```

_Helper function to transfer ERC721 tokens._

### \_transferERC1155Tokens

```solidity
function _transferERC1155Tokens(address tokenAddress, address senderAddress, address receiverAddress, uint256[] tokenIds, uint256[] amounts) internal
```

_Helper function to transfer ERC1155 tokens._

### \_getSumFromArray

```solidity
function _getSumFromArray(uint256[] amounts) internal pure returns (uint256 result)
```

_Helper function to sum all amounts inside the array._

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

## IFuulFactory

### ProjectCreated

```solidity
event ProjectCreated(uint256 projectId, address deployedAddress, address eventSigner, string projectInfoURI)
```

### createFuulProject

```solidity
function createFuulProject(address _projectAdmin, address _projectEventSigner, string _projectInfoURI) external
```

### projects

```solidity
function projects(uint256 projectId) external returns (address)
```

### projectsCreated

```solidity
function projectsCreated() external view returns (uint256)
```

### fuulManager

```solidity
function fuulManager() external view returns (address)
```

### setFuulManager

```solidity
function setFuulManager(address _fuulManager) external
```

## IFuulManager

### TokenType

```solidity
enum TokenType {
  NATIVE,
  ERC_20,
  ERC_721,
  ERC_1155
}
```

### ClaimCheck

```solidity
struct ClaimCheck {
  address projectAddress;
  uint256 campaignId;
  uint256[] tokenIds;
  uint256[] amounts;
}
```

### AttributeCheck

```solidity
struct AttributeCheck {
  address projectAddress;
  uint256[] campaignIds;
  address[] receivers;
  uint256[] amounts;
}
```

### FuulProjectFungibleCurrencies

```solidity
struct FuulProjectFungibleCurrencies {
  address deployedAddress;
  address[] currencies;
}
```

### InvalidArgument

```solidity
error InvalidArgument()
```

### TokenCurrencyAlreadyAccepted

```solidity
error TokenCurrencyAlreadyAccepted()
```

### TokenCurrencyNotAccepted

```solidity
error TokenCurrencyNotAccepted()
```

### InvalidSignature

```solidity
error InvalidSignature()
```

### Unauthorized

```solidity
error Unauthorized()
```

### OverTheLimit

```solidity
error OverTheLimit()
```

### campaignBudgetCooldown

```solidity
function campaignBudgetCooldown() external view returns (uint256 period)
```

### claimCooldown

```solidity
function claimCooldown() external view returns (uint256 period)
```

### usersClaims

```solidity
function usersClaims(address user, address currency) external view returns (uint256)
```

### setClaimCooldown

```solidity
function setClaimCooldown(uint256 _period) external
```

### setCampaignBudgetCooldown

```solidity
function setCampaignBudgetCooldown(uint256 period) external
```

### currencyTokens

```solidity
function currencyTokens(address currencyToken) external view returns (enum IFuulManager.TokenType, uint256, uint256, uint256, bool)
```

### getTokenType

```solidity
function getTokenType(address currencyToken) external view returns (enum IFuulManager.TokenType tokenType)
```

### isCurrencyTokenAccepted

```solidity
function isCurrencyTokenAccepted(address currencyToken) external view returns (bool isAccepted)
```

### addCurrencyToken

```solidity
function addCurrencyToken(address tokenAddress, uint256 claimLimitPerCooldown) external
```

### removeCurrencyToken

```solidity
function removeCurrencyToken(address tokenAddress) external
```

### setCurrencyTokenLimit

```solidity
function setCurrencyTokenLimit(address tokenAddress, uint256 limit) external
```

### pauseAll

```solidity
function pauseAll() external
```

### unpauseAll

```solidity
function unpauseAll() external
```

### isPaused

```solidity
function isPaused() external view returns (bool)
```

### attributeTransactions

```solidity
function attributeTransactions(struct IFuulManager.AttributeCheck[] attributeChecks) external
```

### claim

```solidity
function claim(struct IFuulManager.ClaimCheck[] claimChecks) external
```

### emergencyWithdrawFungibleTokensFromProjects

```solidity
function emergencyWithdrawFungibleTokensFromProjects(address to, struct IFuulManager.FuulProjectFungibleCurrencies[] projectsCurrencies) external
```

### emergencyWithdrawNFTsFromProject

```solidity
function emergencyWithdrawNFTsFromProject(address to, address fuulProject, address currency, uint256[] tokenIds, uint256[] amounts) external
```

## IFuulProject

### CampaignMetadataUpdated

```solidity
event CampaignMetadataUpdated(uint256 campaignId, string campaignURI)
```

### ProjectInfoUpdated

```solidity
event ProjectInfoUpdated(string projectInfoURI)
```

### CampaignCreated

```solidity
event CampaignCreated(address account, address currency, uint256 campaignTokenId, enum IFuulManager.TokenType tokenType, string _campaignURI)
```

### BudgetDeposited

```solidity
event BudgetDeposited(address account, uint256 amount, address currency, uint256 campaignTokenId, enum IFuulManager.TokenType tokenType, uint256[] tokenIds, uint256[] amounts)
```

### BudgetRemoved

```solidity
event BudgetRemoved(address account, uint256 amount, address currency, uint256 campaignTokenId, enum IFuulManager.TokenType tokenType, uint256[] tokenIds, uint256[] amounts)
```

### Claimed

```solidity
event Claimed(uint256 campaignTokenId, address account, address currency, uint256 amount, uint256[] rewardTokenIds, uint256[] amounts)
```

### ManagerIsPaused

```solidity
error ManagerIsPaused()
```

### ManagerIsNotPaused

```solidity
error ManagerIsNotPaused()
```

### CampaignNotExists

```solidity
error CampaignNotExists()
```

### EmptyURI

```solidity
error EmptyURI()
```

### CampaignNotInactive

```solidity
error CampaignNotInactive()
```

### CampaignNotActive

```solidity
error CampaignNotActive()
```

### IncorrectMsgValue

```solidity
error IncorrectMsgValue()
```

### CooldownPeriodNotFinished

```solidity
error CooldownPeriodNotFinished()
```

### ZeroAddress

```solidity
error ZeroAddress()
```

### ZeroAmount

```solidity
error ZeroAmount()
```

### fuulFactory

```solidity
function fuulFactory() external view returns (address)
```

### campaigns

```solidity
function campaigns(uint256 tokenId) external view returns (uint256, uint256, address, uint256, string, enum IFuulManager.TokenType)
```

### usersEarnings

```solidity
function usersEarnings(address account, uint256 campaignId) external view returns (uint256, uint256)
```

### fuulManagerAddress

```solidity
function fuulManagerAddress() external view returns (address)
```

### fuulManagerInstance

```solidity
function fuulManagerInstance() external view returns (contract IFuulManager)
```

### projectInfoURI

```solidity
function projectInfoURI() external view returns (string)
```

### setProjectInfoURI

```solidity
function setProjectInfoURI(string _projectURI) external
```

### campaignsCreated

```solidity
function campaignsCreated() external view returns (uint256)
```

### createCampaign

```solidity
function createCampaign(string _tokenURI, address currency) external
```

### reactivateCampaign

```solidity
function reactivateCampaign(uint256 tokenId) external
```

### deactivateCampaign

```solidity
function deactivateCampaign(uint256 tokenId) external
```

### setCampaignURI

```solidity
function setCampaignURI(uint256 _tokenId, string _tokenURI) external
```

### depositFungibleToken

```solidity
function depositFungibleToken(uint256 campaignTokenId, uint256 amount) external payable
```

### depositNFTToken

```solidity
function depositNFTToken(uint256 campaignTokenId, uint256[] rewardTokenIds, uint256[] amounts) external
```

### getBudgetCooldownPeriod

```solidity
function getBudgetCooldownPeriod(uint256 deactivatedAt) external view returns (uint256)
```

### removeFungibleBudget

```solidity
function removeFungibleBudget(uint256 campaignTokenId, uint256 amount) external
```

### removeNFTBudget

```solidity
function removeNFTBudget(uint256 campaignTokenId, uint256[] rewardTokenIds, uint256[] amounts) external
```

### attributeTransactions

```solidity
function attributeTransactions(uint256[] campaignIds, address[] receivers, uint256[] amounts) external
```

### claimFromCampaign

```solidity
function claimFromCampaign(uint256 campaignId, address receiver, uint256[] tokenIds, uint256[] amounts) external returns (uint256, address)
```

### emergencyWithdrawFungibleTokens

```solidity
function emergencyWithdrawFungibleTokens(address to, address currency) external
```

### emergencyWithdrawNFTTokens

```solidity
function emergencyWithdrawNFTTokens(address to, address currency, uint256[] rewardTokenIds, uint256[] amounts) external
```

## FuulManager

### ATTRIBUTOR_ROLE

```solidity
bytes32 ATTRIBUTOR_ROLE
```

### PAUSER_ROLE

```solidity
bytes32 PAUSER_ROLE
```

### CurrencyToken

```solidity
struct CurrencyToken {
  enum IFuulManager.TokenType tokenType;
  uint256 claimLimitPerCooldown;
  uint256 cumulativeClaimPerCooldown;
  uint256 claimCooldownPeriodStarted;
  bool isActive;
}
```

### currencyTokens

```solidity
mapping(address => struct FuulManager.CurrencyToken) currencyTokens
```

### campaignBudgetCooldown

```solidity
uint256 campaignBudgetCooldown
```

### claimCooldown

```solidity
uint256 claimCooldown
```

### usersClaims

```solidity
mapping(address => mapping(address => uint256)) usersClaims
```

### IID_IERC1155

```solidity
bytes4 IID_IERC1155
```

### IID_IERC721

```solidity
bytes4 IID_IERC721
```

### constructor

```solidity
constructor(address _attributor, address _pauser, address acceptedERC20CurrencyToken, uint256 initialTokenLimit, uint256 initialNativeTokenLimit) public
```

\_Grants roles to `_attributor`, `_pauser` and DEFAULT_ADMIN_ROLE to the deployer.

Adds the initial `acceptedERC20CurrencyToken` as an accepted currency with its `initialTokenLimit`.
Adds the zero address (native token) as an accepted currency with its `initialNativeTokenLimit`.\_

### setClaimCooldown

```solidity
function setClaimCooldown(uint256 _period) external
```

\_Sets the period for `claimCooldown`.

Requirements:

- `_period` must be different from the current one.
- Only admins can call this function.\_

### setCampaignBudgetCooldown

```solidity
function setCampaignBudgetCooldown(uint256 _period) external
```

\_Sets the period for `campaignBudgetCooldown`.

Requirements:

- `_period` must be different from the current one.
- Only admins can call this function.\_

### getTokenType

```solidity
function getTokenType(address tokenAddress) public view returns (enum IFuulManager.TokenType tokenType)
```

_Returns TokenType enum from a tokenAddress._

### isCurrencyTokenAccepted

```solidity
function isCurrencyTokenAccepted(address tokenAddress) public view returns (bool isAccepted)
```

_Returns whether the currency token is accepted._

### addCurrencyToken

```solidity
function addCurrencyToken(address tokenAddress, uint256 claimLimitPerCooldown) external
```

\_Adds a currency token.
See {\_addCurrencyToken}

Requirements:

- Only admins can call this function.\_

### removeCurrencyToken

```solidity
function removeCurrencyToken(address tokenAddress) external
```

\_Removes a currency token.

Requirements:

- `tokenAddress` must be accepted.
- Only admins can call this function.\_

### setCurrencyTokenLimit

```solidity
function setCurrencyTokenLimit(address tokenAddress, uint256 limit) external
```

\_Sets a new `claimLimitPerCooldown` for a currency token.

Notes:
We are not checking that the tokenAddress is accepted because
users can claim from unaccepted currencies.

Requirements:

- `limit` must be greater than zero.
- `limit` must be different from the current one.
- Only admins can call this function.\_

### pauseAll

```solidity
function pauseAll() external
```

\_Pauses the contract and all {FuulProject}s.
See {Pausable.sol}

Requirements:

- Only addresses with the PAUSER*ROLE can call this function.*

### unpauseAll

```solidity
function unpauseAll() external
```

\_Unpauses the contract and all {FuulProject}s.
See {Pausable.sol}

Requirements:

- Only addresses with the PAUSER*ROLE can call this function.*

### isPaused

```solidity
function isPaused() external view returns (bool)
```

_Returns whether the contract is paused.
See {Pausable.sol}_

### attributeTransactions

```solidity
function attributeTransactions(struct IFuulManager.AttributeCheck[] attributeChecks) external
```

\_Attributes: calls the `attributeTransactions` function in {FuulProject} from a loop of `AttributeCheck`.

Requirements:

- Contract should not be paused.
- Only addresses with the ATTRIBUTOR*ROLE can call this function.*

### claim

```solidity
function claim(struct IFuulManager.ClaimCheck[] claimChecks) external
```

\_Claims: calls the `claimFromCampaign` function in {FuulProject} from a loop of `ClaimChecks`.

Requirements:

- Contract should not be paused.\_

### emergencyWithdrawFungibleTokensFromProjects

```solidity
function emergencyWithdrawFungibleTokensFromProjects(address to, struct IFuulManager.FuulProjectFungibleCurrencies[] projectsCurrencies) external
```

\_Calls the `emergencyWithdrawFungibleTokens` function in {FuulProject}
from a loop of `FuulProjectFungibleCurrencies`.

Requirements:

- Only admins can call this function.\_

### emergencyWithdrawNFTsFromProject

```solidity
function emergencyWithdrawNFTsFromProject(address to, address projectAddress, address currency, uint256[] tokenIds, uint256[] amounts) external
```

\_Calls the `emergencyWithdrawNFTTokens` function in {FuulProject}.

Requirements:

- Only admins can call this function.\_

### isERC20

```solidity
function isERC20(address tokenAddress) internal view returns (bool)
```

_Returns whether the address is an ERC20 token._

### isContract

```solidity
function isContract(address _addr) internal view returns (bool)
```

_Returns whether the address is a contract._

### \_addCurrencyToken

```solidity
function _addCurrencyToken(address tokenAddress, uint256 claimLimitPerCooldown) internal
```

\_Adds a new `tokenAddress` to accepted currencies with its
corresponding `claimLimitPerCooldown`.

Requirements:

- `tokenAddress` must be a contract (excepting for the zero address).
- `tokenAddress` must not be accepted yet.
- `claimLimitPerCooldown` should be greater than zero.\_

## MockTokenRewards

### constructor

```solidity
constructor() public
```

### mint

```solidity
function mint() external
```

## MockNFT1155Rewards

### nextTokenId

```solidity
uint256 nextTokenId
```

### constructor

```solidity
constructor() public
```

### mint

```solidity
function mint(uint256 amount) public
```

## MockNFT721Rewards

### nextTokenId

```solidity
uint256 nextTokenId
```

### constructor

```solidity
constructor() public
```

### mint

```solidity
function mint(uint256 amount) public
```

## Tester

### number

```solidity
uint256 number
```

### sumNumber

```solidity
function sumNumber() external
```

### subtractNumber

```solidity
function subtractNumber() external
```

### duplicateNumber

```solidity
function duplicateNumber() external
```

### triplicateNumber

```solidity
function triplicateNumber() external
```
