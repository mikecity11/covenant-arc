// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {CovenantVault} from "./CovenantVault.sol";

/// @title CovenantFactory
/// @notice Permissionless deployment and discovery of immutable Covenant treasuries.
/// @dev Has no administrator, fees, ownership or ability to alter deployed vaults.
/// The deployer chooses the token; six decimals alone do not authenticate USDC.
contract CovenantFactory {
    /// @notice ERC-20 token used by every vault created through this factory.
    address public immutable token;
    /// @notice All deployed vault addresses, in creation order.
    address[] public allVaults;
    /// @notice Vaults created by each permanent owner, in creation order.
    mapping(address => address[]) public vaultsByOwner;
    /// @notice Whether an address was deployed by this factory.
    mapping(address => bool) public isVault;

    /// @notice Token has no code, rejects metadata queries, or does not use six decimals.
    error UnsupportedToken();

    /// @notice A new vault was deployed for its caller and registered.
    event VaultCreated(address indexed vault, address indexed owner, address token);

    /// @notice Fixes the token for all future vaults after checking code and decimals.
    /// @param token_ ERC-20 contract whose decimals() must return six.
    constructor(address token_) {
        if (token_.code.length == 0) revert UnsupportedToken();
        try IERC20Metadata(token_).decimals() returns (uint8 decimals_) {
            if (decimals_ != 6) revert UnsupportedToken();
        } catch {
            revert UnsupportedToken();
        }
        token = token_;
    }

    /// @notice Deploys a non-upgradeable vault permanently owned by the caller.
    /// @return vault Newly deployed and registered treasury address.
    function createVault() external returns (address vault) {
        vault = address(new CovenantVault(token, msg.sender));
        allVaults.push(vault);
        vaultsByOwner[msg.sender].push(vault);
        isVault[vault] = true;
        emit VaultCreated(vault, msg.sender, token);
    }

    /// @notice Returns the total number of vaults created through this factory.
    function vaultCount() external view returns (uint256) {
        return allVaults.length;
    }

    /// @notice Returns a page of vault addresses, clamped to the registry length.
    /// @dev An out-of-range start or zero count returns an empty page; count cannot overflow.
    /// @param start Zero-based registry index at which the page begins.
    /// @param count Maximum number of addresses to return.
    /// @return page Vault addresses in creation order.
    function getVaults(uint256 start, uint256 count) external view returns (address[] memory page) {
        uint256 length = allVaults.length;
        if (start >= length) return new address[](0);
        uint256 size = length - start;
        if (count < size) size = count;
        page = new address[](size);
        for (uint256 i; i < size; ++i) {
            page[i] = allVaults[start + i];
        }
    }

    /// @notice Returns all vaults created by an owner through this factory.
    /// @param owner Permanent owner whose deployment history is requested.
    /// @return vaults Vault addresses in creation order.
    function vaultsOf(address owner) external view returns (address[] memory vaults) {
        return vaultsByOwner[owner];
    }
}
