// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {CovenantVault} from "../CovenantVault.sol";
import {MockERC20} from "./Mocks.sol";

/// @dev Bounded-action handler driving the vault.
contract CovenantVaultHandler is Test {
    CovenantVault public vault;
    MockERC20 public usdc;
    address public vaultOwner;
    address[] public actors;

    uint256 public ghostIn; // deposited + unsolicited
    uint256 public ghostOut; // spent + claimed
    uint256 public calls;

    constructor(CovenantVault vault_, MockERC20 usdc_, address owner_, address[] memory actors_) {
        vault = vault_;
        usdc = usdc_;
        vaultOwner = owner_;
        actors = actors_;
    }

    function _actor(uint256 seed) internal view returns (address) {
        return actors[seed % actors.length];
    }

    function deposit(uint256 actorSeed, uint256 amount) external {
        amount = bound(amount, 1, 1_000_000e6);
        address who = _actor(actorSeed);
        usdc.mint(who, amount);
        vm.startPrank(who);
        usdc.approve(address(vault), amount);
        vault.deposit(amount);
        vm.stopPrank();
        ghostIn += amount;
        calls++;
    }

    function create(uint256 recipientSeed, uint256 amount, uint256 dueDelta) external {
        uint256 avail = vault.available();
        if (avail == 0) return;
        amount = bound(amount, 1, avail);
        dueDelta = bound(dueDelta, 0, 30 days);
        vm.prank(vaultOwner);
        vault.createCommitment(_actor(recipientSeed), amount, uint64(block.timestamp + dueDelta), "i");
        calls++;
    }

    function spend(uint256 toSeed, uint256 amount) external {
        uint256 avail = vault.available();
        if (avail == 0) return;
        amount = bound(amount, 1, avail);
        vm.prank(vaultOwner);
        vault.spend(_actor(toSeed), amount, "s");
        ghostOut += amount;
        calls++;
    }

    function claim(uint256 idSeed) external {
        uint256 n = vault.nextId();
        if (n == 0) return;
        uint256 id = idSeed % n;
        CovenantVault.Commitment memory c = vault.getCommitment(id);
        vm.prank(c.recipient);
        try vault.claim(id) {
            ghostOut += c.amount;
        } catch {}
        calls++;
    }

    function release(uint256 idSeed) external {
        uint256 n = vault.nextId();
        if (n == 0) return;
        uint256 id = idSeed % n;
        CovenantVault.Commitment memory c = vault.getCommitment(id);
        vm.prank(c.recipient);
        try vault.release(id, true) {} catch {}
        calls++;
    }

    function warp(uint256 delta) external {
        delta = bound(delta, 0, 10 days);
        vm.warp(block.timestamp + delta);
    }

    function donate(uint256 amount) external {
        amount = bound(amount, 0, 100e6);
        usdc.mint(address(vault), amount);
        ghostIn += amount;
    }
}

contract CovenantVaultInvariantTest is Test {
    CovenantVault internal vault;
    MockERC20 internal usdc;
    CovenantVaultHandler internal handler;

    function setUp() public {
        vm.warp(1_700_000_000);
        usdc = new MockERC20();
        address owner = makeAddr("owner");
        vault = new CovenantVault(address(usdc), owner);
        address[] memory actors = new address[](4);
        actors[0] = makeAddr("alice");
        actors[1] = makeAddr("bob");
        actors[2] = makeAddr("carol");
        actors[3] = makeAddr("dave");
        handler = new CovenantVaultHandler(vault, usdc, owner, actors);
        targetContract(address(handler));
    }

    function invariant_BalanceCoversReserved() public view {
        assertGe(vault.balance(), vault.reserved());
    }

    function invariant_AvailableEqualsBalanceMinusReserved() public view {
        assertEq(vault.available(), vault.balance() - vault.reserved());
    }

    function invariant_ReservedEqualsSumOfOutstanding() public view {
        uint256 sum;
        uint256 n = vault.nextId();
        for (uint256 i; i < n; ++i) {
            CovenantVault.Commitment memory c = vault.getCommitment(i);
            if (c.status == CovenantVault.Status.Outstanding) sum += c.amount;
        }
        assertEq(vault.reserved(), sum);
    }

    function invariant_BalanceMatchesFlows() public view {
        assertEq(vault.balance(), handler.ghostIn() - handler.ghostOut());
    }
}
