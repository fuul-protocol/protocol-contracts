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

### userProjects

```solidity
mapping(address => struct EnumerableSet.AddressSet) userProjects
```

### constructor

```solidity
constructor(address _fuulManager) public
```

_Sets the values for {fuulManager} and {fuulProjectImplementation}.
It grants the DEFAULT_ADMIN_ROLE to the deployer.

`fuulProjectImplementation` value is immutable: it can only be set once during
construction._

### createFuulProject

```solidity
function createFuulProject(address _projectAdmin, address _projectEventSigner, string _projectInfoURI, address _clientFeeCollector) external
```

_Creates a new Project. It deploys a new clone of the implementation
and initializes it.
The `projectId` follows the number of projects created.

Emits {ProjectCreated}.

Requirements:

- `_projectAdmin` and `_projectEventSigner` must not be the zero address.
- `_projectInfoURI` must not be an empty string._

### totalProjectsCreated

```solidity
function totalProjectsCreated() public view returns (uint256)
```

_Returns the number of total projects created._

### getUserProjectByIndex

```solidity
function getUserProjectByIndex(address account, uint256 index) public view returns (address)
```

_Returns the project address for an account by index._

### getUserProjectCount

```solidity
function getUserProjectCount(address account) public view returns (uint256)
```

_Returns the number of projects created by an account._

### setFuulManager

```solidity
function setFuulManager(address _fuulManager) external
```

_Sets `fuulManager` for all {FuulProject}s to read from.

Requirements:

- {_fuulManager} must not be the zero address.
- {_fuulManager} must be different from the current one.
- Only admins can call this function._

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

### projectBudgetCooldown

```solidity
uint256 projectBudgetCooldown
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

### protocolFee

```solidity
uint8 protocolFee
```

### protocolFeeCollector

```solidity
address protocolFeeCollector
```

### clientFee

```solidity
uint8 clientFee
```

### attributorFee

```solidity
uint8 attributorFee
```

### nftFixedFeeAmount

```solidity
uint256 nftFixedFeeAmount
```

### nftFeeCurrency

```solidity
address nftFeeCurrency
```

### constructor

```solidity
constructor(address _attributor, address _pauser, address acceptedERC20CurrencyToken, uint256 initialTokenLimit, uint256 initialNativeTokenLimit, address _protocolFeeCollector, address _nftFeeCurrency) public
```

_Grants roles to `_attributor`, `_pauser` and DEFAULT_ADMIN_ROLE to the deployer.

Adds the initial `acceptedERC20CurrencyToken` as an accepted currency with its `initialTokenLimit`.
Adds the zero address (native token) as an accepted currency with its `initialNativeTokenLimit`._

### setClaimCooldown

```solidity
function setClaimCooldown(uint256 _period) external
```

_Sets the period for `claimCooldown`.

Requirements:

- `_period` must be different from the current one.
- Only admins can call this function._

### setProjectBudgetCooldown

```solidity
function setProjectBudgetCooldown(uint256 _period) external
```

_Sets the period for `projectBudgetCooldown`.

Requirements:

- `_period` must be different from the current one.
- Only admins can call this function._

### getFeesInformation

```solidity
function getFeesInformation() external view returns (struct IFuulManager.FeesInformation)
```

_Returns all fees for attribution._

### setProtocolFee

```solidity
function setProtocolFee(uint8 _value) external
```

_Sets the protocol fees for each attribution.

Requirements:

- `_value` must be different from the current one.
- Only admins can call this function._

### setClientFee

```solidity
function setClientFee(uint8 _value) external
```

_Sets the fees for the client that was used to create the project.

Requirements:

- `_value` must be different from the current one.
- Only admins can call this function._

### setAttributorFee

```solidity
function setAttributorFee(uint8 _value) external
```

_Sets the fees for the attributor.

Requirements:

- `_value` must be different from the current one.
- Only admins can call this function._

### setNftFixedFeeAmounte

```solidity
function setNftFixedFeeAmounte(uint8 _value) external
```

_Sets the fixed fee amount for NFT rewards.

Requirements:

- `_value` must be different from the current one.
- Only admins can call this function._

### setNftFeeCurrency

```solidity
function setNftFeeCurrency(address newCurrency) external
```

_Sets the currency that will be used to pay NFT rewards fees.

Requirements:

- `_value` must be different from the current one.
- Only admins can call this function._

### setProtocolFeeCollector

```solidity
function setProtocolFeeCollector(address newCollector) external
```

_Sets the protocol fee collector address.

Requirements:

- `_value` must be different from the current one.
- Only admins can call this function._

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

_Adds a currency token.
See {_addCurrencyToken}

Requirements:

- Only admins can call this function._

### removeCurrencyToken

```solidity
function removeCurrencyToken(address tokenAddress) external
```

_Removes a currency token.

Requirements:

- `tokenAddress` must be accepted.
- Only admins can call this function._

### setCurrencyTokenLimit

```solidity
function setCurrencyTokenLimit(address tokenAddress, uint256 limit) external
```

_Sets a new `claimLimitPerCooldown` for a currency token.

Notes:
We are not checking that the tokenAddress is accepted because
users can claim from unaccepted currencies.

Requirements:

- `limit` must be greater than zero.
- `limit` must be different from the current one.
- Only admins can call this function._

### pauseAll

```solidity
function pauseAll() external
```

_Pauses the contract and all {FuulProject}s.
See {Pausable.sol}

Requirements:

- Only addresses with the PAUSER_ROLE can call this function._

### unpauseAll

```solidity
function unpauseAll() external
```

_Unpauses the contract and all {FuulProject}s.
See {Pausable.sol}

Requirements:

- Only addresses with the PAUSER_ROLE can call this function._

### isPaused

```solidity
function isPaused() external view returns (bool)
```

_Returns whether the contract is paused.
See {Pausable.sol}_

### attributeTransactions

```solidity
function attributeTransactions(struct IFuulManager.AttributionEntity[] attributions, address attributorFeeCollector) external
```

_Attributes: calls the `attributeTransactions` function in {FuulProject} from an array of {AttributionEntity}.

Requirements:

- Contract should not be paused.
- Only addresses with the ATTRIBUTOR_ROLE can call this function._

### claim

```solidity
function claim(struct IFuulManager.ClaimCheck[] claimChecks) external
```

_Claims: calls the `claimFromProject` function in {FuulProject} from an array of of {ClaimCheck}.

Requirements:

- Contract should not be paused._

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

### _addCurrencyToken

```solidity
function _addCurrencyToken(address tokenAddress, uint256 claimLimitPerCooldown) internal
```

_Adds a new `tokenAddress` to accepted currencies with its
corresponding `claimLimitPerCooldown`.

Requirements:

- `tokenAddress` must be a contract (excepting for the zero address).
- `tokenAddress` must not be accepted yet.
- `claimLimitPerCooldown` should be greater than zero._

## FuulProject

### fuulFactory

```solidity
address fuulFactory
```

### EVENTS_SIGNER_ROLE

```solidity
bytes32 EVENTS_SIGNER_ROLE
```

### budgets

```solidity
mapping(address => uint256) budgets
```

### availableToClaim

```solidity
mapping(address => mapping(address => uint256)) availableToClaim
```

### projectInfoURI

```solidity
string projectInfoURI
```

### nftFeeBudget

```solidity
mapping(address => uint256) nftFeeBudget
```

### clientFeeCollector

```solidity
address clientFeeCollector
```

### lastRemovalApplication

```solidity
uint256 lastRemovalApplication
```

### onlyFuulManager

```solidity
modifier onlyFuulManager()
```

_Modifier that the sender is the fuul manager. Reverts
with an Unauthorized error including the sender and the required sender._

### whenManagerIsPaused

```solidity
modifier whenManagerIsPaused()
```

_Modifier that the Fuul Manager contract is not paused. Reverts
with a ManagerIsPaused error._

### constructor

```solidity
constructor() public
```

_Sets the value for {fuulFactory}.

This value is immutable: it can only be set once during
construction._

### initialize

```solidity
function initialize(address projectAdmin, address _projectEventSigner, string _projectInfoURI, address _clientFeeCollector) external
```

_Initializes the contract when the Factory deploys a new clone}.

Grants roles for project admin, the address allowed to send events 
through the SDK and the URI with the project information_

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

### setProjectURI

```solidity
function setProjectURI(string _projectURI) external
```

_Sets `projectInfoURI` as the information for the project.

Emits {ProjectInfoUpdated}.

Requirements:

- `_projectURI` must not be an empty string.
- Only admins can call this function._

### depositFungibleToken

```solidity
function depositFungibleToken(address currency, uint256 amount) external payable
```

_Deposits fungible tokens.
They can be native or ERC20 tokens.

Emits {BudgetDeposited}.

Requirements:

- `amount` must be greater than zero.
- Only admins can deposit.
- Token currency must be accepted in {Fuul Manager}_

### depositNFTToken

```solidity
function depositNFTToken(address currency, uint256[] tokenIds, uint256[] amounts) external
```

_Deposits NFTs.
They can be ERC1155 or ERC721 tokens.
`amounts` parameter is only used when dealing with ERC1155 tokens.

Emits {BudgetDeposited}.

Requirements:

- Only admins can deposit._

### applyToRemoveBudget

```solidity
function applyToRemoveBudget() external
```

_Sets timestamp for which users request to remove their budgets.
    *
Requirements:

- Only admins can call this function._

### getBudgetCooldownPeriod

```solidity
function getBudgetCooldownPeriod() public view returns (uint256)
```

_Returns the timestamp when funds can be removed.
The period for removing a project's budget begins upon calling the {applyToRemoveBudget} function
and ends once the {projectBudgetCooldown} period has elapsed._

### removeFungibleBudget

```solidity
function removeFungibleBudget(address currency, uint256 amount) external
```

_Removes fungible tokens.
They can be native or ERC20 tokens.

Emits {BudgetRemoved}.

Requirements:

- `amount` must be greater than zero.
- Only admins can remove.
- Budget remove cooldown period has to be completed._

### removeNFTBudget

```solidity
function removeNFTBudget(address currency, uint256[] tokenIds, uint256[] amounts) external
```

_Removes NFT tokens.
They can be ERC1155 or ERC721 tokens.
`amounts` parameter is only used when dealing with ERC1155 tokens.

Emits {BudgetRemoved}.

Requirements:

- `amount` must be greater than zero.
- Only admins can remove.
- Budget remove cooldown period has to be completed._

### depositFeeBudget

```solidity
function depositFeeBudget(uint256 amount) external payable
```

_Deposits budget to pay for fees when rewarding NFTs.
The currency is defined in the {FuulManager} contract.

Emits {FeeBudgetDeposit}.

Requirements:

- `amount` must be greater than zero.
- Only admins can deposit._

### removeFeeBudget

```solidity
function removeFeeBudget(address currency, uint256 amount) external
```

_Removes fee budget for NFT rewards.

Emits {BudgetRemoved}.

Notes: Currency is an argument because if the default is changed in {FuulManager}, projects will still be able to remove

Requirements:

- `amount` must be greater than zero.
- Only admins can remove.
- Budget remove cooldown period has to be completed._

### _calculateAmountsForFungibleToken

```solidity
function _calculateAmountsForFungibleToken(struct IFuulManager.FeesInformation feesInfo, uint256 totalAmount, uint256 amountToPartner, uint256 amountToEndUser) internal pure returns (uint256[3] fees, uint256 netAmountToPartner, uint256 netAmountToEndUser)
```

_Internal function to calculate fees and amounts for fungible token reward._

### _calculateFeesForNFT

```solidity
function _calculateFeesForNFT(struct IFuulManager.FeesInformation feesInfo) internal pure returns (uint256[3] fees)
```

_Internal function to calculate fees for non fungible token reward._

### attributeTransactions

```solidity
function attributeTransactions(struct IFuulProject.Attribution[] attributions, address attributorFeeCollector) external
```

_Attributes: removes amounts from budget and adds them to corresponding partners, users and fee collectors.

Emits {Attributed}.

Notes:
- When rewards are fungible tokens, fees will be a percentage of the payment and it will be substracted from the payment.
- When rewards are NFTs, fees will be a fixed amount and the {nftFeeBudget} will be used.

Requirements:

- Currency budgets have to be greater than amounts attributed.
- The sum of  {amountToPartner} and {amountToEndUser} of each {Attribution} must be greater than zero.
- Only {FuulManager} can attribute.
- {FuulManager} must not be paused._

### claimFromProject

```solidity
function claimFromProject(address currency, address receiver, uint256[] tokenIds, uint256[] amounts) external returns (uint256 claimAmount, address claimCurrency)
```

_Claims: sends funds to `receiver` that has available to claim funds.

`tokenIds` parameter is only used when dealing with ERC1155 and ERC721 tokens.
`amounts` parameter is only used when dealing with ERC1155 tokens.

Requirements:

- `receiver` must have available funds to claim for {currency}.
- Only {FuulManager} can call this function.
- {FuulManager} must not be paused._

### _transferERC721Tokens

```solidity
function _transferERC721Tokens(address tokenAddress, address senderAddress, address receiverAddress, uint256 tokenId) internal
```

_Helper function to transfer ERC721 tokens._

### _transferERC1155Tokens

```solidity
function _transferERC1155Tokens(address tokenAddress, address senderAddress, address receiverAddress, uint256[] tokenIds, uint256[] amounts) internal
```

_Helper function to transfer ERC1155 tokens._

### _getSumFromArray

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
event ProjectCreated(uint256 projectId, address deployedAddress, address eventSigner, string projectInfoURI, address _clientFeeCollector)
```

### createFuulProject

```solidity
function createFuulProject(address _projectAdmin, address _projectEventSigner, string _projectInfoURI, address _clientFeeCollector) external
```

### projects

```solidity
function projects(uint256 projectId) external returns (address)
```

### totalProjectsCreated

```solidity
function totalProjectsCreated() external view returns (uint256)
```

### getUserProjectByIndex

```solidity
function getUserProjectByIndex(address account, uint256 index) external view returns (address)
```

### getUserProjectCount

```solidity
function getUserProjectCount(address account) external view returns (uint256)
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
  address currency;
  uint256[] tokenIds;
  uint256[] amounts;
}
```

### AttributionEntity

```solidity
struct AttributionEntity {
  address projectAddress;
  struct IFuulProject.Attribution[] projectAttributions;
}
```

### FuulProjectFungibleCurrencies

```solidity
struct FuulProjectFungibleCurrencies {
  address deployedAddress;
  address[] currencies;
}
```

### FeesInformation

```solidity
struct FeesInformation {
  uint8 protocolFee;
  uint8 attributorFee;
  uint8 clientFee;
  address protocolFeeCollector;
  uint256 nftFixedFeeAmount;
  address nftFeeCurrency;
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

### projectBudgetCooldown

```solidity
function projectBudgetCooldown() external view returns (uint256 period)
```

### claimCooldown

```solidity
function claimCooldown() external view returns (uint256 period)
```

### usersClaims

```solidity
function usersClaims(address user, address currency) external view returns (uint256)
```

### protocolFee

```solidity
function protocolFee() external view returns (uint8 fees)
```

### protocolFeeCollector

```solidity
function protocolFeeCollector() external view returns (address)
```

### getFeesInformation

```solidity
function getFeesInformation() external returns (struct IFuulManager.FeesInformation)
```

### clientFee

```solidity
function clientFee() external view returns (uint8 fees)
```

### attributorFee

```solidity
function attributorFee() external view returns (uint8 fees)
```

### nftFeeCurrency

```solidity
function nftFeeCurrency() external view returns (address)
```

### setClaimCooldown

```solidity
function setClaimCooldown(uint256 _period) external
```

### setProjectBudgetCooldown

```solidity
function setProjectBudgetCooldown(uint256 period) external
```

### setProtocolFee

```solidity
function setProtocolFee(uint8 value) external
```

### setClientFee

```solidity
function setClientFee(uint8 value) external
```

### setAttributorFee

```solidity
function setAttributorFee(uint8 value) external
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

### claim

```solidity
function claim(struct IFuulManager.ClaimCheck[] claimChecks) external
```

## IFuulProject

### Attribution

```solidity
struct Attribution {
  address currency;
  address partner;
  address endUser;
  uint256 amountToPartner;
  uint256 amountToEndUser;
}
```

### ProjectInfoUpdated

```solidity
event ProjectInfoUpdated(string projectInfoURI)
```

### BudgetDeposited

```solidity
event BudgetDeposited(address account, uint256 amount, address currency, enum IFuulManager.TokenType tokenType, uint256[] tokenIds, uint256[] amounts)
```

### BudgetRemoved

```solidity
event BudgetRemoved(address account, uint256 amount, address currency, enum IFuulManager.TokenType tokenType, uint256[] tokenIds, uint256[] amounts)
```

### Claimed

```solidity
event Claimed(address account, address currency, uint256 amount, uint256[] rewardTokenIds, uint256[] amounts)
```

### Attributed

```solidity
event Attributed(address currency, uint256 totalAmount, address[5] receivers, uint256[5] amounts)
```

### FeeBudgetDeposited

```solidity
event FeeBudgetDeposited(address account, uint256 amount, address currency)
```

### FeeBudgetRemoved

```solidity
event FeeBudgetRemoved(address account, uint256 amount, address currency)
```

### ManagerIsPaused

```solidity
error ManagerIsPaused()
```

### ManagerIsNotPaused

```solidity
error ManagerIsNotPaused()
```

### EmptyURI

```solidity
error EmptyURI()
```

### NoRemovalApplication

```solidity
error NoRemovalApplication()
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

### availableToClaim

```solidity
function availableToClaim(address account, address currency) external view returns (uint256)
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

### setProjectURI

```solidity
function setProjectURI(string _projectURI) external
```

### clientFeeCollector

```solidity
function clientFeeCollector() external view returns (address)
```

### depositFungibleToken

```solidity
function depositFungibleToken(address currency, uint256 amount) external payable
```

### depositNFTToken

```solidity
function depositNFTToken(address currency, uint256[] rewardTokenIds, uint256[] amounts) external
```

### lastRemovalApplication

```solidity
function lastRemovalApplication() external view returns (uint256)
```

### applyToRemoveBudget

```solidity
function applyToRemoveBudget() external
```

### getBudgetCooldownPeriod

```solidity
function getBudgetCooldownPeriod() external view returns (uint256)
```

### removeFungibleBudget

```solidity
function removeFungibleBudget(address currency, uint256 amount) external
```

### removeNFTBudget

```solidity
function removeNFTBudget(address currency, uint256[] rewardTokenIds, uint256[] amounts) external
```

### attributeTransactions

```solidity
function attributeTransactions(struct IFuulProject.Attribution[] attributions, address attributorFeeCollector) external
```

### claimFromProject

```solidity
function claimFromProject(address currency, address receiver, uint256[] tokenIds, uint256[] amounts) external returns (uint256, address)
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

## MockTokenRewards

### constructor

```solidity
constructor() public
```

### mint

```solidity
function mint() external
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

