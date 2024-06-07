require("dotenv").config();
require("hardhat-abi-exporter");
require("@nomicfoundation/hardhat-verify");
require("@nomicfoundation/hardhat-chai-matchers");
require("hardhat-gas-reporter");
require("solidity-docgen");
require("@matterlabs/hardhat-zksync-deploy");
require("@matterlabs/hardhat-zksync-solc");
require("@matterlabs/hardhat-zksync-verify");

const {
  DEPLOYER_MNEMONIC,
  ETHERSCAN_API_KEY,
  POLYGONSCAN_API_KEY,
  OPTIMISTIC_API_KEY,
  ARBISCAN_API_KEY,
  BASESCAN_API_KEY,
  COINMARKETCAP_API_KEY,
  BSCSCAN_API_KEY,
  POLYGON_RPC,
  BASE_RPC,
  OPTIMISM_RPC,
  ARBITRUM_RPC,
  BSC_RPC,
  BASE_SEPOLIA_RPC,
  ZKSYNC_ERA_RPC,
  MAINNET_RPC,
  ZKTESTNET_RPC
} = process.env;

module.exports = {
  solidity: {
    version: "0.8.18",
  },
  settings: { optimizer: { enabled: true, runs: 1000000 } },
  abiExporter: {
    path: "./data/abi",
    runOnCompile: true,
    clear: true,
    flat: true,
    spacing: 2,
  },

  networks: {
    hardhat: {
      accounts: { mnemonic: DEPLOYER_MNEMONIC },
      allowUnlimitedContractSize: true,
    },
    polygon: {
      url: POLYGON_RPC,
      accounts: { mnemonic: DEPLOYER_MNEMONIC },
    },
    base: {
      url: BASE_RPC,
      accounts: { mnemonic: DEPLOYER_MNEMONIC },
    },
    optimism: {
      url: OPTIMISM_RPC,
      accounts: { mnemonic: DEPLOYER_MNEMONIC },
    },
    arbitrumOne: {
      url: ARBITRUM_RPC,
      accounts: { mnemonic: DEPLOYER_MNEMONIC },
    },
    bsc: {
      url: BSC_RPC,
      accounts: { mnemonic: DEPLOYER_MNEMONIC },
    },
    baseSepolia: {
      url: BASE_SEPOLIA_RPC,
      accounts: { mnemonic: DEPLOYER_MNEMONIC }
    },
    zkSyncEra: {
      url: ZKSYNC_ERA_RPC,
      accounts: { mnemonic: DEPLOYER_MNEMONIC },
      ethNetwork: MAINNET_RPC, // The Ethereum Web3 RPC URL.
      zksync: true, // Flag that targets zkSync Era.
      verifyURL: 'https://zksync2-mainnet-explorer.zksync.io/contract_verification'
    },
    zkTestnet: {
      url: ZKTESTNET_RPC, // The testnet RPC URL of zkSync Era network.
      accounts: { mnemonic: DEPLOYER_MNEMONIC },
      ethNetwork: "sepolia", // The Ethereum Web3 RPC URL, or the identifier of the network (e.g. `mainnet` or `sepolia`)
      zksync: true,
      verifyURL: 'https://explorer.sepolia.era.zksync.dev/contract_verification'
    }
  },

  etherscan: {
    apiKey: {
      base: BASESCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
      optimisticEthereum: OPTIMISTIC_API_KEY,
      arbitrumOne: ARBISCAN_API_KEY,
      bsc: BSCSCAN_API_KEY,
      baseSepolia: BASESCAN_API_KEY,
      mainnet: ETHERSCAN_API_KEY
    },
  },

  gasReporter: {
    enabled: false,
    currency: "usd",
    coinmarketcap: COINMARKETCAP_API_KEY,
    // token: "MATIC",
    // gasPriceApi:
    //   "https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice",
  },
};
