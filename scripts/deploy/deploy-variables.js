const deployVariables = {
    "polygon": {
        "fuulManagerAddress": "0xc38e3a10b5818601b29c83f195e8b5854aae45af",
        "protocolFeeCollector": "0x1452C0f9F5A9C8b5D785066385EC7cBcA4807712",
        "erc20": "0x6AE96Cc93331c19148541D4D2f31363684917092", // CVR,
        "attributor": "0x0bCC589731DaD347b87751e294d4425fCBa39751", // OZ defender relayer
        "contractAdmin": "0xbE8Db15756fd0Acaa3AF7B6C7d9bfda59B4D2B73"
    },
    "base": {
        "fuulManagerAddress": "0xc38e3a10b5818601b29c83f195e8b5854aae45af",
        "protocolFeeCollector": "0xBabCD882684BaB8951e456aA7D5a6Ce217305713",
        "erc20": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC,
        "attributor": "0x918DCD634FE4711f31662A76061b52F2E1dD7Dd7", // OZ defender relayer
        "contractAdmin": "0xe83D7A1C063ecf161Cb5f74C78a0eaE6C1d31ebc"
    },
    "op": {
        "fuulManagerAddress": "0xc38e3a10b5818601b29c83f195e8b5854aae45af",
        "protocolFeeCollector": "0x9a8401d07af7b4e9e97132093d19bbc41f47e1bc",
        "erc20": "0x7a1263eC3Bf0a19e25C553B8A2C312e903262C5E", // SAIL,
        "attributor": "0x6292785E13814Dda21906EE60D906456a07609F5", // OZ defender relayer
        "contractAdmin": "0x336281e9c487739ed7678ae5ef944f45101cf8e7"
    },
    "arb": {
        "fuulManagerAddress": "0xc38e3a10b5818601b29c83f195e8b5854aae45af",
        "protocolFeeCollector": "0xe40C0Dd67FF5a857a3581fb01a6a606356253b76",
        "erc20": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // USDC,
        "attributor": "0xA180827d8a74318C261a8106Dd2f51d2845fC582", // OZ defender relayer
        "contractAdmin": "0xf1Cb6bd9bf0c9EB2AFc0F6E42FBd7E08ae2e31EE"
    },
    "bsc": {
        "fuulManagerAddress": "0xc38e3a10b5818601b29c83f195e8b5854aae45af",
        "protocolFeeCollector": "0xd99bC7cE82983a9dc5d2c978F1369fF2424399BB",
        "erc20": "0x55d398326f99059ff775485246999027b3197955", // USDT,
        "attributor": "0x2a87B58bE8E44e98ADF8057e4555c668239cc6ad", // OZ defender relayer
        "contractAdmin": "0x5e5016dF389a37EbeeA3aA6575d30425c952cf65"
    },
    "baseSepolia": {
        "fuulManagerAddress": "0xB9B0C1FDAD70398e76954feF91ADD60f3D21C043",
        "protocolFeeCollector": "0xC3b730284Df27d42ab81e4Aa79F0DDD730aD1802",
        "erc20": "0xb51BbfA1aBFDdf5863A0e95ae257F5E9A994536d",
        "attributor": "0xC3b730284Df27d42ab81e4Aa79F0DDD730aD1802", // OZ defender relayer
        "contractAdmin": "0xC3b730284Df27d42ab81e4Aa79F0DDD730aD1802"
    },
    "zkSyncEra": {
        "fuulManagerAddress": "0xFB2Fb33db1D69C5c0dD71D31bb75082aD4E52E9f",
        "protocolFeeCollector": "0xCbf3D62200EBdaC009CCF9c66d4a6431c74BfF7E",
        "erc20": "0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4", // USDC,
        "attributor": "0xADD2e565c266D105255Eeba0d24342EA8302064e", // OZ defender relayer
        "contractAdmin": "0xB714A459b07766208daEA43568bA6962b7578512"
    },
    "zkTestnet": {
        "fuulManagerAddress": "0xFB2Fb33db1D69C5c0dD71D31bb75082aD4E52E9f",
        "protocolFeeCollector": "0xCbf3D62200EBdaC009CCF9c66d4a6431c74BfF7E",
        "erc20": "0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4", // USDC,
        "attributor": "0xADD2e565c266D105255Eeba0d24342EA8302064e", // OZ defender relayer
        "contractAdmin": "0xB714A459b07766208daEA43568bA6962b7578512"
    },
};


module.exports = deployVariables;
