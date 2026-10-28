// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {CovenantVaultTestBase} from "./CovenantVault.Base.t.sol";
import {CovenantVault} from "../CovenantVault.sol";

/// @dev Worked example, overcommit, unauthorized, validation.
contract CovenantVaultCoreTest is CovenantVaultTestBase {
    // ---------------------------------------------------------------- 1. worked example
    function test_WorkedExample() public {
        _deposit(alice, 1500e6);
        _deposit(bob, 1500e6);
        uint256 idCarol = _create(carol, 1200e6, T0 + 1 days);
        uint256 idDave = _create(dave, 600e6, T0 + 2 days);
        assertEq(idCarol, 0);
        assertEq(idDave, 1);

        assertEq(vault.balance(), 3000e6);
        assertEq(vault.reserved(), 1800e6);
        assertEq(vault.available(), 1200e6);

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(CovenantVault.InsufficientAvailable.selector, 1500e6, 1200e6));
        vault.spend(stranger, 1500e6, "too much");

        _spend(stranger, 500e6);
        assertEq(vault.available(), 700e6);
        assertEq(vault.balance(), 2500e6);
        assertEq(vault.reserved(), 1800e6);
        assertEq(usdc.balanceOf(stranger), 500e6);

        vm.warp(T0 + 2 days);
        uint256 balBefore = vault.balance();
        uint256 resBefore = vault.reserved();
        uint256 availBefore = vault.available();
        _claim(dave, idDave);
        assertEq(vault.balance(), balBefore - 600e6);
        assertEq(vault.reserved(), resBefore - 600e6);
        assertEq(vault.available(), availBefore);
        assertEq(usdc.balanceOf(dave), 600e6);
    }

    // ---------------------------------------------------------------- 2. overcommit
    function test_Overcommit_AboveAvailableReverts() public {
        _deposit(alice, 1000e6);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(CovenantVault.InsufficientAvailable.selector, 1000e6 + 1, 1000e6));
        vault.createCommitment(carol, 1000e6 + 1, uint64(T0 + 1), "");
    }

    function test_Overcommit_ExactlyAvailableSucceeds() public {
        _deposit(alice, 1000e6);
        _create(carol, 1000e6, T0 + 1);
        assertEq(vault.available(), 0);
        assertEq(vault.reserved(), 1000e6);
    }

    function test_Overcommit_SecondBeyondRemainingReverts() public {
        _deposit(alice, 1000e6);
        _create(carol, 600e6, T0 + 1);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(CovenantVault.InsufficientAvailable.selector, 400e6 + 1, 400e6));
        vault.createCommitment(dave, 400e6 + 1, uint64(T0 + 1), "");
        _create(dave, 400e6, T0 + 1);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(CovenantVault.InsufficientAvailable.selector, 1, 0));
        vault.createCommitment(dave, 1, uint64(T0 + 1), "");
    }

    function test_Overcommit_ManyCallsNeverExceedBalance() public {
        _deposit(alice, 1000e6);
        uint256 ok;
        for (uint256 i; i < 25; ++i) {
            vm.prank(owner);
            try vault.createCommitment(carol, 100e6, uint64(T0 + 1 + i), "x") returns (uint256) {
                ok++;
            } catch (bytes memory r) {
                assertEq(bytes4(r), CovenantVault.InsufficientAvailable.selector);
            }
            assertGe(vault.balance(), vault.reserved());
        }
        assertEq(ok, 10);
        assertEq(vault.reserved(), 1000e6);
        assertEq(vault.nextId(), 10);
    }

    // ---------------------------------------------------------------- 3. unauthorized
    function test_Unauthorized_NonOwnerCreateReverts() public {
        _deposit(alice, 100e6);
        vm.prank(stranger);
        vm.expectRevert(CovenantVault.NotOwner.selector);
        vault.createCommitment(carol, 1e6, uint64(T0 + 1), "");
        vm.prank(alice);
        vm.expectRevert(CovenantVault.NotOwner.selector);
        vault.createCommitment(carol, 1e6, uint64(T0 + 1), "");
    }

    function test_Unauthorized_NonOwnerSpendReverts() public {
        _deposit(alice, 100e6);
        vm.prank(stranger);
        vm.expectRevert(CovenantVault.NotOwner.selector);
        vault.spend(stranger, 1e6, "");
        vm.prank(alice); // depositor is not owner
        vm.expectRevert(CovenantVault.NotOwner.selector);
        vault.spend(alice, 1e6, "");
    }

    function test_Unauthorized_NonRecipientClaimAndReleaseRevert() public {
        _deposit(alice, 100e6);
        uint256 id = _create(carol, 50e6, T0);
        address[4] memory callers = [owner, stranger, alice, dave];
        for (uint256 i; i < callers.length; ++i) {
            vm.prank(callers[i]);
            vm.expectRevert(CovenantVault.NotRecipient.selector);
            vault.claim(id);
            vm.prank(callers[i]);
            vm.expectRevert(CovenantVault.NotRecipient.selector);
            vault.release(id, true);
        }
        assertEq(vault.reserved(), 50e6);
    }

    function test_Unauthorized_UnknownIdReverts() public {
        vm.prank(carol);
        vm.expectRevert(abi.encodeWithSelector(CovenantVault.UnknownCommitment.selector, 0));
        vault.claim(0);
        _deposit(alice, 100e6);
        _create(carol, 1e6, T0);
        vm.prank(carol);
        vm.expectRevert(abi.encodeWithSelector(CovenantVault.UnknownCommitment.selector, 1));
        vault.release(1, true);
        vm.expectRevert(abi.encodeWithSelector(CovenantVault.UnknownCommitment.selector, 99));
        vault.getCommitment(99);
        assertFalse(vault.isClaimable(1));
    }

    // ---------------------------------------------------------------- 4. validation
    function test_Validation_ZeroRecipient() public {
        _deposit(alice, 100e6);
        vm.prank(owner);
        vm.expectRevert(CovenantVault.InvalidRecipient.selector);
        vault.createCommitment(address(0), 1e6, uint64(T0), "");
    }

    function test_Validation_RecipientIsVault() public {
        _deposit(alice, 100e6);
        vm.prank(owner);
        vm.expectRevert(CovenantVault.InvalidRecipient.selector);
        vault.createCommitment(address(vault), 1e6, uint64(T0), "");
    }

    function test_Validation_ZeroAmountCommitment() public {
        _deposit(alice, 100e6);
        vm.prank(owner);
        vm.expectRevert(CovenantVault.ZeroAmount.selector);
        vault.createCommitment(carol, 0, uint64(T0), "");
    }

    function test_Validation_AmountAboveUint128() public {
        _deposit(alice, 100e6);
        vm.prank(owner);
        vm.expectRevert(CovenantVault.AmountTooLarge.selector);
        vault.createCommitment(carol, uint256(type(uint128).max) + 1, uint64(T0), "");
    }

    function test_Validation_PastDueAt() public {
        _deposit(alice, 100e6);
        vm.prank(owner);
        vm.expectRevert(CovenantVault.DueInPast.selector);
        vault.createCommitment(carol, 1e6, uint64(T0 - 1), "");
        // dueAt == now is allowed
        _create(carol, 1e6, T0);
    }

    function test_Validation_DescriptionTooLong() public {
        _deposit(alice, 100e6);
        bytes memory ok = new bytes(280);
        bytes memory bad = new bytes(281);
        for (uint256 i; i < 280; ++i) ok[i] = "a";
        for (uint256 i; i < 281; ++i) bad[i] = "a";
        vm.prank(owner);
        vm.expectRevert(CovenantVault.TextTooLong.selector);
        vault.createCommitment(carol, 1e6, uint64(T0), string(bad));
        vm.prank(owner);
        vault.createCommitment(carol, 1e6, uint64(T0), string(ok));
        assertEq(bytes(vault.getCommitment(0).description).length, 280);
    }

    function test_Validation_SpendToZero() public {
        _deposit(alice, 100e6);
        vm.prank(owner);
        vm.expectRevert(CovenantVault.InvalidRecipient.selector);
        vault.spend(address(0), 1e6, "");
    }

    function test_Validation_SpendToVault() public {
        _deposit(alice, 100e6);
        vm.prank(owner);
        vm.expectRevert(CovenantVault.InvalidRecipient.selector);
        vault.spend(address(vault), 1e6, "");
    }

    function test_Validation_SpendZeroAmount() public {
        _deposit(alice, 100e6);
        vm.prank(owner);
        vm.expectRevert(CovenantVault.ZeroAmount.selector);
        vault.spend(stranger, 0, "");
    }

    function test_Validation_SpendMemoTooLong() public {
        _deposit(alice, 100e6);
        bytes memory bad = new bytes(281);
        for (uint256 i; i < 281; ++i) bad[i] = "m";
        vm.prank(owner);
        vm.expectRevert(CovenantVault.TextTooLong.selector);
        vault.spend(stranger, 1e6, string(bad));
        bytes memory ok = new bytes(280);
        for (uint256 i; i < 280; ++i) ok[i] = "m";
        vm.prank(owner);
        vault.spend(stranger, 1e6, string(ok));
    }

    function test_Validation_DepositZero() public {
        vm.prank(alice);
        vm.expectRevert(CovenantVault.ZeroAmount.selector);
        vault.deposit(0);
    }

    function test_Validation_ConstructorZeroToken() public {
        vm.expectRevert(CovenantVault.ZeroAddress.selector);
        new CovenantVault(address(0), owner);
    }

    function test_Validation_ConstructorZeroOwner() public {
        vm.expectRevert(CovenantVault.ZeroAddress.selector);
        new CovenantVault(address(usdc), address(0));
    }

    function test_Validation_ConstructorNonContractToken() public {
        vm.expectRevert(CovenantVault.InvalidToken.selector);
        new CovenantVault(makeAddr("eoa"), owner);
    }

    function test_Constructor_StoresImmutables() public view {
        assertEq(address(vault.token()), address(usdc));
        assertEq(vault.owner(), owner);
        assertEq(vault.nextId(), 0);
        assertEq(vault.totalReserved(), 0);
    }

    function test_Deposit_EmitsEventAndMovesFunds() public {
        vm.expectEmit(true, false, false, true, address(vault));
        emit CovenantVault.Deposited(alice, 250e6);
        _deposit(alice, 250e6);
        assertEq(vault.balance(), 250e6);
        assertEq(usdc.balanceOf(alice), FUND - 250e6);
    }

    function test_CreateCommitment_StoresTermsAndEmits() public {
        _deposit(alice, 100e6);
        vm.expectEmit(true, true, false, true, address(vault));
        emit CovenantVault.CommitmentCreated(0, carol, 40e6, uint64(T0 + 5), "rent");
        vm.prank(owner);
        vault.createCommitment(carol, 40e6, uint64(T0 + 5), "rent");
        CovenantVault.Commitment memory c = vault.getCommitment(0);
        assertEq(c.recipient, carol);
        assertEq(c.amount, 40e6);
        assertEq(c.dueAt, T0 + 5);
        assertEq(c.createdAt, T0);
        assertEq(uint8(c.status), uint8(CovenantVault.Status.Outstanding));
        assertEq(c.description, "rent");
        assertEq(vault.commitmentCount(), 1);
    }
}
