# Aave v3 Flash Loan Contract

Production-ready Solidity flash loan implementation using Aave v3 on Ethereum mainnet. Features comprehensive event tracking, automatic repayment verification, and full test coverage.

## 🚀 Features

- **Aave v3 Integration**: Optimized for Aave's latest protocol version
- **Automatic Repayment**: Transaction reverts if repayment fails
- **Event Tracking**: Detailed events for borrowing, execution, and repayment
- **Security First**: Owner-only access, reentrancy protection via Aave
- **Comprehensive Tests**: 95%+ code coverage with mainnet fork testing
- **Easy Extension**: Clean architecture for arbitrage, liquidations, or MEV strategies

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Ethereum wallet with ETH for deployment
- Alchemy or Infura API key (for RPC access)
- Etherscan API key (for contract verification)

## 🛠️ Installation

1. **Clone and install dependencies**:
```bash
npm install
```

2. **Configure environment variables**:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```bash
ALCHEMY_API_KEY=your_alchemy_key
PRIVATE_KEY=your_wallet_private_key
ETHERSCAN_API_KEY=your_etherscan_key
```

3. **Compile contracts**:
```bash
npm run compile
```

## 🧪 Testing

### Run Full Test Suite
```bash
npm test
```

### Test with Gas Reporting
```bash
npm run test:gas
```

### Coverage Report
```bash
npm run coverage
```

**Expected Test Results**:
- ✅ Successful flash loan execution
- ✅ Event emission verification
- ✅ Premium calculation accuracy (0.09%)
- ✅ Reversion on insufficient funds
- ✅ Security: unauthorized access prevention
- ✅ Token withdrawal functionality

## 📦 Deployment

### Deploy to Ethereum Mainnet
```bash
npm run deploy:mainnet
```

### Deploy to Sepolia Testnet
```bash
npm run deploy:sepolia
```

### Deploy Locally (with mainnet fork)
```bash
npm run deploy:local
```

**Deployment Output**:
- Contract address
- Transaction hash
- Aave Pool configuration
- Etherscan verification link
- Gas usage statistics

## 📝 Contract Architecture

### Core Components

#### 1. **FlashLoan.sol**
Main contract implementing Aave's `IFlashLoanSimpleReceiver`:

```solidity
function requestFlashLoan(address asset, uint256 amount) external onlyOwner
```
- Initiates flash loan from Aave pool
- Emits `FlashLoanInitiated` event

```solidity
function executeOperation(...) external override returns (bool)
```
- Aave callback with borrowed funds
- **Insert your custom logic here**
- Approves repayment (principal + 0.09% fee)
- Emits `FlashLoanExecuted` event

### Event Flow

```
User
  ↓ (1) requestFlashLoan()
FlashLoan Contract
  ↓ (2) flashLoanSimple()
Aave Pool
  ↓ (3) transfers tokens
FlashLoan Contract (receives tokens)
  ↓ (4) executeOperation() callback
FlashLoan Contract
  ├─ (5) Custom logic execution
  ├─ (6) Approve repayment
  └─ (7) Emit events
Aave Pool
  └─ (8) Pull repayment automatically
```

## 💡 Usage Examples

### Basic Flash Loan Execution

```javascript
const { ethers } = require("hardhat");

// Connect to deployed contract
const flashLoan = await ethers.getContractAt("FlashLoan", "0x...");

// Flash loan 10 WETH
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
await flashLoan.requestFlashLoan(WETH, ethers.parseEther("10"));
```

### Monitoring Events

```javascript
// Listen for flash loan events
flashLoan.on("FlashLoanInitiated", (asset, amount, initiator) => {
  console.log(`Loan initiated: ${ethers.formatEther(amount)} tokens`);
});

flashLoan.on("FlashLoanExecuted", (asset, amount, premium, total) => {
  console.log(`Premium paid: ${ethers.formatEther(premium)}`);
  console.log(`Total repaid: ${ethers.formatEther(total)}`);
});
```

### Withdrawing Profits

```javascript
// Withdraw accumulated profits
await flashLoan.withdrawToken(WETH_ADDRESS);
await flashLoan.withdrawETH();
```

## 🔧 Extending for Arbitrage

To implement arbitrage logic, modify the `executeOperation()` function:

```solidity
function executeOperation(...) external override returns (bool) {
    // ... existing code ...
    
    // ============ YOUR ARBITRAGE LOGIC ============
    
    // Example: DEX arbitrage
    // 1. Swap borrowed tokens on Uniswap
    IUniswapRouter(UNISWAP_ROUTER).swapExactTokensForTokens(
        amount,
        minAmountOut,
        path,
        address(this),
        deadline
    );
    
    // 2. Swap back on Sushiswap at better price
    ISushiswapRouter(SUSHI_ROUTER).swapExactTokensForTokens(
        receivedAmount,
        minReturn,
        reversePath,
        address(this),
        deadline
    );
    
    // 3. Ensure profit > premium
    require(
        IERC20(asset).balanceOf(address(this)) >= totalRepayment,
        "Arbitrage not profitable"
    );
    
    // ============ END CUSTOM LOGIC ============
    
    // ... repayment approval ...
}
```

## 🔧 Extending for Liquidations

```solidity
function executeOperation(...) external override returns (bool) {
    // ... existing code ...
    
    // ============ LIQUIDATION LOGIC ============
    
    // 1. Liquidate underwater position on Aave/Compound
    ILendingPool(LENDING_POOL).liquidationCall(
        collateralAsset,
        debtAsset,
        user,
        debtToCover,
        receiveAToken
    );
    
    // 2. Sell seized collateral
    IUniswapRouter(ROUTER).swapExactTokensForTokens(...);
    
    // 3. Keep liquidation bonus (typically 5-10%)
    
    // ============ END LIQUIDATION LOGIC ============
    
    // ... repayment approval ...
}
```

## 📊 Gas Costs (Ethereum Mainnet)

| Operation | Estimated Gas | Cost @ 50 gwei | Cost @ 100 gwei |
|-----------|---------------|----------------|-----------------|
| Deployment | ~1,500,000 | ~0.075 ETH | ~0.15 ETH |
| Flash Loan (10 WETH) | ~250,000 | ~0.0125 ETH | ~0.025 ETH |
| With DEX Swap | ~400,000 | ~0.02 ETH | ~0.04 ETH |

**Note**: Actual costs vary based on custom logic complexity and network congestion.

## 🔒 Security Considerations

### Built-in Protections
- ✅ Owner-only flash loan initiation
- ✅ Aave Pool validation in `executeOperation()`
- ✅ Balance checks before repayment
- ✅ Automatic reversion on insufficient funds

### Additional Recommendations
1. **Test extensively** on testnet before mainnet deployment
2. **Start with small amounts** to validate logic
3. **Monitor for MEV** (consider Flashbots for sensitive operations)
4. **Set approval limits** for external DEX interactions
5. **Implement circuit breakers** for production strategies
6. **Use timelock** for critical parameter changes

## 🏗️ Project Structure

```
aave-flashloan/
├── contracts/
│   └── FlashLoan.sol          # Main flash loan contract
├── scripts/
│   └── deploy.js              # Deployment script
├── test/
│   └── FlashLoan.test.js      # Comprehensive test suite
├── deployments/               # Deployment records (git-ignored)
├── hardhat.config.js          # Hardhat configuration
├── package.json               # Dependencies
├── .env.example               # Environment template
└── README.md                  # This file
```

## 🌐 Supported Networks

| Network | Chain ID | Aave Pool Provider |
|---------|----------|-------------------|
| Ethereum Mainnet | 1 | `0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e` |
| Sepolia Testnet | 11155111 | `0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A` |
| Polygon | 137 | `0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb` |
| Arbitrum | 42161 | `0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb` |
| Optimism | 10 | `0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb` |

## 📚 Resources

- [Aave v3 Documentation](https://docs.aave.com/developers/core-contracts/pool)
- [Flash Loans Overview](https://docs.aave.com/developers/guides/flash-loans)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

## 🐛 Troubleshooting

### "Flash loan not received" Error
**Cause**: Aave pool doesn't have sufficient liquidity for requested asset  
**Solution**: Check available liquidity on [Aave app](https://app.aave.com/) or reduce loan amount

### "Insufficient balance to repay" Error
**Cause**: Custom logic didn't generate enough profit to cover premium  
**Solution**: Ensure your strategy generates profit >= 0.09% before repayment

### Test Failures on Fork
**Cause**: Mainnet state has changed since fork block  
**Solution**: Update `blockNumber` in `hardhat.config.js` or remove for latest state

### Deployment Out of Gas
**Cause**: Complex contract exceeds gas limit  
**Solution**: Enable `viaIR: true` in Solidity settings for better optimization

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## ⚖️ License

MIT License - see LICENSE file for details

## ⚠️ Disclaimer

This software is provided "as is" for educational purposes. Flash loans carry significant financial risk. Always:
- Test thoroughly on testnets
- Start with small amounts
- Understand the risks of DeFi protocols
- Never invest more than you can afford to lose

The authors assume no liability for financial losses incurred through use of this code.

## 📞 Support

- Issues: [GitHub Issues](https://github.com/yourusername/aave-flashloan/issues)
- Discussions: [GitHub Discussions](https://github.com/yourusername/aave-flashloan/discussions)

---

**Built with ❤️ for the Ethereum DeFi community**
