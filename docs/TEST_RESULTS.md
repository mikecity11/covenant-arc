# Covenant Test Results

**Result: 88 passed, 0 failed, 0 skipped** (6 suites)

## Command

```bash
cd /home/user/app && forge test -vv
```

(Foundry, solc 0.8.28, evm cancun, default fuzz runs 256, invariant runs 256 x depth 500 — 128,000 handler calls per invariant, 0 reverts.)

## Files

- contracts/test/Mocks.sol — MockERC20 (6 dec, public mint), MockDecimals, NoDecimals, ToggleToken (transfer reverts), FeeToken (1% burn), FalseToken (transfer returns false), ReentrantToken (re-enters claim/release/spend/deposit/createCommitment via try/catch, records blocked count)
- contracts/test/CovenantVault.Base.t.sol — shared setup/helpers (no tests)
- contracts/test/CovenantVault.Core.t.sol — worked example, overcommit, unauthorized, validation
- contracts/test/CovenantVault.Lifecycle.t.sol — claims, spend boundary, release, owner-cannot-alter, ETH rejection, unsolicited transfers, pagination, views
- contracts/test/CovenantVault.Hostile.t.sol — reverting/false/fee tokens, reentrancy, external balance reduction
- contracts/test/CovenantVault.Fuzz.t.sol — interleaved sequence + fuzz properties
- contracts/test/CovenantVault.Invariant.t.sol — handler + 4 invariants
- contracts/test/CovenantFactory.t.sol — factory

## Tests

### CovenantVault.Hostile.t.sol (15 tests)
- PASS test_ExternalBalanceReduction_AvailableSaturatesAtZero()
- PASS test_ExternalBalanceReduction_ToZero()
- PASS test_FalseReturningToken_ClaimRevertsViaSafeERC20()
- PASS test_FeeOnTransfer_DepositRevertsUnexpectedAmount()
- PASS test_Reentrancy_ClaimDuringClaimBlocked()
- PASS test_Reentrancy_ClaimDuringDepositBlocked()
- PASS test_Reentrancy_CreateCommitmentDuringClaimBlocked()
- PASS test_Reentrancy_CreateCommitmentDuringSpendBlocked()
- PASS test_Reentrancy_DepositDuringClaimBlocked()
- PASS test_Reentrancy_DepositDuringDepositBlocked()
- PASS test_Reentrancy_ReleaseDuringClaimBlocked()
- PASS test_Reentrancy_SpendDuringClaimBlocked()
- PASS test_Reentrancy_SpendDuringSpendBlocked()
- PASS test_RevertingToken_ClaimRevertsAndStateUnchanged()
- PASS test_RevertingToken_SpendRevertsAndStateUnchanged()

### CovenantVault.Core.t.sol (26 tests)
- PASS test_Constructor_StoresImmutables()
- PASS test_CreateCommitment_StoresTermsAndEmits()
- PASS test_Deposit_EmitsEventAndMovesFunds()
- PASS test_Overcommit_AboveAvailableReverts()
- PASS test_Overcommit_ExactlyAvailableSucceeds()
- PASS test_Overcommit_ManyCallsNeverExceedBalance()
- PASS test_Overcommit_SecondBeyondRemainingReverts()
- PASS test_Unauthorized_NonOwnerCreateReverts()
- PASS test_Unauthorized_NonOwnerSpendReverts()
- PASS test_Unauthorized_NonRecipientClaimAndReleaseRevert()
- PASS test_Unauthorized_UnknownIdReverts()
- PASS test_Validation_AmountAboveUint128()
- PASS test_Validation_ConstructorNonContractToken()
- PASS test_Validation_ConstructorZeroOwner()
- PASS test_Validation_ConstructorZeroToken()
- PASS test_Validation_DepositZero()
- PASS test_Validation_DescriptionTooLong()
- PASS test_Validation_PastDueAt()
- PASS test_Validation_RecipientIsVault()
- PASS test_Validation_SpendMemoTooLong()
- PASS test_Validation_SpendToVault()
- PASS test_Validation_SpendToZero()
- PASS test_Validation_SpendZeroAmount()
- PASS test_Validation_ZeroAmountCommitment()
- PASS test_Validation_ZeroRecipient()
- PASS test_WorkedExample()

### CovenantVault.Lifecycle.t.sol (22 tests)
- PASS test_Claim_AfterReleaseReverts()
- PASS test_Claim_AtExactlyDueAtSucceeds()
- PASS test_Claim_DuplicateRevertsNotOutstanding()
- PASS test_Claim_EmitsClaimedWithExactArgs()
- PASS test_Claim_PreDueRevertsNotDue()
- PASS test_Claim_RecipientReceivesExactAmountAndStatusUpdates()
- PASS test_CommitmentIdsOfIncludesCompleted()
- PASS test_IsClaimable_States()
- PASS test_NativeEthSendsRevert()
- PASS test_OwnerCannotCancelOrAlter()
- PASS test_Pagination_GetCommitments()
- PASS test_Release_AfterClaimReverts()
- PASS test_Release_AfterDue()
- PASS test_Release_BeforeDue()
- PASS test_Release_DuplicateReverts()
- PASS test_Release_OwnerCanSpendFreedFunds()
- PASS test_Release_OwnerCannotRelease()
- PASS test_Release_RequiresConfirmation()
- PASS test_Spend_AvailablePlusOneReverts()
- PASS test_Spend_ExactlyAvailableSucceeds()
- PASS test_Spend_ReservedFundsNeverSpendableAfterExhausting()
- PASS test_UnsolicitedTransferRaisesBalanceAndAvailable()

### CovenantFactory.t.sol (14 tests)
- PASS testFuzz_GetVaults_LengthIsClamped(uint8,uint256,uint256) (fuzz runs: 256)
- PASS test_Constructor_AcceptsAny6DecimalToken()
- PASS test_Constructor_RejectsContractWithoutDecimals()
- PASS test_Constructor_RejectsNon6Decimals()
- PASS test_Constructor_RejectsNonContract()
- PASS test_Constructor_StoresToken()
- PASS test_CreateVault_DeploysOwnedVaultAndRegisters()
- PASS test_CreateVault_DifferentCallersGetDistinctVaults()
- PASS test_CreateVault_EmitsVaultCreated()
- PASS test_CreateVault_SameCallerMultipleVaults()
- PASS test_CreatedVault_IsFunctional()
- PASS test_GetVaults_EmptyRegistry()
- PASS test_GetVaults_Pagination()
- PASS test_IsVault_FalseForForeignAddresses()

### CovenantVault.Fuzz.t.sol (7 tests)
- PASS testFuzz_ClaimBeforeDueAlwaysReverts(uint256,uint256) (fuzz runs: 256)
- PASS testFuzz_ClaimPaysExactAmountAndPreservesAvailable(uint256,uint256,uint256) (fuzz runs: 256)
- PASS testFuzz_CommitmentsNeverExceedBalance(uint256,uint256[8]) (fuzz runs: 256)
- PASS testFuzz_ReleaseFreesExactlyAmount(uint256,uint256,bool) (fuzz runs: 256)
- PASS testFuzz_SpendSucceedsIffWithinAvailable(uint256,uint256,uint256) (fuzz runs: 256)
- PASS testFuzz_UnsolicitedTransfersAddToAvailable(uint256,uint256) (fuzz runs: 256)
- PASS test_Interleaved_MixedSequence()

### CovenantVault.Invariant.t.sol (4 tests)
- PASS invariant_AvailableEqualsBalanceMinusReserved() (runs: 256, calls: 128000, reverts: 0)
- PASS invariant_BalanceCoversReserved() (runs: 256, calls: 128000, reverts: 0)
- PASS invariant_BalanceMatchesFlows() (runs: 256, calls: 128000, reverts: 0)
- PASS invariant_ReservedEqualsSumOfOutstanding() (runs: 256, calls: 128000, reverts: 0)
Ran 6 test suites in 111.52s (223.07s CPU time): 88 tests passed, 0 failed, 0 skipped (88 total tests)

## Suspected contract bugs

None found. Notes:
- `spend`'s post-transfer `ReserveBreached` check is unreachable with well-behaved or tested hostile tokens (not covered).
- `createCommitment`/`spend` check `onlyOwner` before `nonReentrant`, so a non-owner re-entry yields `NotOwner`; reentrancy on owner-only functions was tested with the token set as vault owner and is blocked by the guard.
- Claim with a token that seizes/burns vault balance below reserves reverts (token error) and keeps the commitment Outstanding; release remains possible (by design).
