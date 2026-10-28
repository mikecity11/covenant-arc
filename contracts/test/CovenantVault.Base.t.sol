// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {CovenantVault} from "../CovenantVault.sol";
import {MockERC20} from "./Mocks.sol";

abstract contract CovenantVaultTestBase is Test {
    CovenantVault internal vault;
    MockERC20 internal usdc;

    address internal owner = makeAddr("owner");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");
    address internal dave = makeAddr("dave");
    address internal stranger = makeAddr("stranger");

    uint256 internal constant FUND = 1_000_000e6;

    uint256 internal constant T0 = 1_700_000_000;

    function setUp() public virtual {
        vm.warp(T0);
        usdc = new MockERC20();
        vault = new CovenantVault(address(usdc), owner);
        _fundAndApprove(alice);
        _fundAndApprove(bob);
        _fundAndApprove(owner);
    }

    function _fundAndApprove(address who) internal {
        usdc.mint(who, FUND);
        vm.prank(who);
        usdc.approve(address(vault), type(uint256).max);
    }

    function _deposit(address who, uint256 amount) internal {
        vm.prank(who);
        vault.deposit(amount);
    }

    function _create(address recipient, uint256 amount, uint256 dueAt) internal returns (uint256 id) {
        vm.prank(owner);
        id = vault.createCommitment(recipient, amount, uint64(dueAt), "memo");
    }

    function _spend(address to, uint256 amount) internal {
        vm.prank(owner);
        vault.spend(to, amount, "spend");
    }

    function _claim(address who, uint256 id) internal {
        vm.prank(who);
        vault.claim(id);
    }

    function _release(address who, uint256 id) internal {
        vm.prank(who);
        vault.release(id, true);
    }

    function _assertConsistent() internal view {
        uint256 bal = vault.balance();
        uint256 res = vault.reserved();
        assertGe(bal, res, "balance >= reserved");
        assertEq(vault.available(), bal - res, "available == balance - reserved");
        assertEq(bal, usdc.balanceOf(address(vault)));
    }

    /// @dev Sum of amounts of commitments with the given status.
    function _sumStatus(CovenantVault.Status s) internal view returns (uint256 sum) {
        uint256 n = vault.nextId();
        for (uint256 i; i < n; ++i) {
            CovenantVault.Commitment memory c = vault.getCommitment(i);
            if (c.status == s) sum += c.amount;
        }
    }
}
