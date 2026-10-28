// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {CovenantVaultTestBase} from "./CovenantVault.Base.t.sol";
import {CovenantVault} from "../CovenantVault.sol";

/// @dev Claims, spend, release, owner-cannot-alter, unsolicited transfers, views.
contract CovenantVaultLifecycleTest is CovenantVaultTestBase {
    uint256 internal id;

    function setUp() public override {
        super.setUp();
        _deposit(alice, 1000e6);
        id = _create(carol, 400e6, T0 + 1 days);
    }

    // ---------------------------------------------------------------- 5. claims
    function test_Claim_PreDueRevertsNotDue() public {
        vm.warp(T0 + 1 days - 1);
        assertFalse(vault.isClaimable(id));
        vm.prank(carol);
        vm.expectRevert(abi.encodeWithSelector(CovenantVault.NotDue.selector, uint64(T0 + 1 days)));
        vault.claim(id);
    }

    function test_Claim_AtExactlyDueAtSucceeds() public {
        vm.warp(T0 + 1 days);
        assertTrue(vault.isClaimable(id));
        _claim(carol, id);
        assertEq(usdc.balanceOf(carol), 400e6);
    }

    function test_Claim_RecipientReceivesExactAmountAndStatusUpdates() public {
        vm.warp(T0 + 5 days);
        _claim(carol, id);
        assertEq(usdc.balanceOf(carol), 400e6);
        assertEq(vault.balance(), 600e6);
        assertEq(vault.reserved(), 0);
        assertEq(vault.available(), 600e6);
        assertEq(uint8(vault.getCommitment(id).status), uint8(CovenantVault.Status.Claimed));
        assertFalse(vault.isClaimable(id));
    }

    function test_Claim_EmitsClaimedWithExactArgs() public {
        vm.warp(T0 + 1 days);
        vm.expectEmit(true, true, false, true, address(vault));
        emit CovenantVault.Claimed(id, carol, 400e6);
        _claim(carol, id);
    }

    function test_Claim_DuplicateRevertsNotOutstanding() public {
        vm.warp(T0 + 1 days);
        _claim(carol, id);
        vm.prank(carol);
        vm.expectRevert(CovenantVault.NotOutstanding.selector);
        vault.claim(id);
        assertEq(usdc.balanceOf(carol), 400e6);
    }

    function test_Claim_AfterReleaseReverts() public {
        _release(carol, id);
        vm.warp(T0 + 2 days);
        vm.prank(carol);
        vm.expectRevert(CovenantVault.NotOutstanding.selector);
        vault.claim(id);
        assertEq(usdc.balanceOf(carol), 0);
    }

    function test_Release_AfterClaimReverts() public {
        vm.warp(T0 + 2 days);
        _claim(carol, id);
        vm.prank(carol);
        vm.expectRevert(CovenantVault.NotOutstanding.selector);
        vault.release(id, true);
    }

    function test_Release_DuplicateReverts() public {
        _release(carol, id);
        vm.prank(carol);
        vm.expectRevert(CovenantVault.NotOutstanding.selector);
        vault.release(id, true);
    }

    // ---------------------------------------------------------------- 6. spend boundary
    function test_Spend_ExactlyAvailableSucceeds() public {
        assertEq(vault.available(), 600e6);
        vm.expectEmit(true, false, false, true, address(vault));
        emit CovenantVault.Spent(stranger, 600e6, "all free");
        vm.prank(owner);
        vault.spend(stranger, 600e6, "all free");
        assertEq(vault.available(), 0);
        assertEq(vault.reserved(), 400e6);
        assertEq(vault.balance(), 400e6);
        assertEq(usdc.balanceOf(stranger), 600e6);
    }

    function test_Spend_AvailablePlusOneReverts() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(CovenantVault.InsufficientAvailable.selector, 600e6 + 1, 600e6));
        vault.spend(stranger, 600e6 + 1, "");
        assertEq(vault.balance(), 1000e6);
    }

    function test_Spend_ReservedFundsNeverSpendableAfterExhausting() public {
        _spend(stranger, 600e6);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(CovenantVault.InsufficientAvailable.selector, 1, 0));
        vault.spend(stranger, 1, "");
        // recipient can still claim in full
        vm.warp(T0 + 1 days);
        _claim(carol, id);
        assertEq(usdc.balanceOf(carol), 400e6);
        assertEq(vault.balance(), 0);
    }

    // ---------------------------------------------------------------- 7. release
    function test_Release_RequiresConfirmation() public {
        vm.prank(carol);
        vm.expectRevert(CovenantVault.ForfeitureNotConfirmed.selector);
        vault.release(id, false);
        assertEq(vault.reserved(), 400e6);
        assertEq(uint8(vault.getCommitment(id).status), uint8(CovenantVault.Status.Outstanding));
    }

    function test_Release_BeforeDue() public {
        _assertReleaseEffects();
    }

    function test_Release_AfterDue() public {
        vm.warp(T0 + 10 days);
        _assertReleaseEffects();
    }

    function _assertReleaseEffects() internal {
        uint256 bal = vault.balance();
        uint256 avail = vault.available();
        vm.expectEmit(true, true, false, true, address(vault));
        emit CovenantVault.Released(id, carol, 400e6);
        _release(carol, id);
        assertEq(usdc.balanceOf(carol), 0, "no tokens to recipient");
        assertEq(vault.reserved(), 0);
        assertEq(vault.balance(), bal, "balance unchanged");
        assertEq(vault.available(), avail + 400e6);
        assertEq(uint8(vault.getCommitment(id).status), uint8(CovenantVault.Status.Released));
        assertFalse(vault.isClaimable(id));
    }

    function test_Release_OwnerCannotRelease() public {
        vm.prank(owner);
        vm.expectRevert(CovenantVault.NotRecipient.selector);
        vault.release(id, true);
    }

    function test_Release_OwnerCanSpendFreedFunds() public {
        _release(carol, id);
        _spend(stranger, 1000e6);
        assertEq(usdc.balanceOf(stranger), 1000e6);
        assertEq(vault.balance(), 0);
        assertEq(vault.reserved(), 0);
    }

    // ---------------------------------------------------------------- 8. owner cannot cancel/alter
    function test_OwnerCannotCancelOrAlter() public {
        bytes[6] memory calls = [
            abi.encodeWithSignature("cancel(uint256)", id),
            abi.encodeWithSignature("setOwner(address)", owner),
            abi.encodeWithSignature("sweep(address)", owner),
            abi.encodeWithSignature("withdraw(uint256)", uint256(1000e6)),
            abi.encodeWithSignature("approve(address,uint256)", owner, type(uint256).max),
            abi.encodeWithSignature("execute(address,bytes)", address(usdc), hex"")
        ];
        for (uint256 i; i < calls.length; ++i) {
            vm.prank(owner);
            (bool ok,) = address(vault).call(calls[i]);
            assertFalse(ok, "plausible admin selector must fail");
        }
        assertEq(vault.reserved(), 400e6);
        assertEq(vault.balance(), 1000e6);
        assertEq(vault.owner(), owner);
        assertEq(usdc.allowance(address(vault), owner), 0);
    }

    function test_NativeEthSendsRevert() public {
        vm.deal(owner, 10 ether);
        vm.deal(alice, 10 ether);
        vm.prank(owner);
        (bool ok1,) = address(vault).call{value: 1 ether}("");
        assertFalse(ok1);
        vm.prank(alice);
        (bool ok2,) = address(vault).call{value: 1 ether}(hex"deadbeef");
        assertFalse(ok2);
        vm.prank(alice);
        (bool ok3,) = address(vault).call{value: 1 ether}(abi.encodeCall(vault.deposit, (1e6)));
        assertFalse(ok3);
        assertEq(address(vault).balance, 0);
    }

    // ---------------------------------------------------------------- 11. unsolicited transfers & views
    function test_UnsolicitedTransferRaisesBalanceAndAvailable() public {
        vm.prank(bob);
        usdc.transfer(address(vault), 77e6);
        assertEq(vault.balance(), 1077e6);
        assertEq(vault.reserved(), 400e6);
        assertEq(vault.available(), 677e6);
        _spend(stranger, 677e6);
        assertEq(vault.available(), 0);
    }

    function test_Pagination_GetCommitments() public {
        _create(dave, 1e6, T0 + 1);
        _create(carol, 2e6, T0 + 2);
        _create(dave, 3e6, T0 + 3);
        _create(bob, 4e6, T0 + 4); // ids 0..4
        assertEq(vault.commitmentCount(), 5);

        assertEq(vault.getCommitments(5, 3).length, 0, "start == length");
        assertEq(vault.getCommitments(100, 3).length, 0, "start beyond");
        assertEq(vault.getCommitments(0, 0).length, 0, "count 0");
        assertEq(vault.getCommitments(0, 2).length, 2);
        assertEq(vault.getCommitments(0, 5).length, 5);

        CovenantVault.Commitment[] memory page = vault.getCommitments(3, 100);
        assertEq(page.length, 2, "clamped");
        assertEq(page[0].amount, 3e6);
        assertEq(page[1].amount, 4e6);
        assertEq(page[1].recipient, bob);

        assertEq(vault.getCommitments(4, type(uint256).max).length, 1, "no overflow");
        assertEq(vault.getCommitments(0, type(uint256).max).length, 5);
    }

    function test_CommitmentIdsOfIncludesCompleted() public {
        _create(carol, 1e6, T0); // id 1
        _create(dave, 1e6, T0); // id 2
        _create(carol, 1e6, T0); // id 3
        _claim(carol, 3);
        _release(carol, id); // id 0
        uint256[] memory ids = vault.commitmentIdsOf(carol);
        assertEq(ids.length, 3);
        assertEq(ids[0], 0);
        assertEq(ids[1], 1);
        assertEq(ids[2], 3);
        assertEq(vault.commitmentIdsOf(dave).length, 1);
        assertEq(vault.commitmentIdsOf(stranger).length, 0);
    }

    function test_IsClaimable_States() public {
        assertFalse(vault.isClaimable(id), "not due");
        assertFalse(vault.isClaimable(12345), "unknown");
        vm.warp(T0 + 1 days);
        assertTrue(vault.isClaimable(id), "due");
        _claim(carol, id);
        assertFalse(vault.isClaimable(id), "claimed");
    }
}
