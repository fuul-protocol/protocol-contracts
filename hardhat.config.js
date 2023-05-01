require("dotenv").config();
require("hardhat-abi-exporter");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-contract-sizer");
require("@nomicfoundation/hardhat-chai-matchers");
require("hardhat-gas-reporter");
require("solidity-docgen");

const { DEPLOYER_MNEMONIC, ETHERSCAN_API_KEY, COINMARKETCAP_API_KEY } =
  process.env;

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
    mumbai: {
      url: "https://matic-mumbai.chainstacklabs.com",
      accounts: { mnemonic: DEPLOYER_MNEMONIC },
      gasPrice: 35000000000,
    },
    // mainnet: {
    //   url: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    //   accounts: { mnemonic: DEPLOYER_MNEMONIC },
    // },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: true,
    currency: "usd",
    // gasPrice: 200,
    coinmarketcap: COINMARKETCAP_API_KEY,
    token: "MATIC",
    gasPriceApi:
      "https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice",
  },
};
