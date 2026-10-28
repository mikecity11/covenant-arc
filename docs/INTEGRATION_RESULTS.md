# CovenantFactory Integration Results

**Important: these tests ran on a local fork of Arc Testnet (chain 5042002), NOT as live testnet transactions.**
The deployed factory bytecode at `0x10550cd1cea9854f9ac18018507479339875f8af` and the real Arc Testnet USDC (`0x3600…0000`) were
loaded into a local node. Test accounts were impersonated and funded by writing balances locally. Nothing was sent to the live
network, and the fork's vaults, transactions and time travel do not exist on Arc Testnet.

- Result: **31 passed, 0 failed, 0 skipped**
- Script: ran in the Arc Studio fork harness and is not included in this repository.

## Coverage
1. Factory: `token()==USDC`, `vaultCount`, `createVault` registers in `vaultsOf`, `isVault`, `allVaults` and `getVaults`, emits `VaultCreated`. Vault `owner()` and `token()` are correct. A second user gets a separate vault. Out-of-range `getVaults` returns an empty page.
2. Deposits: exact approve then `deposit` (owner 2000 + second depositor 1000 = 3000). Allowance is consumed. `Deposited` is emitted. `deposit(0)` reverts `ZeroAmount`. A deposit with no or insufficient allowance reverts.
3. Commitments: 1200 + 600 gives reserved 1800 and available 1200. 1201 reverts `InsufficientAvailable`. Non-owner reverts `NotOwner`. `ZeroAmount`, `DueInPast`, `InvalidRecipient` and `TextTooLong` are enforced.
4. Spend: 1500 reverts. 500 succeeds and available becomes 700. After the claim and release steps, spending available+1 reverts, spending exactly available succeeds, and one more unit then reverts.
5. Claim: reverts `NotDue` before the due date. After time travel the recipient's claim of 600 moves exactly 600 USDC. Vault balance and reserved each fall by 600 and available is unchanged. A duplicate claim reverts `NotOutstanding`. The owner and a stranger cannot claim (`NotRecipient`).
6. Release: `release(id,false)` reverts `ForfeitureNotConfirmed`. `release(id,true)` frees 1200, sends no USDC to the recipient (only gas leaves the recipient) and emits no USDC log. Owner and stranger cannot release.
7. Real USDC: `transferFrom`, `transfer` and `balanceOf` behave as expected with the vault. A direct transfer increases available without a `Deposited` event.

## Discrepancies and notes (none are contract bugs)
- **Gas is paid in USDC on Arc.** The native coin is the same balance as USDC (18-dp native = 6-dp ERC-20 x 1e12). Any sender's USDC balance
  delta therefore includes the gas fee. The tests assert exact deltas net of fee. Anyone calling `deposit` or `claim` on Arc pays gas out of the same USDC.
- `env.fund(..., 'usdc')` has no funding strategy for Arc Testnet. USDC was funded by setting the native balance, which the ERC-20 `balanceOf` mirrors.
- The fork used the public Arc RPC rather than the authenticated proxy. This does not affect the results.
- Test interpretation: "deposit 3000 from owner and a second depositor" was run as a 2000 + 1000 split totalling 3000.
