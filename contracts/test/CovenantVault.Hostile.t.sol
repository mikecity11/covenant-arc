// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {CovenantVault} from "../CovenantVault.sol";
import {ToggleToken, FeeToken, FalseToken, ReentrantToken, MockERC20} from "./Mocks.sol";

/// @dev Hostile / non-standard token behaviour (scenario 10).
contract CovenantVaultHostileTest is Test {
    uint256 internal constant T0 = 1_700_000_000;
    address internal owner = makeAddr("owner");
    address internal alice = makeAddr("alice");
    address internal carol = makeAddr("carol");
    address internal stranger = makeAddr("stranger");

    function setUp() public {
        vm.warp(T0);
    }

    function _fund(MockERC20 t, CovenantVault v, address who, uint256 amt) internal {
        t.mint(who, amt);
        vm.prank(who);
        t.approve(address(v), type(uint256).max);
    }

    // ---------------------------------------------------------------- reverting transfer
    function test_RevertingToken_ClaimRevertsAndStateUnchanged() public {
        ToggleToken t = new ToggleToken();
        CovenantVault v = new CovenantVault(address(t), owner);
        _fund(t, v, alice, 1000e6);
        vm.prank(alice);
        v.deposit(1000e6);
        vm.prank(owner);
        v.createCommitment(carol, 400e6, uint64(T0 + 1), "");
        vm.warp(T0 + 1);

        t.setFail(true);
        vm.prank(carol);
        vm.expectRevert(bytes("transfer disabled"));
        v.claim(0);
        assertEq(v.reserved(), 400e6, "reserved unchanged");
        assertEq(uint8(v.getCommitment(0).status), uint8(CovenantVault.Status.Outstanding));
        assertTrue(v.isClaimable(0));
        assertEq(v.balance(), 1000e6);

        t.setFail(false);
        vm.prank(carol);
        v.claim(0);
        assertEq(t.balanceOf(carol), 400e6);
        assertEq(v.reserved(), 0);
        assertEq(uint8(v.getCommitment(0).status), uint8(CovenantVault.Status.Claimed));
    }

    function test_RevertingToken_SpendRevertsAndStateUnchanged() public {
        ToggleToken t = new ToggleToken();
        CovenantVault v = new CovenantVault(address(t), owner);
        _fund(t, v, alice, 1000e6);
        vm.prank(alice);
        v.deposit(1000e6);
        t.setFail(true);
        vm.prank(owner);
        vm.expectRevert(bytes("transfer disabled"));
        v.spend(stranger, 100e6, "");
        assertEq(v.balance(), 1000e6);
        assertEq(t.balanceOf(stranger), 0);
    }

    // ---------------------------------------------------------------- false-returning transfer
    function test_FalseReturningToken_ClaimRevertsViaSafeERC20() public {
        FalseToken t = new FalseToken();
        CovenantVault v = new CovenantVault(address(t), owner);
        _fund(t, v, alice, 1000e6);
        vm.prank(alice);
        v.deposit(1000e6);
        vm.prank(owner);
        v.createCommitment(carol, 400e6, uint64(T0), "");

        t.setReturnFalse(true);
        vm.prank(carol);
        vm.expectRevert(abi.encodeWithSelector(SafeERC20.SafeERC20FailedOperation.selector, address(t)));
        v.claim(0);
        assertEq(v.reserved(), 400e6);
        assertEq(uint8(v.getCommitment(0).status), uint8(CovenantVault.Status.Outstanding));

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(SafeERC20.SafeERC20FailedOperation.selector, address(t)));
        v.spend(stranger, 100e6, "");

        t.setReturnFalse(false);
        vm.prank(carol);
        v.claim(0);
        assertEq(t.balanceOf(carol), 400e6);
    }

    // ---------------------------------------------------------------- fee-on-transfer
    function test_FeeOnTransfer_DepositRevertsUnexpectedAmount() public {
        FeeToken t = new FeeToken();
        CovenantVault v = new CovenantVault(address(t), owner);
        _fund(t, v, alice, 1000e6);
        vm.prank(alice);
        vm.expectRevert(CovenantVault.UnexpectedTransferAmount.selector);
        v.deposit(1000e6);
        assertEq(v.balance(), 0);
        assertEq(t.balanceOf(alice), 1000e6);
    }

    // ---------------------------------------------------------------- reentrancy
    /// @dev Builds a vault over a ReentrantToken, funded with 1000e6, with a 400e6 commitment to carol (id 0).
    function _reentrantSetup(bool tokenIsOwner) internal returns (ReentrantToken rt, CovenantVault v) {
        rt = new ReentrantToken();
        v = new CovenantVault(address(rt), tokenIsOwner ? address(rt) : owner);
        _fund(rt, v, alice, 1000e6);
        vm.prank(alice);
        v.deposit(1000e6);
        bytes memory create = abi.encodeCall(v.createCommitment, (carol, 400e6, uint64(T0 + 1), ""));
        if (tokenIsOwner) {
            rt.exec(address(v), create);
        } else {
            vm.prank(owner);
            v.createCommitment(carol, 400e6, uint64(T0 + 1), "");
        }
        vm.warp(T0 + 1);
    }

    function _assertClaimedCleanly(ReentrantToken rt, CovenantVault v) internal view {
        assertEq(rt.attempts(), 1, "one re-entry attempt");
        assertEq(rt.blockedCount(), 1, "re-entry blocked by guard");
        assertEq(rt.succeededCount(), 0, "re-entry never succeeded");
        assertEq(rt.balanceOf(carol), 400e6);
        assertEq(v.balance(), 600e6);
        assertEq(v.reserved(), 0);
        assertEq(uint8(v.getCommitment(0).status), uint8(CovenantVault.Status.Claimed));
    }

    function test_Reentrancy_ClaimDuringClaimBlocked() public {
        (ReentrantToken rt, CovenantVault v) = _reentrantSetup(false);
        rt.configure(address(v), ReentrantToken.Attack.Claim);
        vm.prank(carol);
        v.claim(0);
        _assertClaimedCleanly(rt, v);
    }

    function test_Reentrancy_ReleaseDuringClaimBlocked() public {
        (ReentrantToken rt, CovenantVault v) = _reentrantSetup(false);
        rt.configure(address(v), ReentrantToken.Attack.Release);
        vm.prank(carol);
        v.claim(0);
        _assertClaimedCleanly(rt, v);
    }

    function test_Reentrancy_DepositDuringClaimBlocked() public {
        (ReentrantToken rt, CovenantVault v) = _reentrantSetup(false);
        rt.configure(address(v), ReentrantToken.Attack.Deposit);
        vm.prank(carol);
        v.claim(0);
        _assertClaimedCleanly(rt, v);
    }

    function test_Reentrancy_SpendDuringClaimBlocked() public {
        (ReentrantToken rt, CovenantVault v) = _reentrantSetup(true); // token is the owner
        rt.configure(address(v), ReentrantToken.Attack.Spend);
        vm.prank(carol);
        v.claim(0);
        _assertClaimedCleanly(rt, v);
    }

    function test_Reentrancy_CreateCommitmentDuringClaimBlocked() public {
        (ReentrantToken rt, CovenantVault v) = _reentrantSetup(true);
        rt.configure(address(v), ReentrantToken.Attack.CreateCommitment);
        vm.prank(carol);
        v.claim(0);
        _assertClaimedCleanly(rt, v);
        assertEq(v.nextId(), 1, "no extra commitment created");
    }

    function test_Reentrancy_SpendDuringSpendBlocked() public {
        (ReentrantToken rt, CovenantVault v) = _reentrantSetup(true);
        rt.configure(address(v), ReentrantToken.Attack.Spend);
        rt.exec(address(v), abi.encodeCall(v.spend, (stranger, 200e6, "")));
        assertEq(rt.attempts(), 1);
        assertEq(rt.blockedCount(), 1);
        assertEq(rt.succeededCount(), 0);
        assertEq(rt.balanceOf(stranger), 200e6);
        assertEq(v.balance(), 800e6);
        assertEq(v.reserved(), 400e6);
        assertEq(v.available(), 400e6);
    }

    function test_Reentrancy_CreateCommitmentDuringSpendBlocked() public {
        (ReentrantToken rt, CovenantVault v) = _reentrantSetup(true);
        rt.configure(address(v), ReentrantToken.Attack.CreateCommitment);
        rt.exec(address(v), abi.encodeCall(v.spend, (stranger, 200e6, "")));
        assertEq(rt.attempts(), 1);
        assertEq(rt.blockedCount(), 1);
        assertEq(v.nextId(), 1);
        assertEq(v.reserved(), 400e6);
        assertEq(v.balance(), 800e6);
    }

    function test_Reentrancy_DepositDuringDepositBlocked() public {
        (ReentrantToken rt, CovenantVault v) = _reentrantSetup(false);
        rt.mint(alice, 100e6);
        rt.configure(address(v), ReentrantToken.Attack.Deposit);
        vm.prank(alice);
        v.deposit(100e6);
        assertEq(rt.attempts(), 1);
        assertEq(rt.blockedCount(), 1);
        assertEq(rt.succeededCount(), 0);
        assertEq(v.balance(), 1100e6, "exactly one deposit counted");
        assertEq(v.reserved(), 400e6);
    }

    function test_Reentrancy_ClaimDuringDepositBlocked() public {
        (ReentrantToken rt, CovenantVault v) = _reentrantSetup(false);
        rt.mint(alice, 100e6);
        rt.configure(address(v), ReentrantToken.Attack.Claim);
        vm.prank(alice);
        v.deposit(100e6);
        assertEq(rt.blockedCount(), 1);
        assertEq(v.balance(), 1100e6);
        assertEq(v.reserved(), 400e6);
        assertEq(uint8(v.getCommitment(0).status), uint8(CovenantVault.Status.Outstanding));
    }

    // ---------------------------------------------------------------- external balance reduction
    function test_ExternalBalanceReduction_AvailableSaturatesAtZero() public {
        MockERC20 t = new MockERC20();
        CovenantVault v = new CovenantVault(address(t), owner);
        _fund(t, v, alice, 1000e6);
        vm.prank(alice);
        v.deposit(1000e6);
        vm.prank(owner);
        v.createCommitment(carol, 600e6, uint64(T0), "");

        t.burnFrom_(address(v), 700e6); // balance 300 < reserved 600
        assertEq(v.balance(), 300e6);
        assertEq(v.reserved(), 600e6);
        assertEq(v.available(), 0, "saturates, no underflow");
        assertFalse(v.getCommitments(0, 10).length == 0);
        assertTrue(v.isClaimable(0));

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(CovenantVault.InsufficientAvailable.selector, 1, 0));
        v.spend(stranger, 1, "");
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(CovenantVault.InsufficientAvailable.selector, 1, 0));
        v.createCommitment(carol, 1, uint64(T0), "");

        // claim cannot be paid in full: reverts atomically and keeps the commitment Outstanding
        vm.prank(carol);
        vm.expectRevert(
            abi.encodeWithSelector(IERC20Errors.ERC20InsufficientBalance.selector, address(v), 300e6, 600e6)
        );
        v.claim(0);
        assertEq(v.reserved(), 600e6);

        // release still works and restores solvency
        vm.prank(carol);
        v.release(0, true);
        assertEq(v.reserved(), 0);
        assertEq(v.available(), 300e6);
    }

    function test_ExternalBalanceReduction_ToZero() public {
        MockERC20 t = new MockERC20();
        CovenantVault v = new CovenantVault(address(t), owner);
        _fund(t, v, alice, 100e6);
        vm.prank(alice);
        v.deposit(100e6);
        vm.prank(owner);
        v.createCommitment(carol, 100e6, uint64(T0), "");
        t.burnFrom_(address(v), 100e6);
        assertEq(v.balance(), 0);
        assertEq(v.available(), 0);
        assertEq(v.reserved(), 100e6);
    }
}
