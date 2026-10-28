# Covenant

> Built with Arc Studio. Project memory for future agents.

Studio project: https://studio.arc.io/app/6ef3bd13-376a-48ca-8fe6-15c9b5473bdf
Public repo: https://github.com/mikecity11/covenant-arc (cloned into `covenant-arc/`; its spec is mirrored at `docs/BUILD_SPEC.md`, preserve it).

## What this app does

USDC treasury for small Web3 teams on Arc. Fully funded dated commitments are reserved in a vault; the owner can only spend balance minus reserves. Recipients claim after the due date (own transaction) or voluntarily release (forfeit).

## Deployment status (update when this changes)

- CovenantFactory: deployed on Arc Testnet at 0x10550cd1cea9854f9ac18018507479339875f8af (tx 0x3f221de18309eb51c749e8119f4f2efb55835c1a936a8049e9f46d8151980cf9), constructed with Arc Testnet USDC. Configured via `VITE_COVENANT_FACTORY_ADDRESS` in `.env`. Details in `docs/DEPLOYMENTS.md`.
- Integration tests ran on a fork of Arc Testnet, not live. No live vault has been exercised by the agent (no signing wallet is available without Circle credentials).
- Vaults are created by users via the factory. None exists from Arc Studio.
- Mainnet: not configured and not to be deployed by Arc Studio.

## Key decisions

- Arc USDC is the ERC-20 at 0x3600...0000 (6 decimals, from `@/onchain-facts`), a Circle FiatToken behind an upgradeable proxy (issuer can pause or blocklist). The vault only uses the ERC-20 view, never msg.value (native is 18 decimals).
- Vault has immutable owner and token, no cancel/edit/sweep/approve/upgrade/arbitrary call. Unsolicited transfers become available funds.
- Log scanning: the RPC rejects ranges around 10,000 blocks, so activity uses 5,000-block windows with a bounded lookback and a "Load older" button. Creation block is stored in localStorage for vaults created in-app.
- The `/demo` page and the calculator use `src/lib/ledger.ts` (pure bigint) and are labelled as simulations. They never read the chain.

## Dev server (important)

Run Vite as `node node_modules/.bin/vite --host 0.0.0.0 --port 5173 --strictPort`. Plain `vite` / `bun run dev` binds only the IPv6 loopback in this sandbox, so the Studio preview cannot load the CSS and JS reliably (unstyled white page). The nested `covenant-arc/` checkout is excluded from Vite's watcher and dependency scan and from oxlint.

## Layout

- `contracts/` Solidity + `contracts/test/` Foundry tests. `docs/TEST_RESULTS.md` has the latest run.
- `src/lib/` abi, deployment facts, ledger math, formatting, error mapping. `src/hooks/` chain reads, tx lifecycle, treasury selection.
- `src/pages/` Home, HowItWorks, Demo; `src/pages/app/` dashboard routes. `src/components/` shared UI.

## Tech stack

React 18, Vite, TypeScript, Tailwind, React Router, wagmi v2, viem, ConnectKit, Framer Motion. Foundry + OpenZeppelin 5.6.1.

## To run

```bash
bun install && bun run dev
bun run check
forge test
```
