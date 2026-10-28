import { parseAbi } from 'viem'

/** Human-readable ABI matching contracts/CovenantVault.sol. */
export const vaultAbi = parseAbi([
  'struct Commitment { address recipient; uint128 amount; uint64 dueAt; uint64 createdAt; uint8 status; string description; }',
  'function token() view returns (address)',
  'function owner() view returns (address)',
  'function balance() view returns (uint256)',
  'function reserved() view returns (uint256)',
  'function available() view returns (uint256)',
  'function commitmentCount() view returns (uint256)',
  'function getCommitment(uint256 id) view returns (Commitment)',
  'function getCommitments(uint256 start, uint256 count) view returns (Commitment[])',
  'function commitmentIdsOf(address recipient) view returns (uint256[])',
  'function isClaimable(uint256 id) view returns (bool)',
  'function deposit(uint256 amount)',
  'function createCommitment(address recipient, uint256 amount, uint64 dueAt, string description) returns (uint256 id)',
  'function claim(uint256 id)',
  'function release(uint256 id, bool confirmForfeit)',
  'function spend(address to, uint256 amount, string memo)',
  'event Deposited(address indexed depositor, uint256 amount)',
  'event CommitmentCreated(uint256 indexed id, address indexed recipient, uint256 amount, uint64 dueAt, string description)',
  'event Claimed(uint256 indexed id, address indexed recipient, uint256 amount)',
  'event Released(uint256 indexed id, address indexed recipient, uint256 amount)',
  'event Spent(address indexed to, uint256 amount, string memo)',
  'error ZeroAddress()',
  'error InvalidToken()',
  'error NotOwner()',
  'error InvalidRecipient()',
  'error ZeroAmount()',
  'error AmountTooLarge()',
  'error DueInPast()',
  'error TextTooLong()',
  'error InsufficientAvailable(uint256 requested, uint256 available)',
  'error UnexpectedTransferAmount()',
  'error UnknownCommitment(uint256 id)',
  'error NotRecipient()',
  'error NotOutstanding()',
  'error NotDue(uint64 dueAt)',
  'error ForfeitureNotConfirmed()',
  'error ReserveBreached()',
  'error ReentrancyGuardReentrantCall()',
  'error SafeERC20FailedOperation(address token)',
])

/** Human-readable ABI matching contracts/CovenantFactory.sol. */
export const factoryAbi = parseAbi([
  'function token() view returns (address)',
  'function vaultCount() view returns (uint256)',
  'function getVaults(uint256 start, uint256 count) view returns (address[])',
  'function vaultsOf(address owner) view returns (address[])',
  'function isVault(address) view returns (bool)',
  'function createVault() returns (address vault)',
  'event VaultCreated(address indexed vault, address indexed owner, address token)',
  'error UnsupportedToken()',
])

export enum CommitmentStatus {
  Outstanding = 0,
  Claimed = 1,
  Released = 2,
}

export interface CommitmentView {
  id: bigint
  recipient: `0x${string}`
  amount: bigint
  dueAt: bigint
  createdAt: bigint
  status: CommitmentStatus
  description: string
}
