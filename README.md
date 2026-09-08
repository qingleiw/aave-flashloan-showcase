# Aave v3 Flash Loan Contract — Public Showcase

Production Aave v3 flash-loan contract in Solidity. A version of this contract was
built and **deployed to Ethereum mainnet for a client**. This repository is a
**public showcase**: the two core function bodies are omitted and it is published
for evaluation only, not for reuse (see LICENSE). The full implementation, the
Hardhat project, and the test suite are shared under engagement.

## What this demonstrates

- **Aave v3 integration** via `IFlashLoanSimpleReceiver` (single-asset `flashLoanSimple`)
- **Automatic repayment safety**: the transaction reverts if principal + premium is not repayable
- **Comprehensive event tracking**: distinct events for initiation, custom action, and successful repayment, so an off-chain indexer can reconstruct every loan
- **Access control & guards**: owner-only entry, Aave-Pool-only callback, initiator and balance checks
- **Tested against a mainnet fork** (~95% coverage in the full project)
- **Clean extension surface** for arbitrage / liquidation / MEV strategies

## Architecture

1. Owner calls `requestFlashLoan(asset, amount)`
2. Aave Pool transfers the funds and calls `executeOperation(...)`
3. Custom strategy logic runs inside the loan
4. Contract approves `amount + premium`; Aave pulls repayment
5. Transaction reverts atomically on any shortfall

## Note on scope

The published `FlashLoan.sol` keeps the full interface, state, events, constructor,
NatSpec and security checks. The bodies of `requestFlashLoan` and `executeOperation`
are replaced with a placeholder so the showcase cannot be deployed as-is. Ask for a
walkthrough or a screen-share of the running test suite.

## License

Proprietary — All Rights Reserved. See LICENSE.
