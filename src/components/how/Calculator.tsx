import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { AllocationVisual } from '@/components/AllocationVisual'
import { AnimatedUsdc } from '@/components/AnimatedNumber'
import { Field, Input } from '@/components/ui'
import { availableOf, previewClaim, previewCommit, previewRelease, previewSpend, refusalCopy } from '@/lib/ledger'
import { fmtUsdc, parseAmountInput } from '@/lib/format'
import clsx from 'clsx'

type Mode = 'spend' | 'commit' | 'claim' | 'release'

const MODES: Array<{ id: Mode; label: string; help: string }> = [
  { id: 'spend', label: 'Owner pays someone', help: 'A discretionary payment. Only available funds may leave.' },
  { id: 'commit', label: 'Owner records a promise', help: 'A new promise must be fully funded from available funds.' },
  { id: 'claim', label: 'Recipient claims', help: 'A due recipient takes their promise. Assets and protected funds fall together.' },
  { id: 'release', label: 'Recipient releases', help: 'A recipient gives up a promise. Nothing is sent; the reserve is freed.' },
]

/** Interactive spending calculator using exact bigint arithmetic. Pretend numbers, no chain access. */
export function Calculator() {
  const [assets, setAssets] = useState('3000')
  const [reserved, setReserved] = useState('1800')
  const [amount, setAmount] = useState('1500')
  const [mode, setMode] = useState<Mode>('spend')

  const a = parseAmountInput(assets)
  const r = parseAmountInput(reserved)
  const x = parseAmountInput(amount)
  const inputsOk = a.ok && r.ok && x.ok
  const invalidReserve = a.ok && r.ok && r.raw > a.raw

  const assetsRaw = a.ok ? a.raw : 0n
  const reservedRaw = r.ok ? (r.raw > assetsRaw ? assetsRaw : r.raw) : 0n
  const amountRaw = x.ok ? x.raw : 0n
  const free = availableOf(assetsRaw, reservedRaw)

  const preview =
    mode === 'spend'
      ? previewSpend(assetsRaw, reservedRaw, amountRaw)
      : mode === 'commit'
        ? previewCommit(assetsRaw, reservedRaw, amountRaw)
        : mode === 'claim'
          ? previewClaim(assetsRaw, reservedRaw, amountRaw)
          : previewRelease(assetsRaw, reservedRaw, amountRaw)

  const valid = inputsOk && !invalidReserve
  const showResult = valid && preview.ok
  const shownAssets = valid ? (preview.ok ? preview.assetsAfter : assetsRaw) : assetsRaw
  const shownReserved = valid ? (preview.ok ? preview.reservedAfter : reservedRaw) : reservedRaw

  return (
    <div className="panel p-5 sm:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <p className="eyebrow">Spending calculator</p>
        <span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] text-ivory-mute">Pretend numbers, runs in your browser</span>
      </div>

      <div role="radiogroup" aria-label="What happens" className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            role="radio"
            aria-checked={mode === m.id}
            onClick={() => setMode(m.id)}
            className={clsx(
              'min-h-10 rounded-full border px-4 text-sm transition-colors',
              mode === m.id ? 'border-gold bg-gold/15 text-gold-soft' : 'border-line text-ivory-dim hover:border-gold/50 hover:text-ivory',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-ivory-mute">{MODES.find((m) => m.id === mode)?.help}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Field label="Vault holds (USDC)" htmlFor="calc-assets" error={a.ok ? undefined : a.error}>
          <Input id="calc-assets" inputMode="decimal" value={assets} onChange={(e) => setAssets(e.target.value)} className="num" />
        </Field>
        <Field label="Protected promises" htmlFor="calc-reserved" error={r.ok ? (invalidReserve ? 'Promises cannot exceed what the vault holds.' : undefined) : r.error}>
          <Input id="calc-reserved" inputMode="decimal" value={reserved} onChange={(e) => setReserved(e.target.value)} className="num" />
        </Field>
        <Field label="Amount" htmlFor="calc-amount" error={x.ok ? undefined : x.error}>
          <Input id="calc-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="num" />
        </Field>
      </div>

      <AllocationVisual
        assets={assetsRaw}
        reserved={reservedRaw}
        outflow={mode === 'spend' && valid && amountRaw > 0n ? { amount: amountRaw } : null}
        className="mt-4 w-full"
        idle={false}
      />

      <div className="grid gap-6 border-t border-line pt-6 md:grid-cols-[1fr_1.2fr]">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-ivory-dim">Vault holds</dt><dd className="num">{fmtUsdc(assetsRaw)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-ivory-dim">minus protected</dt><dd className="num text-gold-soft">− {fmtUsdc(reservedRaw)}</dd></div>
          <div className="flex justify-between gap-4 border-t border-line pt-2 text-base"><dt className="font-medium">equals available</dt><dd className="num font-medium text-mint">{fmtUsdc(free)}</dd></div>
        </dl>
        <div aria-live="polite">
          {!valid ? (
            <p className="text-sm text-ivory-mute">Enter valid amounts to see the outcome.</p>
          ) : preview.ok ? (
            <div className="rounded-2xl border border-mint/40 bg-mint/10 p-4">
              <p className="flex items-center gap-2 font-medium text-mint"><Check className="size-4" /> Allowed</p>
              <p className="mt-2 text-sm text-ivory-dim">
                After: vault holds <b className="num text-ivory">{fmtUsdc(shownAssets)}</b>, protected <b className="num text-gold-soft">{fmtUsdc(shownReserved)}</b>, available{' '}
                <b className="num text-mint">{fmtUsdc(preview.availableAfter)}</b>.
                {mode === 'claim' && preview.availableAfter === free && ' Available is unchanged by a claim.'}
              </p>
              {showResult && (
                <p className="display mt-2 text-3xl font-light text-mint"><AnimatedUsdc value={preview.availableAfter} /> <span className="text-base text-ivory-dim">available</span></p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-rose-alert/40 bg-rose-alert/10 p-4">
              <p className="flex items-center gap-2 font-medium text-rose-alert"><X className="size-4" /> Rejected</p>
              <p className="mt-2 text-sm text-ivory-dim">{refusalCopy(preview, fmtUsdc)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
