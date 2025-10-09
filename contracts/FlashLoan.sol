// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IFlashLoanSimpleReceiver} from "@aave/core-v3/contracts/flashloan/interfaces/IFlashLoanSimpleReceiver.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FlashLoan
 * @notice Production-ready Aave v3 flash loan contract with comprehensive tracking
 * @dev Implements IFlashLoanSimpleReceiver for simplified single-asset flash loans
 * 
 * Architecture:
 * 1. User calls requestFlashLoan() to initiate the loan
 * 2. Aave Pool calls executeOperation() with borrowed funds
 * 3. Custom logic executes in executeOperation()
 * 4. Contract approves repayment amount (principal + fee)
 * 5. Aave automatically pulls repayment; transaction reverts if insufficient
 */
contract FlashLoan is IFlashLoanSimpleReceiver, Ownable {
    
    // ============ State Variables ============
    
    IPoolAddressesProvider public immutable ADDRESSES_PROVIDER;
    IPool public immutable POOL;
    
    // ============ Events ============
    
    /**
     * @notice Emitted when flash loan is successfully initiated
     * @param asset Token address borrowed
     * @param amount Principal amount borrowed (no fee)
     * @param initiator Address that triggered the flash loan
     */
    event FlashLoanInitiated(
        address indexed asset,
        uint256 amount,
        address indexed initiator
    );
    
    /**
     * @notice Emitted when flash loan execution completes successfully
     * @param asset Token address borrowed
     * @param amount Principal borrowed
     * @param premium Fee charged by Aave (typically 0.09%)
     * @param totalRepayment Principal + premium that was repaid
     */
    event FlashLoanExecuted(
        address indexed asset,
        uint256 amount,
        uint256 premium,
        uint256 totalRepayment
    );
    
    /**
     * @notice Emitted when custom flash loan logic executes
     * @param asset Token being used
     * @param amount Available amount to use
     * @param description Action performed
     */
    event FlashLoanAction(
        address indexed asset,
        uint256 amount,
        string description
    );
    
    // ============ Constructor ============
    
    /**
     * @notice Initialize contract with Aave v3 pool provider
     * @param addressProvider Aave PoolAddressesProvider for Ethereum mainnet
     * @dev Mainnet address: 0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e
     */
    constructor(address addressProvider) Ownable(msg.sender) {
        require(addressProvider != address(0), "Invalid provider address");
        
        ADDRESSES_PROVIDER = IPoolAddressesProvider(addressProvider);
        POOL = IPool(ADDRESSES_PROVIDER.getPool());
        
        require(address(POOL) != address(0), "Invalid pool address");
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Request a flash loan from Aave v3
     * @param asset Token address to borrow (e.g., WETH, USDC, DAI)
     * @param amount Amount to borrow in token's smallest unit (wei for WETH)
     * @dev This is the entry point for flash loan execution
     * 
     * Flow:
     * 1. Validates inputs
     * 2. Calls Aave Pool.flashLoanSimple()
     * 3. Aave transfers tokens to this contract
     * 4. Aave calls executeOperation() below
     * 5. Aave pulls repayment automatically
     * 6. Transaction reverts if repayment fails
     */
    function requestFlashLoan(address asset, uint256 amount) external onlyOwner {
        require(asset != address(0), "Invalid asset address");
        require(amount > 0, "Amount must be greater than 0");
        
        emit FlashLoanInitiated(asset, amount, msg.sender);
        
        // Request flash loan from Aave
        // Parameters: receiverAddress, asset, amount, params, referralCode
        POOL.flashLoanSimple(
            address(this),  // Receiver of the loan (this contract)
            asset,          // Asset to borrow
            amount,         // Amount to borrow
            "",             // Custom params (empty for basic usage)
            0               // Referral code (0 = no referral)
        );
    }
    
    /**
     * @notice Aave callback function executed during flash loan
     * @param asset Token address borrowed
     * @param amount Principal amount borrowed
     * @param premium Fee amount charged by Aave
     * @param initiator Address that initiated the flash loan
     * @param params Custom parameters (unused in this implementation)
     * @return bool Must return true for loan to succeed
     * @dev CRITICAL: Only callable by Aave Pool contract
     * 
     * At this point:
     * - Contract has received `amount` tokens
     * - Must approve `amount + premium` for Aave to pull back
     * - All custom logic goes here
     * - If approval insufficient, entire transaction reverts
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        // Security: Only Aave Pool can call this function
        require(msg.sender == address(POOL), "Caller must be Aave Pool");
        require(initiator == address(this), "Initiator must be this contract");
        
        // At this point, contract has `amount` of `asset` tokens
        uint256 balance = IERC20(asset).balanceOf(address(this));
        require(balance >= amount, "Flash loan not received");
        
        // ============ CUSTOM FLASH LOAN LOGIC STARTS HERE ============
        
        /**
         * INSERT YOUR ARBITRAGE/LIQUIDATION/MEV LOGIC HERE
         * 
         * Examples:
         * - Arbitrage: Trade on DEX A, trade back on DEX B for profit
         * - Liquidation: Liquidate underwater position, keep bonus
         * - Collateral swap: Repay debt, swap collateral, re-borrow
         * 
         * Requirements:
         * - Must generate profit >= premium
         * - Must leave totalRepayment (amount + premium) in contract
         */
        
        // Example: Simple demonstration logic
        emit FlashLoanAction(
            asset,
            amount,
            "Flash loan received - executing custom logic"
        );
        
        // Simulate custom operations (replace with your logic)
        // In production: call other contracts, execute trades, etc.
        
        // ============ CUSTOM FLASH LOAN LOGIC ENDS HERE ============
        
        // Calculate total repayment amount
        uint256 totalRepayment = amount + premium;
        
        // Security check: Ensure we have enough to repay
        require(
            IERC20(asset).balanceOf(address(this)) >= totalRepayment,
            "Insufficient balance to repay flash loan"
        );
        
        // Approve Aave Pool to pull the repayment amount
        // Pool will automatically pull this amount at the end
        IERC20(asset).approve(address(POOL), totalRepayment);
        
        emit FlashLoanExecuted(asset, amount, premium, totalRepayment);
        
        // Return true to signal successful execution
        // Aave will now pull totalRepayment from this contract
        return true;
    }
    
    /**
     * @notice Withdraw any tokens stuck in the contract
     * @param token Token address to withdraw
     * @dev Safety function to recover funds
     */
    function withdrawToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No balance to withdraw");
        
        IERC20(token).transfer(owner(), balance);
    }
    
    /**
     * @notice Withdraw native ETH stuck in contract
     */
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH balance");
        
        payable(owner()).transfer(balance);
    }
    
    /**
     * @notice Get Aave Pool address
     */
    function getPool() external view returns (address) {
        return address(POOL);
    }
    
    /**
     * @notice Get Aave Pool Addresses Provider
     */
    function getAddressesProvider() external view returns (address) {
        return address(ADDRESSES_PROVIDER);
    }
    
    // ============ Receive Function ============
    
    /**
     * @notice Allow contract to receive ETH
     */
    receive() external payable {}
}
