const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FlashLoan Basic Test", function () {
  it("Should deploy successfully", async function () {
    const AAVE_POOL_PROVIDER = "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e";
    const FlashLoan = await ethers.getContractFactory("FlashLoan");
    const flashLoan = await FlashLoan.deploy(AAVE_POOL_PROVIDER);
    await flashLoan.waitForDeployment();
    
    const address = await flashLoan.getAddress();
    expect(address).to.not.equal(ethers.ZeroAddress);
    console.log("✅ Contract deployed to:", address);
  });
});
