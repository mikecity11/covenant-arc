import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { AllocationVisual } from '@/components/AllocationVisual'
import { AnimatedUsdc } from '@/components/AnimatedNumber'
import { ActivityList } from '@/components/app/ActivityList'
import { DepositDialog } from '@/components/app/DepositDialog'
import { SpendDialog } from '@/components/app/SpendDialog'
import { PageHeader, VaultGuard } from '@/components/app/VaultGuard'
import { AddressChip } from '@/components/TxParts'
import { Button, Pill, Spinner } from '@/components/ui'
import { useActiveVault } from '@/hooks/useActiveVault'
import { useActivity } from '@/hooks/useActivity'
import { useNowSec } from '@/hooks/useWallet'
import { CommitmentStatus } from '@/lib/abi'
import { fmtDateTime, fmtRelative, fmtUsdc, shortAddr } from '@/lib/format'

export default function Overview() {
  const av = useActiveVault()
  const { vault, state, commitments, isOwner, address } = av
  const [depositOpen, setDepositOpen] = useState(false)
  const [spendOpen, setSpendOpen] = useState(false)
  const [hover, setHover] = useState<'protected' | 'available' | null>(null)
  const now = useNowSec()
  const activity = useActivity(vault, 4)

  const upcoming = (commitments.data ?? [])
    .filter((c) => c.status === CommitmentStatus.Outstanding)
    .sort((a, b) => Number(a.dueAt - b.dueAt))
    .slice(0, 5)

  return (
    <VaultGuard av={av}>
      {vault && (
        <>
          <PageHeader eyebrow="Treasury overview" title="What is free to spend">
            <div className="flex flex-wrap items-center gap-2">
              <AddressChip address={vault} label="Vault" />
              {state.owner && <AddressChip address={state.owner} label="Owner" />}
              <Pill tone={isOwner ? 'gold' : 'neutral'}>{isOwner ? 'You are the owner' : address ? 'Contributor view' : 'Read-only'}</Pill>
            </div>
          </PageHeader>

          <section className="panel p-6 sm:p-9" aria-label="Balances">
            <p className="text-xs uppercase tracking-[0.16em] text-mint">Available to spend</p>
            <p className="display mt-2 break-words text-5xl font-light text-mint sm:text-7xl"><AnimatedUsdc value={state.available} /></p>
            <p className="mt-1 text-sm text-ivory-dim">USDC · vault balance minus protected promises</p>

            <AllocationVisual assets={state.assets} reserved={state.reserved} highlight={hover} onHover={setHover} className="mt-4 w-full" />

            <dl className="grid gap-4 border-t border-line pt-6 sm:grid-cols-3">
              <div onMouseEnter={() => setHover(null)}>
                <dt className="text-xs uppercase tracking-[0.14em] text-ivory-mute">Assets in vault</dt>
                <dd className="display mt-1 text-3xl font-light"><AnimatedUsdc value={state.assets} /></dd>
              </div>
              <div onMouseEnter={() => setHover('protected')} onMouseLeave={() => setHover(null)}>
                <dt className="text-xs uppercase tracking-[0.14em] text-gold">Reserved for promises</dt>
                <dd className="display mt-1 text-3xl font-light text-gold-soft"><AnimatedUsdc value={state.reserved} /></dd>
              </div>
              <div onMouseEnter={() => setHover('available')} onMouseLeave={() => setHover(null)}>
                <dt className="text-xs uppercase tracking-[0.14em] text-mint">Available</dt>
                <dd className="display mt-1 text-3xl font-light text-mint"><AnimatedUsdc value={state.available} /></dd>
              </div>
            </dl>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button onClick={() => setDepositOpen(true)}><ArrowDownToLine className="size-4" /> Deposit USDC</Button>
              <Button variant="secondary" onClick={() => setSpendOpen(true)}><ArrowUpFromLine className="size-4" /> Send payment</Button>
              {!isOwner && address && <p className="self-center text-xs text-ivory-mute">Only the owner can send payments.</p>}
            </div>
          </section>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <section className="panel p-6" aria-labelledby="next-payments">
              <div className="flex items-baseline justify-between">
                <h2 id="next-payments" className="display text-2xl font-light">Next payments</h2>
                <Link to="/app/commitments" className="text-sm text-gold-soft underline-offset-4 hover:underline">All promises</Link>
              </div>
              {commitments.isLoading ? <div className="py-8"><Spinner label="Loading…" /></div> : upcoming.length === 0 ? (
                <p className="py-8 text-sm text-ivory-mute">No protected promises are outstanding.</p>
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {upcoming.map((c) => (
                    <li key={c.id.toString()}>
                      <Link to={`/app/commitments/${c.id}`} className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-gold-soft">
                        <span className="min-w-0 break-words">
                          <span className="block text-sm font-medium">{c.description || `Promise #${c.id}`}</span>
                          <span className="block text-xs text-ivory-mute">{shortAddr(c.recipient)} · {fmtDateTime(c.dueAt)} · {fmtRelative(c.dueAt, now)}</span>
                        </span>
                        <span className="num text-gold-soft">{fmtUsdc(c.amount)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="panel p-6" aria-labelledby="recent">
              <div className="flex items-baseline justify-between">
                <h2 id="recent" className="display text-2xl font-light">Recent activity</h2>
                <Link to="/app/activity" className="text-sm text-gold-soft underline-offset-4 hover:underline">Full history</Link>
              </div>
              {activity.isLoading ? <div className="py-8"><Spinner label="Scanning recent blocks…" /></div> : activity.isError ? (
                <p className="py-8 text-sm text-rose-alert">Could not load events from the RPC. Try again shortly.</p>
              ) : activity.data && activity.data.items.length > 0 ? (
                <ActivityList items={activity.data.items.slice(0, 4)} />
              ) : (
                <p className="py-8 text-sm text-ivory-mute">No events found in the recent window. Older activity is under Full history.</p>
              )}
            </section>
          </div>

          <DepositDialog open={depositOpen} onClose={() => setDepositOpen(false)} vault={vault} assets={state.assets} reserved={state.reserved} />
          <SpendDialog open={spendOpen} onClose={() => setSpendOpen(false)} vault={vault} assets={state.assets} reserved={state.reserved} isOwner={isOwner} />
        </>
      )}
    </VaultGuard>
  )
}
