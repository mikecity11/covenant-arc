import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import clsx from 'clsx'
import { CommitmentFormDialog } from '@/components/app/CommitmentFormDialog'
import { StatusPill } from '@/components/app/CommitmentActions'
import { PageHeader, VaultGuard } from '@/components/app/VaultGuard'
import { Button, Input, Spinner } from '@/components/ui'
import { useActiveVault } from '@/hooks/useActiveVault'
import { useNowSec } from '@/hooks/useWallet'
import { CommitmentStatus } from '@/lib/abi'
import { fmtDateTime, fmtUsdc, shortAddr } from '@/lib/format'

type Filter = 'all' | 'protected' | 'claimable' | 'claimed' | 'released'
const FILTERS: Array<[Filter, string]> = [['all', 'All'], ['protected', 'Protected'], ['claimable', 'Claimable now'], ['claimed', 'Claimed'], ['released', 'Released']]

export default function Commitments() {
  const av = useActiveVault()
  const { vault, state, commitments, isOwner } = av
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const now = useNowSec()

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...(commitments.data ?? [])]
      .reverse()
      .filter((c) => {
        const due = Number(c.dueAt) <= now
        if (filter === 'protected' && !(c.status === CommitmentStatus.Outstanding && !due)) return false
        if (filter === 'claimable' && !(c.status === CommitmentStatus.Outstanding && due)) return false
        if (filter === 'claimed' && c.status !== CommitmentStatus.Claimed) return false
        if (filter === 'released' && c.status !== CommitmentStatus.Released) return false
        return !q || c.recipient.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      })
  }, [commitments.data, filter, query, now])

  return (
    <VaultGuard av={av}>
      {vault && (
        <>
          <PageHeader eyebrow="Commitments" title="Protected promises">
            <Button onClick={() => setOpen(true)} disabled={!isOwner} title={isOwner ? undefined : 'Only the owner can record promises'}><Plus className="size-4" /> New promise</Button>
          </PageHeader>

          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
              {FILTERS.map(([id, label]) => (
                <button
                  key={id}
                  aria-pressed={filter === id}
                  onClick={() => setFilter(id)}
                  className={clsx('min-h-10 rounded-full border px-4 text-sm transition-colors', filter === id ? 'border-gold bg-gold/15 text-gold-soft' : 'border-line text-ivory-dim hover:border-gold/50 hover:text-ivory')}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ivory-mute" aria-hidden />
              <Input aria-label="Search recipient or description" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
            </div>
          </div>

          {commitments.isLoading ? (
            <div className="py-16 text-center"><Spinner label="Reading promises from the vault…" /></div>
          ) : rows.length === 0 ? (
            <div className="panel p-10 text-center text-ivory-dim">
              {(commitments.data?.length ?? 0) === 0 ? (isOwner ? 'No promises yet. Record the first one to reserve funds for a contributor.' : 'No promises have been recorded in this vault.') : 'Nothing matches this filter.'}
            </div>
          ) : (
            <div className="panel overflow-hidden">
              <div className="scroll-thin overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <caption className="sr-only">Commitments in this treasury</caption>
                  <thead className="border-b border-line bg-ink-3/50 text-xs uppercase tracking-[0.1em] text-ivory-mute">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-medium">Promise</th>
                      <th scope="col" className="px-5 py-3 font-medium">Recipient</th>
                      <th scope="col" className="px-5 py-3 font-medium">Due</th>
                      <th scope="col" className="px-5 py-3 text-right font-medium">Amount</th>
                      <th scope="col" className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {rows.map((c) => (
                      <tr key={c.id.toString()} className="transition-colors hover:bg-ink-3/40">
                        <td className="px-5 py-4"><Link to={`/app/commitments/${c.id}`} className="font-medium hover:text-gold-soft">#{c.id.toString()} {c.description || 'No description'}</Link></td>
                        <td className="px-5 py-4 font-mono text-xs text-ivory-dim">{shortAddr(c.recipient)}</td>
                        <td className="px-5 py-4 text-ivory-dim">{fmtDateTime(c.dueAt)}</td>
                        <td className="num px-5 py-4 text-right text-gold-soft">{fmtUsdc(c.amount)}</td>
                        <td className="px-5 py-4"><StatusPill c={c} now={now} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <CommitmentFormDialog open={open} onClose={() => setOpen(false)} vault={vault} assets={state.assets} reserved={state.reserved} isOwner={isOwner} />
        </>
      )}
    </VaultGuard>
  )
}
