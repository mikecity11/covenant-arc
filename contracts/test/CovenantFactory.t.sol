// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {CovenantFactory} from "../CovenantFactory.sol";
import {CovenantVault} from "../CovenantVault.sol";
import {MockERC20, MockDecimals, NoDecimals} from "./Mocks.sol";

contract CovenantFactoryTest is Test {
    CovenantFactory internal factory;
    MockERC20 internal usdc;
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    function setUp() public {
        usdc = new MockERC20();
        factory = new CovenantFactory(address(usdc));
    }

    // ---------------------------------------------------------------- constructor
    function test_Constructor_StoresToken() public view {
        assertEq(factory.token(), address(usdc));
        assertEq(factory.vaultCount(), 0);
    }

    function test_Constructor_RejectsNonContract() public {
        vm.expectRevert(CovenantFactory.UnsupportedToken.selector);
        new CovenantFactory(makeAddr("eoa"));
        vm.expectRevert(CovenantFactory.UnsupportedToken.selector);
        new CovenantFactory(address(0));
    }

    function test_Constructor_RejectsNon6Decimals() public {
        MockDecimals t18 = new MockDecimals(18);
        vm.expectRevert(CovenantFactory.UnsupportedToken.selector);
        new CovenantFactory(address(t18));
        MockDecimals t8 = new MockDecimals(8);
        vm.expectRevert(CovenantFactory.UnsupportedToken.selector);
        new CovenantFactory(address(t8));
    }

    function test_Constructor_AcceptsAny6DecimalToken() public {
        MockDecimals t6 = new MockDecimals(6);
        CovenantFactory f = new CovenantFactory(address(t6));
        assertEq(f.token(), address(t6));
    }

    function test_Constructor_RejectsContractWithoutDecimals() public {
        NoDecimals nd = new NoDecimals();
        vm.expectRevert(CovenantFactory.UnsupportedToken.selector);
        new CovenantFactory(address(nd));
    }

    // ---------------------------------------------------------------- createVault
    function test_CreateVault_DeploysOwnedVaultAndRegisters() public {
        vm.prank(alice);
        address v = factory.createVault();

        assertGt(v.code.length, 0);
        assertEq(CovenantVault(v).owner(), alice);
        assertEq(address(CovenantVault(v).token()), address(usdc));
        assertEq(factory.allVaults(0), v);
        assertEq(factory.vaultsByOwner(alice, 0), v);
        assertTrue(factory.isVault(v));
        assertEq(factory.vaultCount(), 1);
        assertEq(factory.vaultsOf(alice).length, 1);
        assertEq(factory.vaultsOf(alice)[0], v);
        assertEq(factory.vaultsOf(bob).length, 0);
    }

    function test_CreateVault_EmitsVaultCreated() public {
        // vault address is unknown beforehand: skip topic1 (vault), check owner topic + data (token)
        vm.expectEmit(false, true, false, true, address(factory));
        emit CovenantFactory.VaultCreated(address(0), alice, address(usdc));
        vm.prank(alice);
        address v = factory.createVault();

        // and confirm the emitted vault address precisely via recorded logs
        vm.recordLogs();
        vm.prank(bob);
        address v2 = factory.createVault();
        Vm.Log[] memory logs = vm.getRecordedLogs();
        bool found;
        for (uint256 i; i < logs.length; ++i) {
            if (logs[i].emitter == address(factory) && logs[i].topics[0] == CovenantFactory.VaultCreated.selector) {
                assertEq(address(uint160(uint256(logs[i].topics[1]))), v2);
                assertEq(address(uint160(uint256(logs[i].topics[2]))), bob);
                assertEq(abi.decode(logs[i].data, (address)), address(usdc));
                found = true;
            }
        }
        assertTrue(found);
        assertTrue(v != v2);
    }

    function test_CreateVault_DifferentCallersGetDistinctVaults() public {
        vm.prank(alice);
        address va = factory.createVault();
        vm.prank(bob);
        address vb = factory.createVault();
        assertTrue(va != vb);
        assertEq(CovenantVault(va).owner(), alice);
        assertEq(CovenantVault(vb).owner(), bob);
        assertEq(factory.vaultsOf(alice).length, 1);
        assertEq(factory.vaultsOf(bob).length, 1);
        assertEq(factory.vaultCount(), 2);
    }

    function test_CreateVault_SameCallerMultipleVaults() public {
        vm.startPrank(alice);
        address v1 = factory.createVault();
        address v2 = factory.createVault();
        vm.stopPrank();
        assertTrue(v1 != v2);
        address[] memory mine = factory.vaultsOf(alice);
        assertEq(mine.length, 2);
        assertEq(mine[0], v1);
        assertEq(mine[1], v2);
    }

    function test_IsVault_FalseForForeignAddresses() public {
        CovenantVault foreign = new CovenantVault(address(usdc), alice);
        assertFalse(factory.isVault(address(foreign)));
        assertFalse(factory.isVault(alice));
    }

    function test_CreatedVault_IsFunctional() public {
        vm.prank(alice);
        CovenantVault v = CovenantVault(factory.createVault());
        usdc.mint(bob, 100e6);
        vm.startPrank(bob);
        usdc.approve(address(v), 100e6);
        v.deposit(100e6);
        vm.stopPrank();
        vm.prank(alice);
        v.createCommitment(bob, 60e6, uint64(block.timestamp), "");
        assertEq(v.available(), 40e6);
    }

    // ---------------------------------------------------------------- getVaults pagination
    function _make(uint256 n) internal returns (address[] memory made) {
        made = new address[](n);
        for (uint256 i; i < n; ++i) {
            vm.prank(i % 2 == 0 ? alice : bob);
            made[i] = factory.createVault();
        }
    }

    function test_GetVaults_Pagination() public {
        address[] memory made = _make(5);

        assertEq(factory.getVaults(5, 3).length, 0, "start == length");
        assertEq(factory.getVaults(50, 3).length, 0, "start beyond");
        assertEq(factory.getVaults(0, 0).length, 0, "count 0");

        address[] memory all = factory.getVaults(0, 5);
        assertEq(all.length, 5);
        for (uint256 i; i < 5; ++i) assertEq(all[i], made[i]);

        address[] memory mid = factory.getVaults(1, 2);
        assertEq(mid.length, 2);
        assertEq(mid[0], made[1]);
        assertEq(mid[1], made[2]);

        address[] memory tail = factory.getVaults(3, 100);
        assertEq(tail.length, 2, "clamped");
        assertEq(tail[1], made[4]);

        assertEq(factory.getVaults(4, type(uint256).max).length, 1, "no overflow");
        assertEq(factory.getVaults(0, type(uint256).max).length, 5);
    }

    function test_GetVaults_EmptyRegistry() public view {
        assertEq(factory.getVaults(0, 10).length, 0);
    }

    function testFuzz_GetVaults_LengthIsClamped(uint8 n, uint256 start, uint256 count) public {
        n = uint8(bound(n, 0, 12));
        _make(n);
        uint256 expected = start >= n ? 0 : (count < n - start ? count : n - start);
        assertEq(factory.getVaults(start, count).length, expected);
    }
}
