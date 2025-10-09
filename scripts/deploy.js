const hre = require("hardhat");
const { ethers } = require("hardhat");

/**
 * Flash Loan Contract Deployment Script
 * 
 * Deploys to Ethereum mainnet or testnet with verification
 * 
 * Usage:
 * npx hardhat run scripts/deploy.js --network mainnet
 * npx hardhat run scripts/deploy.js --network sepolia
 * npx hardhat run scripts/deploy.js --network hardhat (for local testing)
 */

// Network-specific Aave Pool Addresses Provider addresses
const AAVE_ADDRESSES = {
  mainnet: "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e",
  sepolia: "0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A",
  polygon: "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb",
  arbitrum: "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb",
  optimism: "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb",
};

async function main() {
  console.log("\n🚀 Starting Flash Loan Contract Deployment...\n");
  
  // Get network information
  const network = await ethers.provider.getNetwork();
  const networkName = hre.network.name;
  const chainId = network.chainId;
  
  console.log("📡 Network Information:");
  console.log("  Name:", networkName);
  console.log("  Chain ID:", chainId.toString());
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);
  
  console.log("\n👤 Deployer Information:");
  console.log("  Address:", deployerAddress);
  console.log("  Balance:", ethers.formatEther(balance), "ETH");
  
  // Determine Aave Pool Addresses Provider based on network
  let aaveProvider;
  if (networkName === "mainnet" || chainId === 1n) {
    aaveProvider = AAVE_ADDRESSES.mainnet;
  } else if (networkName === "sepolia" || chainId === 11155111n) {
    aaveProvider = AAVE_ADDRESSES.sepolia;
  } else if (networkName === "hardhat" || chainId === 31337n) {
    // For local hardhat, use mainnet address (assumes forking)
    aaveProvider = AAVE_ADDRESSES.mainnet;
  } else {
    console.error("\n❌ Unsupported network. Please add Aave address for this network.");
    process.exit(1);
  }
  
  console.log("\n🏦 Aave Configuration:");
  console.log("  Pool Addresses Provider:", aaveProvider);
  
  // Estimate deployment gas
  const FlashLoan = await ethers.getContractFactory("FlashLoan");
  const deploymentData = FlashLoan.getDeployTransaction(aaveProvider);
  const estimatedGas = await ethers.provider.estimateGas({
    data: deploymentData.data,
  });
  
  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice;
  const estimatedCost = estimatedGas * gasPrice;
  
  console.log("\n⛽ Gas Estimation:");
  console.log("  Estimated Gas:", estimatedGas.toString());
  console.log("  Gas Price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");
  console.log("  Estimated Cost:", ethers.formatEther(estimatedCost), "ETH");
  
  // Confirm deployment
  if (balance < estimatedCost) {
    console.error("\n❌ Insufficient balance for deployment!");
    process.exit(1);
  }
  
  console.log("\n⏳ Deploying FlashLoan contract...");
  
  // Deploy contract
  const flashLoan = await FlashLoan.deploy(aaveProvider);
  await flashLoan.waitForDeployment();
  
  const contractAddress = await flashLoan.getAddress();
  const deploymentTx = flashLoan.deploymentTransaction();
  
  console.log("\n✅ Contract Deployed Successfully!");
  console.log("  Contract Address:", contractAddress);
  console.log("  Deployment Tx:", deploymentTx?.hash);
  console.log("  Block Number:", deploymentTx?.blockNumber);
  
  // Verify contract configuration
  console.log("\n🔍 Verifying Contract Configuration...");
  
  const owner = await flashLoan.owner();
  const pool = await flashLoan.getPool();
  const provider = await flashLoan.getAddressesProvider();
  
  console.log("  Owner:", owner);
  console.log("  Aave Pool:", pool);
  console.log("  Addresses Provider:", provider);
  
  // Wait for a few confirmations before verification
  if (networkName !== "hardhat" && networkName !== "localhost") {
    console.log("\n⏳ Waiting for block confirmations...");
    await deploymentTx?.wait(5);
    
    // Verify contract on Etherscan
    console.log("\n📝 Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [aaveProvider],
      });
      console.log("✅ Contract verified on Etherscan!");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("ℹ️  Contract already verified on Etherscan");
      } else {
        console.log("⚠️  Verification failed:", error.message);
        console.log("   You can verify manually with:");
        console.log(`   npx hardhat verify --network ${networkName} ${contractAddress} ${aaveProvider}`);
      }
    }
  }
  
  // Save deployment information
  const deploymentInfo = {
    network: networkName,
    chainId: chainId.toString(),
    contractAddress: contractAddress,
    deploymentTx: deploymentTx?.hash,
    blockNumber: deploymentTx?.blockNumber,
    deployer: deployerAddress,
    aavePoolProvider: aaveProvider,
    aavePool: pool,
    timestamp: new Date().toISOString(),
  };
  
  const fs = require("fs");
  const path = require("path");
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  // Save deployment info to file
  const filename = `${networkName}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n💾 Deployment information saved to:", filepath);
  
  // Print usage instructions
  console.log("\n📖 Next Steps:");
  console.log("================");
  console.log("1. Fund the contract with tokens to cover flash loan premiums");
  console.log("   - Aave v3 premium is 0.09% of the borrowed amount");
  console.log("   - Send WETH, DAI, or other tokens to:", contractAddress);
  console.log("\n2. Execute a flash loan:");
  console.log(`   const flashLoan = await ethers.getContractAt("FlashLoan", "${contractAddress}");`);
  console.log(`   await flashLoan.requestFlashLoan(WETH_ADDRESS, ethers.parseEther("10"));`);
  console.log("\n3. Customize the executeOperation() function for your use case:");
  console.log("   - Arbitrage opportunities");
  console.log("   - Liquidations");
  console.log("   - Collateral swaps");
  console.log("\n4. Monitor events:");
  console.log("   - FlashLoanInitiated: When loan is requested");
  console.log("   - FlashLoanAction: Custom logic execution");
  console.log("   - FlashLoanExecuted: Successful repayment");
  
  // Print contract interaction examples
  console.log("\n💡 Example Contract Interactions:");
  console.log("================");
  console.log("// Flash loan 10 WETH");
  console.log(`await flashLoan.requestFlashLoan("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", ethers.parseEther("10"));`);
  console.log("\n// Flash loan 10,000 DAI");
  console.log(`await flashLoan.requestFlashLoan("0x6B175474E89094C44Da98b954EedeAC495271d0F", ethers.parseEther("10000"));`);
  console.log("\n// Withdraw profits");
  console.log(`await flashLoan.withdrawToken("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");`);
  
  console.log("\n✨ Deployment Complete!\n");
  
  return {
    contractAddress,
    deploymentInfo,
  };
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment Failed!");
    console.error(error);
    process.exit(1);
  });
