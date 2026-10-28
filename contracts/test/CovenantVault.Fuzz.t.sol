// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {CovenantVaultTestBase} from "./CovenantVault.Base.t.sol";
import {CovenantVault} from "../CovenantVault.sol";

/// @dev Interleaved sequences (scenario 9) and fuzz properties.
contract CovenantVaultFuzzTest is CovenantVaultTestBase {
    function _checkAll() internal view {
        _assertConsistent();
        assertEq(vault.reserved(), _sumStatus(CovenantVault.Status.Outstanding), "reserved == sum outstanding");
    }

    function test_Interleaved_MixedSequence() public {
        _deposit(alice, 2000e6);
        _checkAll();
        _deposit(bob, 1000e6);
        _checkAll();

        uint256 a = _create(carol, 800e6, T0 + 1 days);
        _checkAll();
        uint256 b = _create(dave, 500e6, T0 + 3 days);
        _checkAll();
        uint256 c = _create(carol, 700e6, T0 + 2 days);
        _checkAll();
        assertEq(vault.available(), 1000e6);

        _spend(stranger, 400e6);
        _checkAll();
        _release(dave, b); // frees 500 before due
        _checkAll();
        assertEq(vault.available(), 1100e6);

        vm.warp(T0 + 1 days);
        _claim(carol, a);
        _checkAll();
        assertEq(vault.balance(), 1800e6);

        uint256 d = _create(bob, 1100e6, T0 + 5 days); // uses all available
        _checkAll();
        assertEq(vault.available(), 0);

        vm.warp(T0 + 2 days);
        _claim(carol, c);
        _checkAll();

        _deposit(alice, 50e6);
        _checkAll();
        _spend(owner, 50e6);
        _checkAll();

        vm.warp(T0 + 6 days);
        _release(bob, d);
        _checkAll();
        _spend(stranger, vault.available());
        _checkAll();

        assertEq(vault.reserved(), 0);
        assertEq(vault.balance(), 0);
        assertEq(usdc.balanceOf(carol), 1500e6);
        assertEq(usdc.balanceOf(dave), 0);
        assertEq(usdc.balanceOf(bob), FUND - 1000e6);
    }

    function testFuzz_SpendSucceedsIffWithinAvailable(uint256 dep, uint256 commit, uint256 spendAmt) public {
        dep = bound(dep, 1, 500_000e6);
        commit = bound(commit, 0, dep);
        spendAmt = bound(spendAmt, 1, 2 * dep + 1);

        _deposit(alice, dep);
        if (commit > 0) _create(carol, commit, T0 + 1 days);
        uint256 avail = dep - commit;
        assertEq(vault.available(), avail);

        vm.prank(owner);
        if (spendAmt <= avail) {
            vault.spend(stranger, spendAmt, "");
            assertEq(vault.available(), avail - spendAmt);
            assertEq(usdc.balanceOf(stranger), spendAmt);
        } else {
            vm.expectRevert(abi.encodeWithSelector(CovenantVault.InsufficientAvailable.selector, spendAmt, avail));
            vault.spend(stranger, spendAmt, "");
        }
        assertEq(vault.reserved(), commit, "reserved intact");
        _assertConsistent();
    }

    function testFuzz_CommitmentsNeverExceedBalance(uint256 dep, uint256[8] memory amounts) public {
        dep = bound(dep, 1, 100_000e6);
        _deposit(alice, dep);
        uint256 expectedReserved;
        for (uint256 i; i < amounts.length; ++i) {
            uint256 amt = bound(amounts[i], 1, dep);
            vm.prank(owner);
            if (amt <= dep - expectedReserved) {
                vault.createCommitment(carol, amt, uint64(T0 + 1 + i), "");
                expectedReserved += amt;
            } else {
                vm.expectRevert(
                    abi.encodeWithSelector(CovenantVault.InsufficientAvailable.selector, amt, dep - expectedReserved)
                );
                vault.createCommitment(carol, amt, uint64(T0 + 1 + i), "");
            }
            assertEq(vault.reserved(), expectedReserved);
            _checkAll();
        }
    }

    function testFuzz_ClaimPaysExactAmountAndPreservesAvailable(uint256 dep, uint256 amt, uint256 extra) public {
        dep = bound(dep, 1, 500_000e6);
        amt = bound(amt, 1, dep);
        extra = bound(extra, 0, 1000 days);
        _deposit(alice, dep);
        uint256 id = _create(carol, amt, T0 + 1 days);
        uint256 availBefore = vault.available();
        vm.warp(T0 + 1 days + extra);
        _claim(carol, id);
        assertEq(usdc.balanceOf(carol), amt);
        assertEq(vault.available(), availBefore);
        assertEq(vault.balance(), dep - amt);
        assertEq(vault.reserved(), 0);
    }

    function testFuzz_ReleaseFreesExactlyAmount(uint256 dep, uint256 amt, bool afterDue) public {
        dep = bound(dep, 1, 500_000e6);
        amt = bound(amt, 1, dep);
        _deposit(alice, dep);
        uint256 id = _create(carol, amt, T0 + 1 days);
        if (afterDue) vm.warp(T0 + 2 days);
        _release(carol, id);
        assertEq(usdc.balanceOf(carol), 0);
        assertEq(vault.balance(), dep);
        assertEq(vault.available(), dep);
    }

    function testFuzz_ClaimBeforeDueAlwaysReverts(uint256 dueDelta, uint256 early) public {
        dueDelta = bound(dueDelta, 1, 3650 days);
        early = bound(early, 1, dueDelta);
        _deposit(alice, 10e6);
        uint256 id = _create(carol, 10e6, T0 + dueDelta);
        vm.warp(T0 + dueDelta - early);
        vm.prank(carol);
        vm.expectRevert(abi.encodeWithSelector(CovenantVault.NotDue.selector, uint64(T0 + dueDelta)));
        vault.claim(id);
    }

    function testFuzz_UnsolicitedTransfersAddToAvailable(uint256 dep, uint256 gift) public {
        dep = bound(dep, 1, 100_000e6);
        gift = bound(gift, 0, 100_000e6);
        _deposit(alice, dep);
        _create(carol, dep, T0);
        vm.prank(bob);
        usdc.transfer(address(vault), gift);
        assertEq(vault.available(), gift);
        assertEq(vault.balance(), dep + gift);
    }
}
