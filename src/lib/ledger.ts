/**
 * Pure bigint arithmetic mirroring the vault's rules. Used by the interactive calculator, the
 * transfer previews and the isolated demo simulation. It never touches a chain.
 * All amounts are USDC base units (6 decimals) as bigint.
 */

export const availableOf = (assets: bigint, reserved: bigint): bigint =>
  assets > reserved ? assets - reserved : 0n

export type Refusal =
  | 'zero-amount'
  | 'exceeds-available'
  | 'exceeds-assets'
  | 'not-due'
  | 'already-ended'

export interface Preview {
  ok: boolean
  refusal?: Refusal
  assetsAfter: bigint
  reservedAfter: bigint
  availableAfter: bigint
  /** Shortfall in base units when refused for exceeding available. */
  shortfall: bigint
}

const result = (
  ok: boolean,
  assetsAfter: bigint,
  reservedAfter: bigint,
  shortfall = 0n,
  refusal?: Refusal,
): Preview => ({
  ok,
  refusal,
  assetsAfter,
  reservedAfter,
  availableAfter: availableOf(assetsAfter, reservedAfter),
  shortfall,
})

/** Discretionary spend: only balance minus outstanding reserves may leave. */
export function previewSpend(assets: bigint, reserved: bigint, amount: bigint): Preview {
  if (amount <= 0n) return result(false, assets, reserved, 0n, 'zero-amount')
  const free = availableOf(assets, reserved)
  if (amount > free) return result(false, assets, reserved, amount - free, 'exceeds-available')
  return result(true, assets - amount, reserved)
}

/** New promise: must be fully funded from what is still available. */
export function previewCommit(assets: bigint, reserved: bigint, amount: bigint): Preview {
  if (amount <= 0n) return result(false, assets, reserved, 0n, 'zero-amount')
  const free = availableOf(assets, reserved)
  if (amount > free) return result(false, assets, reserved, amount - free, 'exceeds-available')
  return result(true, assets, reserved + amount)
}

/** A claim lowers assets and reserves by the same amount, so available is unchanged. */
export function previewClaim(assets: bigint, reserved: bigint, amount: bigint): Preview {
  if (amount <= 0n) return result(false, assets, reserved, 0n, 'zero-amount')
  if (amount > reserved || amount > assets) return result(false, assets, reserved, 0n, 'exceeds-assets')
  return result(true, assets - amount, reserved - amount)
}

/** A voluntary release sends nothing out; the reserve is simply freed. */
export function previewRelease(assets: bigint, reserved: bigint, amount: bigint): Preview {
  if (amount <= 0n || amount > reserved) return result(false, assets, reserved, 0n, 'exceeds-assets')
  return result(true, assets, reserved - amount)
}

export const previewDeposit = (assets: bigint, reserved: bigint, amount: bigint): Preview =>
  amount <= 0n ? result(false, assets, reserved, 0n, 'zero-amount') : result(true, assets + amount, reserved)

export const refusalCopy = (p: Preview, fmt: (n: bigint) => string): string => {
  switch (p.refusal) {
    case 'zero-amount':
      return 'Enter an amount greater than zero.'
    case 'exceeds-available':
      return `Rejected: this is ${fmt(p.shortfall)} USDC more than is available.`
    case 'exceeds-assets':
      return 'Rejected: this exceeds what the vault holds or has reserved.'
    case 'not-due':
      return 'Not yet due.'
    case 'already-ended':
      return 'This promise has already ended.'
    default:
      return ''
  }
}
