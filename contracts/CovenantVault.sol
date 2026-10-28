// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title CovenantVault
/// @notice Immutable-owner treasury protecting fully funded ERC-20 commitments.
/// @dev Amounts are token base units (six decimals for USDC), never native currency.
/// Direct supported-token transfers increase available funds without emitting Deposited.
/// Unsupported tokens sent here are unrecoverable. No receive or fallback is provided.
/// Protection depends on token behavior; issuer pause/blocklisting can prevent transfers.
contract CovenantVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Lifecycle of a commitment; only its recipient can end it.
    enum Status { Outstanding, Claimed, Released }

    /// @notice Fixed payment terms and current lifecycle state.
    struct Commitment {
        address recipient;
        uint128 amount;
        uint64 dueAt;
        uint64 createdAt;
        Status status;
        string description;
    }

    /// @notice The only token handled by this treasury.
    IERC20 public immutable token;
    /// @notice Permanent treasury operator; cannot change or cancel commitments.
    address public immutable owner;
    /// @notice Sum of all Outstanding commitment amounts.
    uint256 public totalReserved;
    /// @notice Next sequential commitment ID, also the number of commitments.
    uint256 public nextId;
    /// @dev Commitments indexed by sequential ID, including completed commitments.
    mapping(uint256 => Commitment) private _commitments;
    /// @dev Permanent ID history for each recipient.
    mapping(address => uint256[]) private _recipientIds;

    /// @notice A constructor argument is the zero address.
    error ZeroAddress();
    /// @notice The configured token has no deployed code.
    error InvalidToken();
    /// @notice Caller is not the permanent owner.
    error NotOwner();
    /// @notice Recipient or spending destination is zero or this vault.
    error InvalidRecipient();
    /// @notice Amount is zero.
    error ZeroAmount();
    /// @notice Commitment amount exceeds uint128 capacity.
    error AmountTooLarge();
    /// @notice Due timestamp is earlier than the current block timestamp.
    error DueInPast();
    /// @notice Description or memo exceeds 280 bytes.
    error TextTooLong();
    /// @notice Requested spending or reservation exceeds available funds.
    error InsufficientAvailable(uint256 requested, uint256 available);
    /// @notice Deposit did not increase token balance by exactly the requested amount.
    error UnexpectedTransferAmount();
    /// @notice ID has never been created.
    error UnknownCommitment(uint256 id);
    /// @notice Caller is not the commitment's recipient.
    error NotRecipient();
    /// @notice Commitment has already been claimed or released.
    error NotOutstanding();
    /// @notice Commitment cannot yet be claimed.
    error NotDue(uint64 dueAt);
    /// @notice Recipient has not explicitly confirmed forfeiture.
    error ForfeitureNotConfirmed();
    /// @notice A spend would leave the vault below its outstanding reserves.
    error ReserveBreached();

    /// @notice Tokens deposited through deposit(), excluding unsolicited transfers.
    event Deposited(address indexed depositor, uint256 amount);
    /// @notice A fully funded, immutable commitment was created.
    event CommitmentCreated(
        uint256 indexed id, address indexed recipient, uint256 amount, uint64 dueAt, string description
    );
    /// @notice Recipient collected a matured commitment.
    event Claimed(uint256 indexed id, address indexed recipient, uint256 amount);
    /// @notice Recipient forfeited a commitment; no tokens were sent.
    event Released(uint256 indexed id, address indexed recipient, uint256 amount);
    /// @notice Owner spent unreserved treasury funds.
    event Spent(address indexed to, uint256 amount, string memo);

    /// @notice Restricts discretionary treasury actions to the permanent owner.
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /// @notice Establishes immutable token and owner addresses.
    /// @param token_ Supported ERC-20 contract; not a native-currency address.
    /// @param owner_ Permanent operator of the treasury.
    constructor(address token_, address owner_) {
        if (token_ == address(0) || owner_ == address(0)) revert ZeroAddress();
        if (token_.code.length == 0) revert InvalidToken();
        token = IERC20(token_);
        owner = owner_;
    }

    /// @notice Returns supported ERC-20 assets, excluding native currency.
    function balance() public view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /// @notice Returns total outstanding payment obligations.
    function reserved() external view returns (uint256) {
        return totalReserved;
    }

    /// @notice Returns spendable funds, saturating at zero if token assets fall below reserves.
    function available() public view returns (uint256) {
        uint256 assets = balance();
        uint256 obligations = totalReserved;
        return assets > obligations ? assets - obligations : 0;
    }

    /// @notice Returns the count of all commitments, including completed ones.
    function commitmentCount() external view returns (uint256) {
        return nextId;
    }

    /// @notice Returns a commitment, reverting if the ID does not exist.
    function getCommitment(uint256 id) external view returns (Commitment memory) {
        _requireKnown(id);
        return _commitments[id];
    }

    /// @notice Returns a sequential page, clamped to existing commitments.
    /// @dev An out-of-range start or zero count returns an empty page; count cannot overflow.
    function getCommitments(uint256 start, uint256 count) external view returns (Commitment[] memory page) {
        uint256 length = nextId;
        if (start >= length) return new Commitment[](0);
        uint256 size = length - start;
        if (count < size) size = count;
        page = new Commitment[](size);
        for (uint256 i; i < size; ++i) {
            page[i] = _commitments[start + i];
        }
    }

    /// @notice Returns every ID ever assigned to a recipient, including completed commitments.
    function commitmentIdsOf(address recipient) external view returns (uint256[] memory) {
        return _recipientIds[recipient];
    }

    /// @notice Returns whether a known commitment is outstanding and due; unknown IDs return false.
    /// @dev Does not guarantee token transfers are currently permitted by the issuer.
    function isClaimable(uint256 id) external view returns (bool) {
        if (id >= nextId) return false;
        Commitment storage commitment = _commitments[id];
        return commitment.status == Status.Outstanding && block.timestamp >= commitment.dueAt;
    }

    /// @notice Deposits an exact positive token amount; caller must first approve this vault.
    /// @dev Rejects transfer fees or other balance deltas that differ from amount.
    function deposit(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        uint256 beforeBalance = balance();
        token.safeTransferFrom(msg.sender, address(this), amount);
        uint256 afterBalance = balance();
        if (afterBalance < beforeBalance || afterBalance - beforeBalance != amount) {
            revert UnexpectedTransferAmount();
        }
        emit Deposited(msg.sender, amount);
    }

    /// @notice Reserves available funds under fixed terms that the owner cannot modify.
    /// @param recipient The sole account allowed to claim or forfeit the commitment.
    /// @param amount Positive token base units, fitting uint128.
    /// @param dueAt Earliest claim timestamp, which may equal the current timestamp.
    /// @param description Description of at most 280 bytes; empty text is allowed.
    /// @return id Sequential commitment ID starting at zero.
    function createCommitment(address recipient, uint256 amount, uint64 dueAt, string calldata description)
        external onlyOwner nonReentrant returns (uint256 id)
    {
        if (recipient == address(0) || recipient == address(this)) revert InvalidRecipient();
        if (amount == 0) revert ZeroAmount();
        if (amount > type(uint128).max) revert AmountTooLarge();
        if (dueAt < block.timestamp) revert DueInPast();
        if (bytes(description).length > 280) revert TextTooLong();
        uint256 free = available();
        if (amount > free) revert InsufficientAvailable(amount, free);

        id = nextId++;
        _commitments[id] = Commitment({
            recipient: recipient,
            amount: uint128(amount),
            dueAt: dueAt,
            createdAt: uint64(block.timestamp),
            status: Status.Outstanding,
            description: description
        });
        _recipientIds[recipient].push(id);
        totalReserved += amount;
        emit CommitmentCreated(id, recipient, amount, dueAt, description);
    }

    /// @notice Allows only the recipient to collect their outstanding, matured commitment once.
    /// @dev Accounting effects precede the token transfer; transfer failure rolls everything back.
    function claim(uint256 id) external nonReentrant {
        _requireKnown(id);
        Commitment storage commitment = _commitments[id];
        if (msg.sender != commitment.recipient) revert NotRecipient();
        if (commitment.status != Status.Outstanding) revert NotOutstanding();
        if (block.timestamp < commitment.dueAt) revert NotDue(commitment.dueAt);

        uint256 amount = commitment.amount;
        commitment.status = Status.Claimed;
        totalReserved -= amount;
        token.safeTransfer(commitment.recipient, amount);
        emit Claimed(id, commitment.recipient, amount);
    }

    /// @notice Permanently forfeits the caller's outstanding commitment without sending tokens.
    /// @param id Commitment to forfeit, either before or after its due date.
    /// @param confirmForfeit Must be true to explicitly confirm loss of the claim.
    function release(uint256 id, bool confirmForfeit) external nonReentrant {
        _requireKnown(id);
        Commitment storage commitment = _commitments[id];
        if (msg.sender != commitment.recipient) revert NotRecipient();
        if (commitment.status != Status.Outstanding) revert NotOutstanding();
        if (!confirmForfeit) revert ForfeitureNotConfirmed();

        uint256 amount = commitment.amount;
        commitment.status = Status.Released;
        totalReserved -= amount;
        emit Released(id, commitment.recipient, amount);
    }

    /// @notice Transfers only unreserved funds on the owner's instruction.
    /// @param to Nonzero destination other than this vault.
    /// @param amount Positive token base units, at most available().
    /// @param memo Event-only memo of at most 280 bytes; empty text is allowed.
    function spend(address to, uint256 amount, string calldata memo) external onlyOwner nonReentrant {
        if (to == address(0) || to == address(this)) revert InvalidRecipient();
        if (amount == 0) revert ZeroAmount();
        if (bytes(memo).length > 280) revert TextTooLong();
        uint256 free = available();
        if (amount > free) revert InsufficientAvailable(amount, free);

        token.safeTransfer(to, amount);
        if (balance() < totalReserved) revert ReserveBreached();
        emit Spent(to, amount, memo);
    }

    /// @dev Rejects IDs outside the created sequential range.
    function _requireKnown(uint256 id) private view {
        if (id >= nextId) revert UnknownCommitment(id);
    }
}
