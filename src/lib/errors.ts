import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError } from 'viem'
import { fmtUsdc } from '@/lib/format'

export interface FriendlyError {
  rejected: boolean
  message: string
}

const asBig = (v: unknown): bigint => (typeof v === 'bigint' ? v : 0n)

const NAMED: Record<string, (args: readonly unknown[] | undefined) => string> = {
  NotOwner: () => 'Only the treasury owner can do this.',
  NotRecipient: () => 'Only the named recipient can do this.',
  NotOutstanding: () => 'This promise was already claimed or released.',
  NotDue: (a) => `Not due yet. It can be claimed after ${new Date(Number(a?.[0] ?? 0) * 1000).toLocaleString()}.`,
  InsufficientAvailable: (a) =>
    `Rejected by the vault: ${fmtUsdc(asBig(a?.[0]))} requested, but only ${fmtUsdc(asBig(a?.[1]))} is available after protected promises.`,
  ForfeitureNotConfirmed: () => 'Forfeiture must be confirmed explicitly.',
  ZeroAmount: () => 'Amount must be greater than zero.',
  ZeroAddress: () => 'An address was empty.',
  InvalidRecipient: () => 'That address cannot be used as a recipient or destination.',
  DueInPast: () => 'The due date is already in the past.',
  TextTooLong: () => 'Text is longer than 280 bytes.',
  AmountTooLarge: () => 'Amount is too large.',
  UnknownCommitment: () => 'That promise does not exist.',
  UnexpectedTransferAmount: () => 'The token delivered a different amount than requested, so the deposit was refused.',
  ReserveBreached: () => 'The transfer would leave the vault below its protected reserves.',
  ReentrancyGuardReentrantCall: () => 'Re-entrant call blocked.',
  SafeERC20FailedOperation: () => 'The USDC transfer failed. The token issuer may have paused or restricted this address.',
}

/** Turn a wagmi/viem error into text a person can act on. Never returns raw stack traces. */
export function friendlyError(error: unknown): FriendlyError {
  if (error instanceof BaseError) {
    if (error.walk((e) => e instanceof UserRejectedRequestError)) {
      return { rejected: true, message: 'Request cancelled in your wallet.' }
    }
    const reverted = error.walk((e) => e instanceof ContractFunctionRevertedError)
    if (reverted instanceof ContractFunctionRevertedError) {
      const name = reverted.data?.errorName
      if (name && NAMED[name]) return { rejected: false, message: NAMED[name](reverted.data?.args) }
      if (reverted.reason) return { rejected: false, message: `Reverted: ${reverted.reason}` }
    }
    const short = error.shortMessage ?? ''
    if (/insufficient funds/i.test(error.message)) {
      return { rejected: false, message: 'Not enough USDC to pay gas. Gas on Arc is paid in USDC.' }
    }
    if (/user rejected|denied/i.test(error.message)) {
      return { rejected: true, message: 'Request cancelled in your wallet.' }
    }
    if (short) return { rejected: false, message: short }
  }
  const msg = error instanceof Error ? error.message : ''
  if (/user rejected|denied/i.test(msg)) return { rejected: true, message: 'Request cancelled in your wallet.' }
  return { rejected: false, message: 'The transaction could not be completed. Check your wallet and try again.' }
}
