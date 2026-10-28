import { useMemo, useState } from 'react'
import { AllocationVisual } from '@/components/AllocationVisual'
import { AnimatedUsdc } from '@/components/AnimatedNumber'
import { previewClaim, previewCommit, previewDeposit, previewSpend, refusalCopy } from '@/lib/ledger'
import { fmtUsdc } from '@/lib/format'
import { parseUsdc } from '@/onchain-money'
import clsx from 'clsx'

type Action =
  | { type: 'deposit'; amount: bigint }
  | { type: 'commit'; amount: bigint }
  | { type: 'spend'; amount: bigint }
  | { type: 'claim'; amount: bigint }

interface Step {
  title: string
  short: string
  caption: string
  assets: bigint
  reserved: bigint
  attempt?: bigint
  rejected?: boolean
}

const U = (n: string) => parseUsdc(n)

const SCRIPT: Array<{ short: string; title: string; action: Action; attempt?: boolean; note: string }> = [
  { short: 'Deposit', title: 'Three contributors deposit 3,000 USDC', action: { type: 'deposit', amount: U('3000') }, note: 'Assets: 3,000. Nothing is promised yet, so all of it is available.' },
  { short: 'Promise', title: 'The owner records 1,800 USDC of dated promises', action: { type: 'commit', amount: U('1800') }, note: 'Each promise is fully funded the moment it is recorded. 1,800 moves to the protected side and the owner cannot take it back.' },
  { short: 'Try 1,500', title: 'A 1,500 USDC discretionary payment is attempted', action: { type: 'spend', amount: U('1500') }, attempt: true, note: 'Only 1,200 is available. The vault rejects the payment because it would reach into protected funds.' },
  { short: 'Spend 500', title: 'A 500 USDC payment fits inside available funds', action: { type: 'spend', amount: U('500') }, note: 'Allowed. 3,000 becomes 2,500 in the vault, 1,800 stays protected, and 700 remains available.' },
  { short: 'Claim 600', title: 'A recipient claims their 600 USDC promise', action: { type: 'claim', amount: U('600') }, note: 'After the due date the recipient sends a transaction. Assets and protected funds both fall by 600, so available stays 700.' },
]

function buildSteps(): Step[] {
  const steps: Step[] = []
  let assets = 0n
  let reserved = 0n
  for (const s of SCRIPT) {
    const a = s.action
    const p =
      a.type === 'deposit'
        ? previewDeposit(assets, reserved, a.amount)
        : a.type === 'commit'
          ? previewCommit(assets, reserved, a.amount)
          : a.type === 'spend'
            ? previewSpend(assets, reserved, a.amount)
            : previewClaim(assets, reserved, a.amount)
    const attempt = a.type === 'spend' ? a.amount : undefined
    steps.push({
      title: s.title,
      short: s.short,
      caption: p.ok ? s.note : `${refusalCopy(p, fmtUsdc)} ${s.note}`,
      assets: p.ok ? p.assetsAfter : assets,
      reserved: p.ok ? p.reservedAfter : reserved,
      attempt,
      rejected: !p.ok,
    })
    if (p.ok) {
      assets = p.assetsAfter
      reserved = p.reservedAfter
    }
  }
  return steps
}

/** Step-through of the 3,000 / 1,800 / 1,200 example. Illustration only: no wallet, no live funds. */
export function Walkthrough() {
  const steps = useMemo(() => buildSteps(), [])
  const [i, setI] = useState(0)
  const step = steps[i]
  const available = step.assets > step.reserved ? step.assets - step.reserved : 0n

  return (
    <div className="panel p-5 sm:p-7">
      <div className="mb-1 flex items-center justify-between gap-3">
        <p className="eyebrow">Worked example</p>
        <span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] text-ivory-mute">Illustration, not live funds</span>
      </div>
      <AllocationVisual
        assets={step.assets}
        reserved={step.reserved}
        outflow={step.attempt && step.rejected ? { amount: step.attempt } : null}
        className="mt-2 w-full"
      />
      <dl className="mt-2 grid grid-cols-3 gap-3 border-t border-line pt-5">
        <div>
          <dt className="text-[11px] uppercase tracking-[0.14em] text-ivory-mute">In the vault</dt>
          <dd className="display mt-1 text-2xl font-light sm:text-3xl"><AnimatedUsdc value={step.assets} dp={0} /></dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.14em] text-gold">Protected</dt>
          <dd className="display mt-1 text-2xl font-light text-gold-soft sm:text-3xl"><AnimatedUsdc value={step.reserved} dp={0} /></dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.14em] text-mint">Available</dt>
          <dd className="display mt-1 text-2xl font-light text-mint sm:text-3xl"><AnimatedUsdc value={available} dp={0} /></dd>
        </div>
      </dl>
      <div className="mt-5 min-h-[88px]" aria-live="polite">
        <p className="font-medium">{step.title}</p>
        <p className={clsx('mt-1 text-sm leading-relaxed text-pretty', step.rejected ? 'text-rose-alert' : 'text-ivory-dim')}>{step.caption}</p>
      </div>
      <div role="tablist" aria-label="Example steps" className="mt-3 flex flex-wrap gap-2">
        {steps.map((s, idx) => (
          <button
            key={s.short}
            role="tab"
            aria-selected={idx === i}
            onClick={() => setI(idx)}
            className={clsx(
              'min-h-10 rounded-full border px-4 text-sm transition-colors',
              idx === i ? 'border-gold bg-gold/15 text-gold-soft' : 'border-line text-ivory-dim hover:border-gold/50 hover:text-ivory',
            )}
          >
            {idx + 1}. {s.short}
          </button>
        ))}
      </div>
    </div>
  )
}
