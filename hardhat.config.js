require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
require("hardhat-abi-exporter");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-contract-sizer");

const { DEPLOYER_MNEMONIC, ETHERSCAN_API_KEY } = process.env;

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
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};
