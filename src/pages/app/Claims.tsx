import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ConnectKitButton } from 'connectkit'
import { CommitmentActions, StatusPill } from '@/components/app/CommitmentActions'
import { PageHeader, VaultGuard } from '@/components/app/VaultGuard'
import { Button, Notice, Spinner } from '@/components/ui'
import { useActiveVault } from '@/hooks/useActiveVault'
import { useNowSec } from '@/hooks/useWallet'
import { CommitmentStatus } from '@/lib/abi'
import { fmtDateTime, fmtRelative, fmtUsdc } from '@/lib/format'

export default function Claims() {
  const av = useActiveVault()
  const now = useNowSec()
  const mine = useMemo(
    () => (av.commitments.data ?? []).filter((c) => av.address && c.recipient.toLowerCase() === av.address.toLowerCase()).reverse(),
    [av.commitments.data, av.address],
  )
  const claimableTotal = mine.filter((c) => c.status === CommitmentStatus.Outstanding && Number(c.dueAt) <= now).reduce((a, c) => a + c.amount, 0n)

  return (
    <VaultGuard av={av}>
      <PageHeader eyebrow="Recipient portal" title="Promises made to you" />
      {!av.address ? (
        <div className="panel p-10 text-center">
          <p className="text-ivory-dim">Connect the wallet a promise was made to. Claims are sent from that address.</p>
          <div className="mt-6 flex justify-center">
            <ConnectKitButton.Custom>{({ show }) => <Button onClick={show}>Connect wallet</Button>}</ConnectKitButton.Custom>
          </div>
        </div>
      ) : av.commitments.isLoading ? (
        <Spinner label="Looking for your promises…" />
      ) : mine.length === 0 ? (
        <Notice title="Nothing addressed to this wallet">This treasury has no promises for your connected address. If you expected one, check that you are on the right wallet and treasury.</Notice>
      ) : (
        <>
          <p className="mb-6 text-ivory-dim">Claimable right now: <b className="num text-mint">{fmtUsdc(claimableTotal)} USDC</b>. Nothing is sent automatically; each claim is a transaction you submit and pay gas for.</p>
          <ul className="space-y-6">
            {mine.map((c) => (
              <li key={c.id.toString()} className="panel p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 break-words">
                    <Link to={`/app/commitments/${c.id}`} className="display text-2xl font-light hover:text-gold-soft">{c.description || `Promise #${c.id}`}</Link>
                    <p className="mt-1 text-sm text-ivory-mute">Due {fmtDateTime(c.dueAt)} · {fmtRelative(c.dueAt, now)}</p>
                  </div>
                  <div className="text-right">
                    <p className="display num text-3xl font-light text-gold-soft">{fmtUsdc(c.amount)}</p>
                    <div className="mt-1"><StatusPill c={c} now={now} /></div>
                  </div>
                </div>
                <div className="mt-5 border-t border-line pt-5">{av.vault && <CommitmentActions vault={av.vault} c={c} now={now} />}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </VaultGuard>
  )
}
