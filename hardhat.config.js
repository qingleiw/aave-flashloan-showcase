require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

/**
 * Hardhat Configuration for Flash Loan Contract
 * 
 * Required Environment Variables (.env file):
 * - ALCHEMY_API_KEY or INFURA_API_KEY: For mainnet forking and deployment
 * - PRIVATE_KEY: Deployer wallet private key (for mainnet deployment)
 * - ETHERSCAN_API_KEY: For contract verification
 */

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";
const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

// Determine RPC URL
const MAINNET_RPC_URL = ALCHEMY_API_KEY 
  ? `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
  : INFURA_API_KEY
  ? `https://mainnet.infura.io/v3/${INFURA_API_KEY}`
  : "";

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: false, // Set to true if contract is too large
    },
  },
  
  networks: {
    // Local Hardhat network with mainnet fork for testing
    hardhat: {
      forking: {
        url: MAINNET_RPC_URL,
        blockNumber: 18500000, // Optional: pin to specific block for consistent tests
        enabled: MAINNET_RPC_URL !== "", // Only fork if RPC URL is provided
      },
      chainId: 1, // Use mainnet chain ID for better compatibility
      accounts: {
        count: 10,
        accountsBalance: "10000000000000000000000", // 10,000 ETH per account
      },
    },
    
    // Ethereum Mainnet (for production deployment)
    mainnet: {
      url: MAINNET_RPC_URL,
      accounts: PRIVATE_KEY !== "0x0000000000000000000000000000000000000000000000000000000000000000" 
        ? [PRIVATE_KEY] 
        : [],
      chainId: 1,
      gasPrice: "auto", // Use "auto" or specify in Gwei: ethers.parseUnits("50", "gwei")
    },
    
    // Sepolia Testnet (for testing before mainnet)
    sepolia: {
      url: ALCHEMY_API_KEY
        ? `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
        : `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: PRIVATE_KEY !== "0x0000000000000000000000000000000000000000000000000000000000000000"
        ? [PRIVATE_KEY]
        : [],
      chainId: 11155111,
    },
  },
  
  // Etherscan API key for contract verification
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      sepolia: ETHERSCAN_API_KEY,
    },
  },
  
  // Gas reporter configuration (optional)
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || "",
    outputFile: "gas-report.txt",
    noColors: true,
  },
  
  // Path configurations
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  
  // Mocha test configuration
  mocha: {
    timeout: 200000, // 200 seconds (flash loans can be slow on forks)
  },
};

// Display configuration info
if (require.main === module) {
  console.log("\n📝 Hardhat Configuration Summary:");
  console.log("================================");
  console.log(`Solidity Version: 0.8.20`);
  console.log(`Optimizer: Enabled (200 runs)`);
  console.log(`Mainnet Fork: ${MAINNET_RPC_URL ? "✅ Enabled" : "❌ Disabled (add API key to .env)"}`);
  console.log(`Deployment Key: ${PRIVATE_KEY !== "0x0000000000000000000000000000000000000000000000000000000000000000" ? "✅ Set" : "❌ Not set"}`);
  console.log(`Etherscan API: ${ETHERSCAN_API_KEY ? "✅ Set" : "❌ Not set"}`);
  console.log("================================\n");
}
