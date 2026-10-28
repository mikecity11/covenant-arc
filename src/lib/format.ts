import { formatUsdc, parseUsdc, AmountError } from '@/onchain-money'

/** Display a raw USDC amount with grouping and at least two decimals, never rounding. */
export function fmtUsdc(raw: bigint, minDecimals = 2): string {
  const exact = formatUsdc(raw) // trimmed, e.g. "1200.5"
  const negative = exact.startsWith('-')
  const [whole, frac = ''] = (negative ? exact.slice(1) : exact).split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${negative ? '-' : ''}${grouped}.${frac.padEnd(minDecimals, '0')}`
}

export const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`

export type ParsedAmount = { ok: true; raw: bigint } | { ok: false; error: string }

/** Parse user text into base units with exact decimal handling (no floating point). */
export function parseAmountInput(text: string): ParsedAmount {
  const t = text.trim()
  if (t === '') return { ok: false, error: '' }
  try {
    const raw = parseUsdc(t)
    if (raw < 0n) return { ok: false, error: 'Amount cannot be negative.' }
    return { ok: true, raw }
  } catch (e) {
    if (e instanceof AmountError && e.code === 'TOO_MANY_FRACTION_DIGITS') {
      return { ok: false, error: 'USDC supports at most 6 decimal places.' }
    }
    return { ok: false, error: 'Enter a plain number such as 250 or 12.5.' }
  }
}

export function fmtDateTime(ts: bigint | number): string {
  const ms = typeof ts === 'bigint' ? Number(ts) * 1000 : ts * 1000
  return new Date(ms).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function fmtDate(ts: bigint | number): string {
  const ms = typeof ts === 'bigint' ? Number(ts) * 1000 : ts * 1000
  return new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/** "in 3d 4h", "due now", "2h ago" relative to nowSec. */
export function fmtRelative(ts: bigint, nowSec: number): string {
  const diff = Number(ts) - nowSec
  const abs = Math.abs(diff)
  const d = Math.floor(abs / 86400)
  const h = Math.floor((abs % 86400) / 3600)
  const m = Math.floor((abs % 3600) / 60)
  const s = abs % 60
  const span = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`
  if (diff > 0) return `in ${span}`
  return diff === 0 ? 'due now' : `${span} ago`
}

/** Convert a datetime-local string (local time) into unix seconds, or null if invalid. */
export function localInputToUnix(v: string): bigint | null {
  if (!v) return null
  const ms = new Date(v).getTime()
  return Number.isNaN(ms) ? null : BigInt(Math.floor(ms / 1000))
}

export const utf8Length = (s: string) => new TextEncoder().encode(s).length
