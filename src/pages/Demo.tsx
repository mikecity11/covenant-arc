import { useReducer, useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { AllocationVisual } from '@/components/AllocationVisual'
import { AnimatedUsdc } from '@/components/AnimatedNumber'
import { Button, Field, Input, Notice, Pill } from '@/components/ui'
import { availableOf, previewClaim, previewCommit, previewDeposit, previewRelease, previewSpend, refusalCopy } from '@/lib/ledger'
import { fmtUsdc, parseAmountInput } from '@/lib/format'
import { parseUsdc } from '@/onchain-money'

type Status = 'protected' | 'claimed' | 'released'
interface SimPromise { id: number; who: string; amount: bigint; dueDay: number; status: Status }
interface LogLine { n: number; ok: boolean; text: string }
interface Sim { assets: bigint; promises: SimPromise[]; day: number; log: LogLine[] }

type Act =
  | { t: 'reset' }
  | { t: 'example' }
  | { t: 'deposit'; amount: bigint }
  | { t: 'commit'; who: string; amount: bigint; inDays: number }
  | { t: 'spend'; amount: bigint }
  | { t: 'advance'; days: number }
  | { t: 'claim'; id: number }
  | { t: 'release'; id: number }

const reservedOf = (s: Sim) => s.promises.filter((p) => p.status === 'protected').reduce((a, p) => a + p.amount, 0n)
const empty: Sim = { assets: 0n, promises: [], day: 0, log: [] }

function say(s: Sim, ok: boolean, text: string): LogLine[] {
  return [{ n: s.log.length + 1, ok, text }, ...s.log].slice(0, 40)
}

function reduce(s: Sim, a: Act): Sim {
  const reserved = reservedOf(s)
  switch (a.t) {
    case 'reset':
      return empty
    case 'example': {
      const base: Sim = { assets: parseUsdc('3000'), day: 0, log: [], promises: [
        { id: 0, who: 'Recipient A', amount: parseUsdc('1200'), dueDay: 7, status: 'protected' },
        { id: 1, who: 'Recipient B', amount: parseUsdc('600'), dueDay: 14, status: 'protected' },
      ] }
      return { ...base, log: say(base, true, 'Loaded the example: 3,000 in the vault, two promises totalling 1,800.') }
    }
    case 'deposit': {
      const p = previewDeposit(s.assets, reserved, a.amount)
      if (!p.ok) return { ...s, log: say(s, false, refusalCopy(p, fmtUsdc)) }
      return { ...s, assets: p.assetsAfter, log: say(s, true, `Deposited ${fmtUsdc(a.amount)}.`) }
    }
    case 'commit': {
      const p = previewCommit(s.assets, reserved, a.amount)
      if (!p.ok) return { ...s, log: say(s, false, `Promise to ${a.who} rejected. ${refusalCopy(p, fmtUsdc)}`) }
      const id = s.promises.length
      return { ...s, promises: [...s.promises, { id, who: a.who, amount: a.amount, dueDay: s.day + a.inDays, status: 'protected' }], log: say(s, true, `Promised ${fmtUsdc(a.amount)} to ${a.who}, due day ${s.day + a.inDays}.`) }
    }
    case 'spend': {
      const p = previewSpend(s.assets, reserved, a.amount)
      if (!p.ok) return { ...s, log: say(s, false, `Payment of ${fmtUsdc(a.amount)} rejected. ${refusalCopy(p, fmtUsdc)}`) }
      return { ...s, assets: p.assetsAfter, log: say(s, true, `Paid ${fmtUsdc(a.amount)} from available funds.`) }
    }
    case 'advance':
      return { ...s, day: s.day + a.days, log: say(s, true, `Advanced ${a.days} day${a.days === 1 ? '' : 's'} to day ${s.day + a.days}.`) }
    case 'claim': {
      const pr = s.promises.find((x) => x.id === a.id)
      if (!pr || pr.status !== 'protected') return { ...s, log: say(s, false, 'That promise has already ended.') }
      if (s.day < pr.dueDay) return { ...s, log: say(s, false, `${pr.who} cannot claim yet. Due on day ${pr.dueDay}.`) }
      const p = previewClaim(s.assets, reserved, pr.amount)
      return { ...s, assets: p.assetsAfter, promises: s.promises.map((x) => (x.id === a.id ? { ...x, status: 'claimed' } : x)), log: say(s, true, `${pr.who} claimed ${fmtUsdc(pr.amount)}. Available is unchanged.`) }
    }
    case 'release': {
      const pr = s.promises.find((x) => x.id === a.id)
      if (!pr || pr.status !== 'protected') return { ...s, log: say(s, false, 'That promise has already ended.') }
      const p = previewRelease(s.assets, reserved, pr.amount)
      void p
      return { ...s, promises: s.promises.map((x) => (x.id === a.id ? { ...x, status: 'released' } : x)), log: say(s, true, `${pr.who} released ${fmtUsdc(pr.amount)}. No USDC was sent; it is now available.`) }
    }
  }
}

export default function Demo() {
  const [s, dispatch] = useReducer(reduce, empty)
  const [amt, setAmt] = useState('500')
  const [who, setWho] = useState('Recipient C')
  const [days, setDays] = useState('7')
  const [confirm, setConfirm] = useState<number | null>(null)
  const parsed = parseAmountInput(amt)
  const dayN = Math.max(0, Math.min(365, Number.parseInt(days, 10) || 0))
  const reserved = reservedOf(s)
  const free = availableOf(s.assets, reserved)
  const raw = parsed.ok ? parsed.raw : 0n

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-20">
      <div className="rounded-2xl border-2 border-dashed border-gold/60 bg-gold/10 p-4 sm:p-5" role="note">
        <p className="flex items-center gap-2 font-semibold text-gold-soft"><FlaskConical className="size-5" /> SIMULATION ONLY</p>
        <p className="mt-1 text-sm text-ivory-dim">Everything on this page is pretend USDC computed in your browser. It does not connect to a wallet or the chain, and none of these balances are live funds.</p>
      </div>

      <h1 className="display mt-10 text-4xl font-light sm:text-5xl">Isolated demo</h1>
      <p className="mt-3 max-w-2xl text-ivory-dim">Use the same rules the vault enforces: promises must be funded, payments must fit inside available funds, claims wait for the due day.</p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={() => dispatch({ t: 'example' })}>Load the 3,000 / 1,800 example</Button>
        <Button variant="secondary" onClick={() => dispatch({ t: 'reset' })}>Reset</Button>
        <Pill tone="gold">Simulated day {s.day}</Pill>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_1fr]">
        <div className="panel p-5 sm:p-7">
          <AllocationVisual assets={s.assets} reserved={reserved} outflow={parsed.ok && raw > 0n && s.assets > 0n ? { amount: raw } : null} className="w-full" />
          <dl className="grid grid-cols-3 gap-3 border-t border-line pt-5">
            <div><dt className="text-[11px] uppercase tracking-[0.14em] text-ivory-mute">Simulated vault</dt><dd className="display mt-1 text-2xl font-light"><AnimatedUsdc value={s.assets} /></dd></div>
            <div><dt className="text-[11px] uppercase tracking-[0.14em] text-gold">Protected</dt><dd className="display mt-1 text-2xl font-light text-gold-soft"><AnimatedUsdc value={reserved} /></dd></div>
            <div><dt className="text-[11px] uppercase tracking-[0.14em] text-mint">Available</dt><dd className="display mt-1 text-2xl font-light text-mint"><AnimatedUsdc value={free} /></dd></div>
          </dl>
        </div>

        <div className="panel space-y-5 p-5 sm:p-7">
          <Field label="Amount (simulated USDC)" htmlFor="sim-amt" error={parsed.ok ? undefined : parsed.error}>
            <Input id="sim-amt" inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} className="num" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" disabled={!parsed.ok} onClick={() => dispatch({ t: 'deposit', amount: raw })}>Deposit</Button>
            <Button variant="secondary" disabled={!parsed.ok} onClick={() => dispatch({ t: 'spend', amount: raw })}>Pay (owner)</Button>
          </div>
          <div className="grid grid-cols-[1fr_96px] gap-3">
            <Field label="Promise to" htmlFor="sim-who"><Input id="sim-who" value={who} onChange={(e) => setWho(e.target.value.slice(0, 24))} /></Field>
            <Field label="Due in days" htmlFor="sim-days"><Input id="sim-days" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ''))} className="num" /></Field>
          </div>
          <Button className="w-full" disabled={!parsed.ok || who.trim() === ''} onClick={() => dispatch({ t: 'commit', who: who.trim(), amount: raw, inDays: dayN })}>Record a promise</Button>
          <div className="flex flex-wrap gap-2 border-t border-line pt-4">
            <span className="mr-1 self-center text-sm text-ivory-dim">Advance time:</span>
            {[1, 7, 30].map((d) => (<Button key={d} variant="ghost" className="min-h-10 px-4" onClick={() => dispatch({ t: 'advance', days: d })}>+{d}d</Button>))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="sim-promises" className="panel p-5 sm:p-7">
          <h2 id="sim-promises" className="display text-2xl font-light">Simulated promises</h2>
          {s.promises.length === 0 ? <p className="mt-4 text-sm text-ivory-mute">None yet. Record one or load the example.</p> : (
            <ul className="mt-4 divide-y divide-line">
              {s.promises.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{p.who} <span className="num text-gold-soft">{fmtUsdc(p.amount)}</span></p>
                    <p className="text-xs text-ivory-mute">Due day {p.dueDay} · {p.status}</p>
                  </div>
                  {p.status === 'protected' && (
                    confirm === p.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-rose-alert">Forfeit this claim?</span>
                        <Button variant="danger" className="min-h-10 px-4" onClick={() => { dispatch({ t: 'release', id: p.id }); setConfirm(null) }}>Yes, release</Button>
                        <Button variant="ghost" className="min-h-10 px-3" onClick={() => setConfirm(null)}>Keep</Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="secondary" className="min-h-10 px-4" onClick={() => dispatch({ t: 'claim', id: p.id })}>Claim</Button>
                        <Button variant="ghost" className="min-h-10 px-4" onClick={() => setConfirm(p.id)}>Release</Button>
                      </div>
                    )
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="sim-log" className="panel p-5 sm:p-7">
          <h2 id="sim-log" className="display text-2xl font-light">What happened</h2>
          {s.log.length === 0 ? <p className="mt-4 text-sm text-ivory-mute">Actions appear here.</p> : (
            <ol aria-live="polite" className="scroll-thin mt-4 max-h-80 space-y-2 overflow-y-auto pr-1 text-sm">
              {s.log.map((l) => (
                <li key={l.n} className={l.ok ? 'text-ivory-dim' : 'text-rose-alert'}><span className="mr-2 font-mono text-xs text-ivory-mute">#{l.n}</span>{l.text}</li>
              ))}
            </ol>
          )}
        </section>
      </div>
      <div className="mt-8"><Notice>Ready for the real thing? Open the <a className="text-gold-soft underline-offset-4 hover:underline" href="/app">treasury app</a>, which is configured for Arc mainnet. Live writes require a verified deployment and use real USDC.</Notice></div>
    </div>
  )
}
