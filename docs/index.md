# Solidity API

## FuulFactory

### MANAGER_ROLE

```solidity
bytes32 MANAGER_ROLE
```

### fuulProjectImplementation

```solidity
address fuulProjectImplementation
```

### protocolFeeCollector

```solidity
address protocolFeeCollector
```

### nftFeeCurrency

```solidity
address nftFeeCurrency
```

### nftFixedFeeAmount

```solidity
uint256 nftFixedFeeAmount
```

### protocolFee

```solidity
uint256 protocolFee
```

### clientFee

```solidity
uint256 clientFee
```

### attributorFee

```solidity
uint256 attributorFee
```

### projectBudgetCooldown

```solidity
uint256 projectBudgetCooldown
```

### projectRemoveBudgetPeriod

```solidity
uint256 projectRemoveBudgetPeriod
```

### projects

```solidity
mapping(uint256 => address) projects
```

### userProjects

```solidity
mapping(address => struct EnumerableSet.AddressSet) userProjects
```

### acceptedCurrencies

```solidity
mapping(address => bool) acceptedCurrencies
```

### constructor

```solidity
constructor(address _fuulManager, address _protocolFeeCollector, address _nftFeeCurrency, address acceptedERC20CurrencyToken) public
```

_Sets the values for `fuulManager`, `fuulProjectImplementation` and the initial values for `protocolFeeCollector` and `nftFeeCurrency`.
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

### hasManagerRole

```solidity
function hasManagerRole(address account) public view returns (bool)
```

_Returns if an address has `MANAGER_ROLE`._

### getAllFees

```solidity
function getAllFees() public view returns (struct IFuulFactory.FeesInformation)
```

_Returns all fees in one function._

### attributionFeeHelper

```solidity
function attributionFeeHelper(address sender) external view returns (struct IFuulFactory.FeesInformation)
```

_Returns all fees for attribution and checks that the sender has `MANAGER_ROLE`.

Note:
The function purpose is to check and return all necessary data
to the {FuulProject} in one call when attributing.

Even though the sender is a parameter, in {FuulProject} is _msgSender() so it cannot be manipulated._

### setProtocolFee

```solidity
function setProtocolFee(uint256 _value) external
```

_Sets the protocol fees for each attribution.

Requirements:

- `_value` must be different from the current one.
- Only admins can call this function._

### setClientFee

```solidity
function setClientFee(uint256 _value) external
```

_Sets the fees for the client that was used to create the project.

Requirements:

- `_value` must be different from the current one.
- Only admins can call this function._

### setAttributorFee

```solidity
function setAttributorFee(uint256 _value) external
```

_Sets the fees for the attributor.

Requirements:

- `_value` must be different from the current one.
- Only admins can call this function._

### setNftFixedFeeAmounte

```solidity
function setNftFixedFeeAmounte(uint256 _value) external
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

### addCurrencyToken

```solidity
function addCurrencyToken(address tokenAddress) external
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

Notes:
- Projects will not be able to deposit with the currency token.
- We don't remove the `currencyToken` object because users will still be able to claim/remove it

Requirements:

- `tokenAddress` must be accepted.
- Only admins can call this function._

### setProjectBudgetCooldown

```solidity
function setProjectBudgetCooldown(uint256 _period) external
```

_Sets the period for `projectBudgetCooldown`.

Requirements:

- `_period` must be different from the current one.
- Only admins can call this function._

### setProjectRemoveBudgetPeriod

```solidity
function setProjectRemoveBudgetPeriod(uint256 _period) external
```

_Sets the period for `projectRemoveBudgetPeriod`.

Requirements:

- `_period` must be different from the current one.
- Only admins can call this function._

### getBudgetRemoveInfo

```solidity
function getBudgetRemoveInfo() external view returns (uint256 cooldown, uint256 removeWindow)
```

_Returns removal info. The function purpose is to call only once from {FuulProject} when needing this info._

## FuulProject

### IID_IERC1155

```solidity
bytes4 IID_IERC1155
```

### IID_IERC721

```solidity
bytes4 IID_IERC721
```

### fuulFactory

```solidity
address fuulFactory
```

### clientFeeCollector

```solidity
address clientFeeCollector
```

### EVENTS_SIGNER_ROLE

```solidity
bytes32 EVENTS_SIGNER_ROLE
```

### attributionProofs

```solidity
mapping(bytes32 => bool) attributionProofs
```

### lastStatusHash

```solidity
bytes32 lastStatusHash
```

### projectInfoURI

```solidity
string projectInfoURI
```

### lastRemovalApplication

```solidity
uint256 lastRemovalApplication
```

### budgets

```solidity
mapping(address => uint256) budgets
```

### availableToClaim

```solidity
mapping(address => mapping(address => uint256)) availableToClaim
```

### nftFeeBudget

```solidity
mapping(address => uint256) nftFeeBudget
```

### fuulFactoryInstance

```solidity
contract IFuulFactory fuulFactoryInstance
```

### canRemove

```solidity
modifier canRemove()
```

_Modifier to check if the project can remove funds. Reverts with an {OutsideRemovalWindow} error._

### isCurrencyAccepted

```solidity
modifier isCurrencyAccepted(address currency)
```

_Modifier to check if the currency is accepted in {FuulFactory}._

### _isCurrencyAccepted

```solidity
function _isCurrencyAccepted(address currency) internal view
```

_Internal function for {isCurrencyAccepted} modifier. Reverts with a TokenCurrencyNotAccepted error._

### nonZeroAmount

```solidity
modifier nonZeroAmount(uint256 amount)
```

_Modifier to check if the uint amount is zero._

### _nonZeroAmount

```solidity
function _nonZeroAmount(uint256 amount) internal pure
```

_Internal function for {nonZeroAmount} modifier. Reverts with a {TokenCurrencyNotAccepted} error._

### constructor

```solidity
constructor() public
```

_Sets the value for `fuulFactory`.
This value is immutable._

### initialize

```solidity
function initialize(address projectAdmin, address _projectEventSigner, string _projectInfoURI, address _clientFeeCollector) external
```

_Initializes the contract when the Factory deploys a new clone.

Grants roles for project admin, the address allowed to send events 
through the SDK, the URI with the project information and the address 
that will receive the client fees._

### _setProjectURI

```solidity
function _setProjectURI(string _projectURI) internal
```

_Internal function that sets `projectInfoURI` as the information for the project.

It also sets a new value for `lastStatusHash`.

Requirements:

- `_projectURI` must not be an empty string._

### setProjectURI

```solidity
function setProjectURI(string _projectURI) external
```

_Sets `projectInfoURI` as the information for the project.

Emits {ProjectInfoUpdated}.

Requirements:

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
- Token currency must be accepted in {FuulFactory}
- Currency must be the address zero (native token) or ERC20._

### depositNFTToken

```solidity
function depositNFTToken(address currency, uint256[] tokenIds, uint256[] amounts) external
```

_Deposits NFTs.

Note: `amounts` parameter is only used when dealing with ERC1155 tokens.

Emits {BudgetDeposited}.

Requirements:

- `tokenIds` must not be an empty string.
- Only admins can deposit.
- Token currency must be accepted in {FuulFactory}
- Currency must be an ERC721 or ERC1155._

### applyToRemoveBudget

```solidity
function applyToRemoveBudget() external
```

_Sets timestamp for which users request to remove their budgets.

Requirements:

- Only admins can call this function._

### getBudgetRemovePeriod

```solidity
function getBudgetRemovePeriod() public view returns (uint256 cooldown, uint256 removePeriodEnds)
```

_Returns the window when projects can remove funds.
The cooldown period for removing a project's budget begins upon calling the {applyToRemoveBudget} function
and ends once the `projectBudgetCooldown` period has elapsed.

The period to remove starts when the cooldown is completed, and ends after {removePeriod}.

It is a public function for the UI to be able to read and display dates._

### canRemoveFunds

```solidity
function canRemoveFunds() public view returns (bool)
```

_Returns if the project is inside the removal window.
It should be after the cooldown is completed and before the removal period ends.
It is a public function for the UI to be able to check if the project can remove._

### removeFungibleBudget

```solidity
function removeFungibleBudget(address currency, uint256 amount) external
```

_Removes fungible tokens.
They can be native or ERC20 tokens.

Emits {BudgetRemoved}.

Requirements:

- `amount` must be greater than zero.
- `amount` must be lower than budget for currency
- Only admins can remove.
- Must be within the Budget removal window.
- Currency must be the address zero (native token) or ERC20._

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
- `amount` must be lower than budget for currency
- Only admins can remove.
- Must be within the Budget removal window.
- Currency must be an ERC721 or ERC1155._

### depositFeeBudget

```solidity
function depositFeeBudget(uint256 amount) external payable
```

_Deposits budget to pay for fees when rewarding NFTs.
The currency is defined in the {FuulFactory} contract.

Emits {FeeBudgetDeposit}.

Requirements:

- `amount` must be greater than zero.
- Only admins can deposit._

### removeFeeBudget

```solidity
function removeFeeBudget(address currency, uint256 amount) external
```

_Removes fee budget for NFT rewards.

Emits {FeeBudgetRemoved}.

Notes: Currency is an argument because if the default is
changed in {FuulProject}, projects will still be able to remove.

Requirements:

- `amount` must be greater than zero.
- `amount` must be lower than fee budget.
- Only admins can remove.
- Must be within the Budget removal window._

### _calculateAmountsForFungibleToken

```solidity
function _calculateAmountsForFungibleToken(struct IFuulFactory.FeesInformation feesInfo, uint256 totalAmount, uint256 amountToPartner, uint256 amountToEndUser) internal pure returns (uint256[3] fees, uint256 netAmountToPartner, uint256 netAmountToEndUser)
```

_Internal function to calculate fees and amounts for fungible token reward._

### _calculateFeesForNFT

```solidity
function _calculateFeesForNFT(struct IFuulFactory.FeesInformation feesInfo) internal pure returns (uint256[3] fees)
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
- When rewards are NFTs, fees will be a fixed amount and the `nftFeeBudget` will be used.

Requirements:

- Currency budgets have to be greater than amounts attributed.
- The sum of `amountToPartner` and `amountToEndUser` for each `Attribution` must be greater than zero.
- Only `MANAGER_ROLE` in {FuulFactory} addresses can call this function. This is checked through the `getFeesInformation` in {FuulFactory}.
- Proof must not exist (be previously attributed).
- {FuulManager} must not be paused. This is checked through The `attributeTransactions` function in {FuulManager}._

### claimFromProject

```solidity
function claimFromProject(address currency, address receiver, uint256[] tokenIds, uint256[] amounts) external returns (uint256 availableAmount)
```

_Claims: sends funds to `receiver` that has available to claim funds.

`tokenIds` parameter is only used when dealing with ERC1155 and ERC721 tokens.
`amounts` parameter is only used when dealing with ERC1155 tokens.

Requirements:

- `receiver` must have available funds to claim for {currency}.
- Only `MANAGER_ROLE` in {FuulFactory} addresses can call this function.
- {FuulManager} must not be paused. This is checked through The `claim` function in {FuulManager}._

### _transferERC721Tokens

```solidity
function _transferERC721Tokens(address tokenAddress, address senderAddress, address receiverAddress, uint256[] tokenIds) internal
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

### isERC20

```solidity
function isERC20(address tokenAddress) internal view returns (bool)
```

_Returns whether the address is an ERC20 token._

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

## IFuulFactory

### FeesInformation

```solidity
struct FeesInformation {
  uint256 protocolFee;
  uint256 attributorFee;
  uint256 clientFee;
  address protocolFeeCollector;
  uint256 nftFixedFeeAmount;
  address nftFeeCurrency;
}
```

### ProjectCreated

```solidity
event ProjectCreated(uint256 projectId, address deployedAddress, address eventSigner, string projectInfoURI, address clientFeeCollector)
```

### ZeroAddress

```solidity
error ZeroAddress()
```

### TokenCurrencyAlreadyAccepted

```solidity
error TokenCurrencyAlreadyAccepted()
```

### TokenCurrencyNotAccepted

```solidity
error TokenCurrencyNotAccepted()
```

### Unauthorized

```solidity
error Unauthorized()
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

### hasManagerRole

```solidity
function hasManagerRole(address account) external view returns (bool)
```

### protocolFee

```solidity
function protocolFee() external view returns (uint256 fees)
```

### protocolFeeCollector

```solidity
function protocolFeeCollector() external view returns (address)
```

### getAllFees

```solidity
function getAllFees() external returns (struct IFuulFactory.FeesInformation)
```

### attributionFeeHelper

```solidity
function attributionFeeHelper(address sender) external returns (struct IFuulFactory.FeesInformation)
```

### clientFee

```solidity
function clientFee() external view returns (uint256 fees)
```

### attributorFee

```solidity
function attributorFee() external view returns (uint256 fees)
```

### nftFeeCurrency

```solidity
function nftFeeCurrency() external view returns (address)
```

### setProtocolFee

```solidity
function setProtocolFee(uint256 value) external
```

### setClientFee

```solidity
function setClientFee(uint256 value) external
```

### setAttributorFee

```solidity
function setAttributorFee(uint256 value) external
```

### setNftFixedFeeAmounte

```solidity
function setNftFixedFeeAmounte(uint256 _value) external
```

### setNftFeeCurrency

```solidity
function setNftFeeCurrency(address newCurrency) external
```

### acceptedCurrencies

```solidity
function acceptedCurrencies(address tokenAddress) external view returns (bool)
```

### addCurrencyToken

```solidity
function addCurrencyToken(address tokenAddress) external
```

### removeCurrencyToken

```solidity
function removeCurrencyToken(address tokenAddress) external
```

### projectBudgetCooldown

```solidity
function projectBudgetCooldown() external view returns (uint256 period)
```

### getBudgetRemoveInfo

```solidity
function getBudgetRemoveInfo() external view returns (uint256 cooldown, uint256 removeWindow)
```

### setProjectBudgetCooldown

```solidity
function setProjectBudgetCooldown(uint256 period) external
```

### setProjectRemoveBudgetPeriod

```solidity
function setProjectRemoveBudgetPeriod(uint256 period) external
```

## IFuulManager

### CurrencyTokenLimit

```solidity
struct CurrencyTokenLimit {
  uint256 claimLimitPerCooldown;
  uint256 cumulativeClaimPerCooldown;
  uint256 claimCooldownPeriodStarted;
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

### InvalidArgument

```solidity
error InvalidArgument()
```

### OverTheLimit

```solidity
error OverTheLimit()
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

### currencyLimits

```solidity
function currencyLimits(address currencyToken) external view returns (uint256, uint256, uint256)
```

### addCurrencyLimit

```solidity
function addCurrencyLimit(address tokenAddress, uint256 claimLimitPerCooldown) external
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
function attributeTransactions(struct IFuulManager.AttributionEntity[] attributions, address attributorFeeCollector) external
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
  bytes32 proof;
}
```

### ProjectInfoUpdated

```solidity
event ProjectInfoUpdated(string projectInfoURI)
```

### FungibleBudgetDeposited

```solidity
event FungibleBudgetDeposited(address account, uint256 amount, address currency)
```

### NFTBudgetDeposited

```solidity
event NFTBudgetDeposited(address account, uint256 amount, address currency, uint256[] tokenIds, uint256[] amounts)
```

### FungibleBudgetRemoved

```solidity
event FungibleBudgetRemoved(address account, uint256 amount, address currency)
```

### NFTBudgetRemoved

```solidity
event NFTBudgetRemoved(address account, uint256 amount, address currency, uint256[] tokenIds, uint256[] amounts)
```

### Claimed

```solidity
event Claimed(address account, address currency, uint256 amount, uint256[] rewardTokenIds, uint256[] amounts)
```

### Attributed

```solidity
event Attributed(address currency, uint256 totalAmount, address[5] receivers, uint256[5] amounts, bytes32 proof)
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

### OutsideRemovalWindow

```solidity
error OutsideRemovalWindow()
```

### ZeroAmount

```solidity
error ZeroAmount()
```

### AlreadyAttributed

```solidity
error AlreadyAttributed()
```

### Forbidden

```solidity
error Forbidden()
```

### InvalidCurrency

```solidity
error InvalidCurrency()
```

### InvalidArgument

```solidity
error InvalidArgument()
```

### fuulFactory

```solidity
function fuulFactory() external view returns (address)
```

### availableToClaim

```solidity
function availableToClaim(address account, address currency) external view returns (uint256)
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

### lastStatusHash

```solidity
function lastStatusHash() external view returns (bytes32)
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

### getBudgetRemovePeriod

```solidity
function getBudgetRemovePeriod() external view returns (uint256, uint256)
```

### canRemoveFunds

```solidity
function canRemoveFunds() external view returns (bool insideRemovalWindow)
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
function claimFromProject(address currency, address receiver, uint256[] tokenIds, uint256[] amounts) external returns (uint256)
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

### claimCooldown

```solidity
uint256 claimCooldown
```

### usersClaims

```solidity
mapping(address => mapping(address => uint256)) usersClaims
```

### currencyLimits

```solidity
mapping(address => struct IFuulManager.CurrencyTokenLimit) currencyLimits
```

### constructor

```solidity
constructor(address _attributor, address _pauser, address acceptedERC20CurrencyToken, uint256 initialTokenLimit, uint256 initialNativeTokenLimit) public
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

### addCurrencyLimit

```solidity
function addCurrencyLimit(address tokenAddress, uint256 claimLimitPerCooldown) external
```

_Adds a currency token.
See {_addCurrencyToken}.

Requirements:

- Only admins can call this function._

### setCurrencyTokenLimit

```solidity
function setCurrencyTokenLimit(address tokenAddress, uint256 limit) external
```

_Sets a new `claimLimitPerCooldown` for a currency token.

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

_Attributes: calls the `attributeTransactions` function in {FuulProject} from an array of `AttributionEntity`.

Requirements:

- Contract should not be paused.
- Only addresses with the `ATTRIBUTOR_ROLE` can call this function._

### claim

```solidity
function claim(struct IFuulManager.ClaimCheck[] claimChecks) external
```

_Claims: calls the `claimFromProject` function in {FuulProject} from an array of of `ClaimCheck`.

Requirements:

- Contract should not be paused._

### _addCurrencyLimit

```solidity
function _addCurrencyLimit(address tokenAddress, uint256 claimLimitPerCooldown) internal
```

_Adds a new `tokenAddress` to accepted currencies with its
corresponding `claimLimitPerCooldown`.

Requirements:

- `tokenAddress` must not be accepted yet.
- `claimLimitPerCooldown` should be greater than zero._

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

