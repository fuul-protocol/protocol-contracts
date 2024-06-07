const attributor = "0xADD2e565c266D105255Eeba0d24342EA8302064e";
const pauser = "0xf3F207Ee9e130830D51e46Ba701f4bCB52403A39";
const unpauser = "0xB714A459b07766208daEA43568bA6962b7578512";
const acceptedERC20CurrencyToken = "0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4";
const initialTokenLimit = ethers.parseEther("100000");;
const initialNativeTokenLimit = ethers.parseEther("100000");;

module.exports = [
  attributor,
  pauser,
  unpauser,
  acceptedERC20CurrencyToken,
  initialTokenLimit,
  initialNativeTokenLimit,
];