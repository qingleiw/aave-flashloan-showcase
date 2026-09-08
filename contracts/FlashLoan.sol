// SPDX-License-Identifier: LicenseRef-Proprietary
pragma solidity ^0.8.20;

// PUBLIC SHOWCASE — the bodies of requestFlashLoan() and executeOperation() are
// omitted. Interface, state, events, constructor and security checks are kept so
// the design and quality are visible. Full source shared under engagement. See LICENSE.

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

    /// @notice Emitted when a flash loan is initiated
    event FlashLoanInitiated(address indexed asset, uint256 amount, address indexed initiator);

    /// @notice Emitted when execution completes and repayment is approved
    event FlashLoanExecuted(address indexed asset, uint256 amount, uint256 premium, uint256 totalRepayment);

    /// @notice Emitted when the custom in-loan logic runs
    event FlashLoanAction(address indexed asset, uint256 amount, string description);

    // ============ Constructor ============

    /**
     * @notice Initialize with the Aave v3 PoolAddressesProvider
     * @param addressProvider Aave PoolAddressesProvider (Ethereum mainnet: 0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e)
     */
    constructor(address addressProvider) Ownable(msg.sender) {
        require(addressProvider != address(0), "Invalid provider address");
        ADDRESSES_PROVIDER = IPoolAddressesProvider(addressProvider);
        POOL = IPool(ADDRESSES_PROVIDER.getPool());
        require(address(POOL) != address(0), "Invalid pool address");
    }

    // ============ External Functions ============

    /**
     * @notice Request a single-asset flash loan from Aave v3
     * @param asset Token address to borrow (e.g. WETH, USDC, DAI)
     * @param amount Amount to borrow in the token's smallest unit
     * @dev Entry point. Validates inputs, emits FlashLoanInitiated, then calls
     *      POOL.flashLoanSimple(address(this), asset, amount, "", 0). Aave transfers
     *      the funds and calls executeOperation() below.
     */
    function requestFlashLoan(address asset, uint256 amount) external onlyOwner {
        // --- implementation omitted in public showcase ---
        revert("omitted in public showcase");
    }

    /**
     * @notice Aave callback executed during the flash loan
     * @dev CRITICAL security invariants enforced in the full implementation:
     *      - msg.sender must be the Aave Pool
     *      - initiator must be this contract
     *      - borrowed balance must be received before use
     *      - custom strategy runs here (arbitrage / liquidation / MEV)
     *      - contract must hold amount + premium, then approve the Pool to pull it
     *      - returns true so Aave finalizes; reverts atomically on any shortfall
     * @return success Must return true for the loan to settle
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool success) {
        // --- implementation omitted in public showcase ---
        revert("omitted in public showcase");
    }

    // ============ Recovery / Views ============

    /// @notice Withdraw ERC20 tokens held by the contract to the owner
    function withdrawToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No balance to withdraw");
        IERC20(token).transfer(owner(), balance);
    }

    /// @notice Withdraw native ETH held by the contract to the owner
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH balance");
        payable(owner()).transfer(balance);
    }

    /// @notice Aave Pool address
    function getPool() external view returns (address) {
        return address(POOL);
    }

    /// @notice Aave PoolAddressesProvider address
    function getAddressesProvider() external view returns (address) {
        return address(ADDRESSES_PROVIDER);
    }

    receive() external payable {}
}
