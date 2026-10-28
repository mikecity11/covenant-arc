import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { CommitmentActions, StatusPill } from '@/components/app/CommitmentActions'
import { VaultGuard } from '@/components/app/VaultGuard'
import { AddressChip } from '@/components/TxParts'
import { Notice, Spinner } from '@/components/ui'
import { useActiveVault } from '@/hooks/useActiveVault'
import { useNowSec } from '@/hooks/useWallet'
import { fmtDateTime, fmtRelative, fmtUsdc } from '@/lib/format'

export default function CommitmentDetail() {
  const { id } = useParams()
  const av = useActiveVault()
  const now = useNowSec()
  const wanted = id && /^\d+$/.test(id) ? BigInt(id) : undefined
  const c = av.commitments.data?.find((x) => x.id === wanted)

  return (
    <VaultGuard av={av}>
      <Link to="/app/commitments" className="mb-6 inline-flex min-h-10 items-center gap-2 text-sm text-ivory-dim hover:text-ivory"><ArrowLeft className="size-4" /> All promises</Link>
      {av.commitments.isLoading ? <Spinner label="Loading promise…" /> : !c || !av.vault ? (
        <Notice tone="alert" title="Promise not found">There is no promise with that number in this treasury.</Notice>
      ) : (
        <article className="panel p-6 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Promise #{c.id.toString()}</p>
              <h1 className="display mt-2 max-w-xl break-words text-3xl font-light sm:text-4xl">{c.description || 'No description'}</h1>
            </div>
            <StatusPill c={c} now={now} />
          </div>
          <p className="display mt-8 break-words text-5xl font-light text-gold-soft sm:text-7xl"><span className="num">{fmtUsdc(c.amount)}</span> <span className="text-2xl text-ivory-dim">USDC</span></p>
          <dl className="mt-8 grid gap-6 border-t border-line pt-6 sm:grid-cols-3">
            <div><dt className="text-xs uppercase tracking-[0.14em] text-ivory-mute">Recipient</dt><dd className="mt-2"><AddressChip address={c.recipient} /></dd></div>
            <div><dt className="text-xs uppercase tracking-[0.14em] text-ivory-mute">Due</dt><dd className="mt-2 text-sm">{fmtDateTime(c.dueAt)}<span className="block text-xs text-ivory-mute">{fmtRelative(c.dueAt, now)}</span></dd></div>
            <div><dt className="text-xs uppercase tracking-[0.14em] text-ivory-mute">Recorded</dt><dd className="mt-2 text-sm">{fmtDateTime(c.createdAt)}</dd></div>
          </dl>
          <div className="mt-8 border-t border-line pt-6">
            <h2 className="display mb-4 text-2xl font-light">Recipient actions</h2>
            <CommitmentActions vault={av.vault} c={c} now={now} />
          </div>
          <p className="mt-8 text-xs leading-relaxed text-ivory-mute">The owner cannot cancel, change or delay this promise. It ends only when the recipient claims or releases it.</p>
        </article>
      )}
    </VaultGuard>
  )
}
