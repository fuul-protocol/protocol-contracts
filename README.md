# Fuul Protocol

Solidity smart contracts for the Fuul protocol.

## Overview

Fuul is a performance-based rewards protocol. Projects deposit budgets (native, ERC20, or NFTs) into on-chain Project contracts. A Manager service attributes conversions and enforces claim limits and pause controls. Fees are distributed to the protocol, the project client, and the attributor according to parameters defined in the Factory.

## Contracts

- **FuulFactory**: Deploys and configures Projects and global economics.
  - Stores protocol/client/attributor fee basis points and the fee collector.
  - Manages accepted currencies for Projects, including native and ERC20; tracks NFT fee currency and fixed fee amount.
  - Exposes a single-call helper used by Projects during attribution to validate caller permissions and fetch fee parameters.
  - Controls budget removal timing parameters shared by Projects.

- **FuulProject**: Per-project vault and accounting.
  - Initialized by the Factory with admin, event signer, project info URI, and client fee collector.
  - Accepts budget deposits in native, ERC20, ERC721, and ERC1155; tracks per-currency balances.
  - Attributes rewards (called by `FuulManager`) and allocates fees to protocol/client/attributor and net amounts to partner/end-user.
  - Supports claims (called by `FuulManager`) and time-gated budget removal by project admins.

- **FuulManager**: Orchestrates attribution and claims across Projects.
  - Admin-configurable per-currency claim limits over a cooldown window; tracks user cumulative claims per cooldown.
  - Supports pausing/unpausing all attribution/claim flows.
  - Calls into Projects to attribute and to release funds to receivers while enforcing limits and pause state.

- **zkFuulFactory / zkFuulProject**: Non-clone variant for ZK environments with the same external behavior. `zkFuulFactory` deploys `zkFuulProject` instances via constructor rather than clones; fee, currency, and removal-window logic mirrors the EVM version.

## How it works

1. Project creation
   - An admin calls `FuulFactory.createFuulProject(admin, eventSigner, infoURI, clientFeeCollector)`.
   - Factory deploys a minimal proxy clone of `FuulProject` (or a fresh `zkFuulProject` on zk) and emits `ProjectCreated`.

2. Funding budgets
   - Project admins deposit budgets:
     - `depositFungibleToken(currency, amount)` for native/erc20.
     - `depositNFTToken(currency, tokenIds, amounts)` for ERC721/1155.
   - For NFT rewards, fees are paid from a separate `nftFeeBudget` using `depositFeeBudget(amount)` in the currency set by the Factory.

3. Attribution
   - `FuulManager.attributeConversions(attributions[], attributorFeeCollector)` validates roles and pause state, then forwards to each target Project.
   - Project calls `fuulFactory.attributionFeeHelper(msg.sender)` to validate the caller has `MANAGER_ROLE` and to fetch `FeesInformation`.
   - Project computes fees and updates internal ledgers:
     - Fungible rewards: fees are percentage-based and deducted from the total.
     - NFT rewards: fixed fee amount is charged from `nftFeeBudget` in the fee currency.

4. Claiming
   - Users call `FuulManager.claim(checks[])`. Manager enforces per-currency claim limits and cooldowns then calls `project.claimFromProject(...)` to transfer funds/tokens.

5. Budget removal window
   - Admin applies with `applyToRemoveBudget()`. After `projectBudgetCooldown` elapses (and before `projectRemoveBudgetPeriod` ends), the admin can remove budget using `removeFungibleBudget` / `removeNFTBudget` / `removeFeeBudget`.

## Roles and permissions

- Factory: `DEFAULT_ADMIN_ROLE` (protocol admins), `MANAGER_ROLE` (addresses allowed to attribute/claim through Projects via `FuulManager`).
- Project: `DEFAULT_ADMIN_ROLE` (project operators), `EVENTS_SIGNER_ROLE` (off-chain event signing, not enforced on-chain for transfers).
- Manager: `ATTRIBUTOR_ROLE` (can attribute), `PAUSER_ROLE` and `UNPAUSER_ROLE` (pause controls), `DEFAULT_ADMIN_ROLE` (set limits and parameters).

## Fees and currencies

- Fees are set in basis points in the Factory: protocol, client, and attributor.
- For fungible rewards, fees are proportional to the total rewarded amount.
- For NFT rewards, fees are a fixed amount per attribution and paid from the Project `nftFeeBudget` in the `nftFeeCurrency` configured at the Factory level.
- Factory controls which currencies are accepted for deposits/claims across Projects.

## Documentation

A more detailed description of the Fuul protocol can be found in the [docs](https://docs.fuul.xyz/).

## Deployed contracts



## All deployments (from `deployment/`)

Note: This list is generated from files in `deployment/` and may include testnets or environments without explorer links.

### Abstract

- FuulFactory: `0x48955e80B47e0FC170D3BFA3e85d15960388c0EC`
- FuulManager: `0xFB2Fb33db1D69C5c0dD71D31bb75082aD4E52E9f`

### Arbitrum

- FuulFactory: `0x457DCa0de973E01d36CEdaF7f5b4b8b66D6C0ef5`
- FuulManager: `0xC38E3A10B5818601b29c83F195E8b5854AAE45aF`

### Base

- FuulFactory: `0x457DCa0de973E01d36CEdaF7f5b4b8b66D6C0ef5`
- FuulManager: `0xC38E3A10B5818601b29c83F195E8b5854AAE45aF`

### BNB Chain

- FuulFactory: `0x457DCa0de973E01d36CEdaF7f5b4b8b66D6C0ef5`
- FuulManager: `0xC38E3A10B5818601b29c83F195E8b5854AAE45aF`

### HyperEVM

- FuulFactory: `0x457DCa0de973E01d36CEdaF7f5b4b8b66D6C0ef5`
- FuulManager: `0xB9B0C1FDAD70398e76954feF91ADD60f3D21C043`

### Lukso

- FuulFactory: `0x457DCa0de973E01d36CEdaF7f5b4b8b66D6C0ef5`
- FuulManager: `0xC38E3A10B5818601b29c83F195E8b5854AAE45aF`

### Mainnet (Ethereum)

- FuulFactory: `0x457DCa0de973E01d36CEdaF7f5b4b8b66D6C0ef5`
- FuulManager: `0xC38E3A10B5818601b29c83F195E8b5854AAE45aF`

### Mode

- FuulFactory: `0x457DCa0de973E01d36CEdaF7f5b4b8b66D6C0ef5`
- FuulManager: `0xC38E3A10B5818601b29c83F195E8b5854AAE45aF`

### Monad Testnet

- FuulFactory: `0x457DCa0de973E01d36CEdaF7f5b4b8b66D6C0ef5`
- FuulManager: `0xC38E3A10B5818601b29c83F195E8b5854AAE45aF`

### Optimism

- FuulFactory: `0x457DCa0de973E01d36CEdaF7f5b4b8b66D6C0ef5`
- FuulManager: `0xC38E3A10B5818601b29c83F195E8b5854AAE45aF`

### Polygon

- FuulFactory: `0x457DCa0de973E01d36CEdaF7f5b4b8b66D6C0ef5`
- FuulManager: `0xc38e3a10b5818601b29c83f195e8b5854aae45af`

### zkSync Era

- FuulFactory: `0xA0Ae35bA13F677153707414E3cb82faCc69e8AeB`
- FuulManager: `0xFB2Fb33db1D69C5c0dD71D31bb75082aD4E52E9f`
