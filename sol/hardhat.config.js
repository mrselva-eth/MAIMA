require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");

const ETH_PRIVATE_KEY = process.env.ETH_PRIVATE_KEY || "";
// Etherscan API V2: use a single key for all chains (no more network-specific keys).
// Get one at https://etherscan.io/myapikey — works for Base Sepolia via chainid.
const ETHERSCAN_API_KEY =
  process.env.ETHERSCAN_API_KEY || process.env.BASESCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    "base-sepolia": {
      url: "https://sepolia.base.org",
      chainId: 84532,
      accounts: ETH_PRIVATE_KEY ? [ETH_PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    // Single string = Etherscan API V2 (no deprecation warnings). Object = legacy V1 per-network keys.
    apiKey: ETHERSCAN_API_KEY,
    customChains: [
      {
        network: "base-sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
    ],
  },
};
