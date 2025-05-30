const { abstract, monadTestnet } = require("./scripts/deploy/deploy-variables");

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
  ZKTESTNET_RPC,
  MODE_RPC,
  LUKSOTESTNET_RPC,
  LUKSO_RPC,
  ABSTRACT_RPC,
  HYPEREVM_RPC,
  ABSTRACTTESTNET_API_KEY,
  ABSTRACT_API_KEY,
  MONADTESTNET_RPC,
  HYPEREVMTESTNET_RPC
} = process.env;

module.exports = {
  solidity: {
    version: "0.8.18",
    // compilers: [
    //   {
    //     eraVersion: '1.0.0', //optional. Compile contracts with EraVM compiler
    //   },
    // ],
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
    mode: {
      url: MODE_RPC,
      accounts: { mnemonic: DEPLOYER_MNEMONIC },
      chainId: 34443,
    },
    luksoTestnet: {
      url: LUKSOTESTNET_RPC,
      chainId: 4201,
      accounts: { mnemonic: DEPLOYER_MNEMONIC },
    },
    lukso: {
      url: LUKSO_RPC,
      chainId: 42,
      accounts: { mnemonic: DEPLOYER_MNEMONIC },
    },
    hyperEVM: {
      url: HYPEREVM_RPC,
      chainId: 999,
      accounts: { mnemonic: DEPLOYER_MNEMONIC },
    },
    hyperEVMTestnet: {
      url: HYPEREVMTESTNET_RPC,
      chainId: 998,
      accounts: { mnemonic: DEPLOYER_MNEMONIC },
    },
    monadTestnet: {
      url: MONADTESTNET_RPC,
      chainId: 10143,
      accounts: { mnemonic: DEPLOYER_MNEMONIC },
    },
    abstractTestnet: {
      url: "https://api.testnet.abs.xyz",
      ethNetwork: "sepolia",
      zksync: true,
      chainId: 11124,
      accounts: { mnemonic: DEPLOYER_MNEMONIC },
    },
    abstractMainnet: {
      url: ABSTRACT_RPC,
      accounts: { mnemonic: DEPLOYER_MNEMONIC },
      ethNetwork: "mainnet",
      zksync: true,
      chainId: 2741,
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
  sourcify: {
    enabled: true,
  },

  etherscan: {
    apiKey: {
      base: BASESCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
      optimisticEthereum: OPTIMISTIC_API_KEY,
      arbitrumOne: ARBISCAN_API_KEY,
      bsc: BSCSCAN_API_KEY,
      baseSepolia: BASESCAN_API_KEY,
      mainnet: ETHERSCAN_API_KEY,
      mode: ETHERSCAN_API_KEY,
      luksoTestnet: 'no-api-key-needed',
      lukso: 'no-api-key-needed',
      abstractTestnet: ABSTRACTTESTNET_API_KEY,
      abstractMainnet: ABSTRACT_API_KEY,
      monadTestnet: 'no-api-key-needed'
    },
    customChains: [{
      network: 'mode',
      chainId: 34443,
      urls: {
        apiURL: 'https://explorer.mode.network/api',
        browserURL: 'https://explorer.mode.network/',
      }
    }, {
      network: "luksoTestnet",
      chainId: 4201,
      urls: {
        apiURL: "https://api.explorer.execution.testnet.lukso.network/api",
        browserURL: "https://explorer.execution.testnet.lukso.network/",
      },
    },
    {
      network: "lukso",
      chainId: 42,
      urls: {
        apiURL: "https://explorer.execution.mainnet.lukso.network/api",
        browserURL: "https://explorer.execution.mainnet.lukso.network",
      },
    },
    {
      network: "abstractTestnet",
      chainId: 11124,
      urls: {
        apiURL: "https://api-sepolia.abscan.org/api",
        browserURL: "https://sepolia.abscan.org/",
      },
    },
    {
      network: "abstractMainnet",
      chainId: 2741,
      urls: {
        apiURL: "https://api.abscan.org/api",
        browserURL: "https://abscan.org/",
      },
    },
    {
      network: "monadTestnet",
      chainId: 10143,
      urls: {
        apiURL: "https://sourcify-api-monad.blockvision.org",
        browserURL: "https://testnet.monadexplorer.com/",
      },
    },
    ]
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
