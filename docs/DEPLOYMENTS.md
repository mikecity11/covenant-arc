# Deployments and provenance

Covenant was implemented, tested and previewed in Arc Studio: https://studio.arc.io/app/6ef3bd13-376a-48ca-8fe6-15c9b5473bdf

The original build specification is preserved unchanged in `docs/BUILD_SPEC.md`. Its "Status" section describes the repository at the time it was written, before any contract or application existed.

## Arc Testnet (chain 5042002)

| Contract | Address | Deploy transaction |
| --- | --- | --- |
| CovenantFactory | `0x10550cd1cea9854f9ac18018507479339875f8af` | `0x3f221de18309eb51c749e8119f4f2efb55835c1a936a8049e9f46d8151980cf9` |

- Explorer: https://explorer.testnet.arc.io/address/0x10550cd1cea9854f9ac18018507479339875f8af
- Constructor argument: Arc Testnet USDC, `0x3600000000000000000000000000000000000000` (6 decimals).
- Checked onchain after deployment: `token()` returns the USDC address and `vaultCount()` returns 0.
- Deployed on 2026-10-28 using the Arc Studio testnet deployer. The factory has no owner, fee setting or admin functions.
- No vault has been created by Arc Studio on the live testnet. Individual vaults belong to whoever calls `createVault()`.

## Mainnet

None. Nothing is deployed to mainnet and no mainnet configuration exists.

## Verification summary

- Unit, fuzz and invariant tests: 88 passing (`docs/TEST_RESULTS.md`).
- Post-deploy integration tests: 31 passing on a local fork of Arc Testnet loaded with the deployed factory bytecode and the real USDC (`docs/INTEGRATION_RESULTS.md`). These were fork runs, not live testnet transactions.
- Static analysis and two independent review passes found no material issues. This is not an independent audit.

## Fees

Covenant charges no protocol fee: the contracts have no fee setting and no fee recipient. Network fees (gas, paid in USDC on Arc) apply to every transaction.
