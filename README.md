# Covenant

Protect what's promised. Spend what's free.

Covenant is a USDC treasury for small Web3 teams on Arc. Dated contributor commitments are fully funded and reserved inside the vault, so the owner can only spend what is truly available (balance minus reserved promises). This is an unaudited prototype configured for Arc mainnet with real USDC. Covenant charges no protocol fee; network fees apply.

Built with [Arc Studio](https://studio.arc.io)

Arc Studio project: https://studio.arc.io/app/6ef3bd13-376a-48ca-8fe6-15c9b5473bdf

Public repository: https://github.com/mikecity11/covenant-arc (the original build specification is preserved in `docs/BUILD_SPEC.md`).

## What is in the app

- Home, a detailed How it works guide with an interactive spending calculator, and an isolated demo that clearly labels its pretend balances.
- A treasury app at `/app`: overview, commitments (list, filter, create, detail), recipient claims and release, and an activity timeline with explorer links.
- Wallet connection with network checks, a two-step approve and deposit flow, transfer previews, and pending, confirmed and failed transaction states.

## Status

- Contracts written and tested: 88 Foundry unit, fuzz and invariant tests (`docs/TEST_RESULTS.md`) and 31 post-deploy integration tests run on a fork of Arc Testnet (`docs/INTEGRATION_RESULTS.md`). Reviewed with static analysis and two independent review passes. Not independently audited.
- The factory is deployed on Arc Testnet at `0x10550cd1cea9854f9ac18018507479339875f8af` (see `docs/DEPLOYMENTS.md`). This address belongs only to testnet and must not be used in the mainnet app. The mainnet app reads its factory from `VITE_COVENANT_MAINNET_FACTORY_ADDRESS`; without it, treasury creation is disabled and vaults can still be opened by address.
- Arc mainnet factory: `0x20e1b3a8ac9370339f22b77ab0e029748429ae16` (chain 5042). The user-signed deployment page reported a successful receipt, matching compiled runtime, and canonical USDC token. The production mainnet factory environment variable is configured. Deployment transaction hash still needs to be recorded from the user's explorer link. A real-USDC treasury deposit/payment flow still needs to be exercised before submission.

## Tech stack

React 18, Vite, TypeScript, Tailwind CSS, React Router, wagmi, viem, ConnectKit, Framer Motion. Solidity 0.8.28 with OpenZeppelin 5.6.1 and Foundry.

## Development

Prerequisites: [Bun](https://bun.sh) and [Foundry](https://book.getfoundry.sh).

```bash
bun install
forge install foundry-rs/forge-std   # test dependency, not committed
cp .env.example .env
bun run dev          # app on http://localhost:5173
bun run check        # lint and typecheck
bun run contracts:build
bun run contracts:test
```

### Environment variables

- `VITE_COVENANT_MAINNET_FACTORY_ADDRESS` (optional): address of a confirmed `CovenantFactory` on Arc mainnet. `.env.example` intentionally leaves it empty until a real mainnet deployment is verified. Without it, treasury creation stays disabled.

## Contracts

- `contracts/CovenantVault.sol`: one non-upgradeable vault per treasury with an immutable owner and USDC token.
- `contracts/CovenantFactory.sol`: creates and registers vaults for its immutable USDC token.
- `contracts/test/`: unit, fuzz and invariant tests, including reverting-token and reentrancy cases.
