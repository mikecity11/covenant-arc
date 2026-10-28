// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IVaultLike {
    function claim(uint256 id) external;
    function release(uint256 id, bool confirm) external;
    function spend(address to, uint256 amount, string calldata memo) external;
    function deposit(uint256 amount) external;
    function createCommitment(address recipient, uint256 amount, uint64 dueAt, string calldata description)
        external
        returns (uint256);
}

/// @dev Plain 6-decimal ERC20 with public mint/burn (test only).
contract MockERC20 is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /// @dev Lets tests reduce a holder's balance externally (e.g. a rebasing/seizing token).
    function burnFrom_(address from, uint256 amount) external {
        _burn(from, amount);
    }
}

/// @dev Token with a 18-decimals setting for factory decimals checks.
contract MockDecimals is ERC20 {
    uint8 private immutable _d;

    constructor(uint8 d) ERC20("X", "X") {
        _d = d;
    }

    function decimals() public view override returns (uint8) {
        return _d;
    }
}

/// @dev Contract that has code but no decimals() function and no fallback.
contract NoDecimals {
    function foo() external pure returns (uint256) {
        return 1;
    }
}

/// @dev transfer() reverts while `failTransfers` is true. transferFrom still works.
contract ToggleToken is MockERC20 {
    bool public failTransfers;

    function setFail(bool v) external {
        failTransfers = v;
    }

    function transfer(address to, uint256 value) public override returns (bool) {
        require(!failTransfers, "transfer disabled");
        return super.transfer(to, value);
    }
}

/// @dev Burns 1% of every non-mint, non-burn transfer.
contract FeeToken is MockERC20 {
    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0) && to != address(0)) {
            uint256 fee = value / 100;
            super._update(from, address(0), fee);
            super._update(from, to, value - fee);
        } else {
            super._update(from, to, value);
        }
    }
}

/// @dev transfer() returns false (moving nothing) while `returnFalse` is true.
contract FalseToken is MockERC20 {
    bool public returnFalse;

    function setReturnFalse(bool v) external {
        returnFalse = v;
    }

    function transfer(address to, uint256 value) public override returns (bool) {
        if (returnFalse) return false;
        return super.transfer(to, value);
    }
}

/// @dev On any real transfer/transferFrom it tries to re-enter the vault, recording the outcome.
contract ReentrantToken is MockERC20 {
    enum Attack { None, Claim, Release, Spend, Deposit, CreateCommitment }

    IVaultLike public vault;
    Attack public attack;
    bool private _entered;

    uint256 public attempts;
    uint256 public blockedCount;
    uint256 public succeededCount;
    bytes4 public lastError;

    function configure(address vault_, Attack a) external {
        vault = IVaultLike(vault_);
        attack = a;
        attempts = 0;
        blockedCount = 0;
        succeededCount = 0;
        lastError = bytes4(0);
    }

    /// @dev Lets the token act as the vault owner when it is deployed as owner (owner-only re-entry tests).
    function exec(address target, bytes calldata data) external {
        (bool ok, bytes memory ret) = target.call(data);
        if (!ok) {
            assembly {
                revert(add(ret, 32), mload(ret))
            }
        }
    }

    function _update(address from, address to, uint256 value) internal override {
        if (attack != Attack.None && !_entered && from != address(0) && to != address(0)) {
            _entered = true;
            _attempt();
            _entered = false;
        }
        super._update(from, to, value);
    }

    function _record(bytes memory reason) private {
        bytes4 sel;
        if (reason.length >= 4) {
            assembly {
                sel := mload(add(reason, 32))
            }
        }
        lastError = sel;
        if (sel == ReentrancyGuard.ReentrancyGuardReentrantCall.selector) blockedCount++;
    }

    function _attempt() private {
        attempts++;
        bool ok;
        if (attack == Attack.Claim) {
            try vault.claim(0) {
                ok = true;
            } catch (bytes memory r) {
                _record(r);
            }
        } else if (attack == Attack.Release) {
            try vault.release(0, true) {
                ok = true;
            } catch (bytes memory r) {
                _record(r);
            }
        } else if (attack == Attack.Spend) {
            try vault.spend(address(this), 1, "") {
                ok = true;
            } catch (bytes memory r) {
                _record(r);
            }
        } else if (attack == Attack.Deposit) {
            try vault.deposit(1) {
                ok = true;
            } catch (bytes memory r) {
                _record(r);
            }
        } else if (attack == Attack.CreateCommitment) {
            try vault.createCommitment(address(0xBEEF), 1, uint64(block.timestamp + 1), "") returns (uint256) {
                ok = true;
            } catch (bytes memory r) {
                _record(r);
            }
        }
        if (ok) succeededCount++;
    }
}
