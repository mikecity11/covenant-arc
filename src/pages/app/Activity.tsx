import { useState } from 'react'
import { ActivityList } from '@/components/app/ActivityList'
import { PageHeader, VaultGuard } from '@/components/app/VaultGuard'
import { Button, Notice, Spinner } from '@/components/ui'
import { useActiveVault } from '@/hooks/useActiveVault'
import { useActivity } from '@/hooks/useActivity'
import { LOG_WINDOW } from '@/lib/deployment'

export default function Activity() {
  const av = useActiveVault()
  const [windows, setWindows] = useState(8)
  const q = useActivity(av.vault, windows)
  const d = q.data
  const blocksBack = d ? d.head - d.scannedFrom + 1n : 0n

  return (
    <VaultGuard av={av}>
      <PageHeader eyebrow="Activity" title="Transaction history" />
      {q.isLoading ? (
        <Spinner label="Scanning blocks for vault events…" />
      ) : q.isError || !d ? (
        <Notice tone="alert" title="Could not read events">The RPC did not return logs. Try again in a moment.<div className="mt-3"><Button variant="secondary" onClick={() => void q.refetch()}>Retry</Button></div></Notice>
      ) : (
        <>
          <p className="mb-5 text-sm text-ivory-mute">
            Scanned {blocksBack.toLocaleString()} blocks ({d.scannedFrom.toString()} to {d.head.toString()}).{' '}
            {d.complete ? 'This reaches the block where this treasury was created, so the history is complete.' : 'Older events may exist beyond this range.'}
          </p>
          {d.items.length === 0 ? (
            <div className="panel p-10 text-center text-ivory-dim">No vault events found in this range.</div>
          ) : (
            <div className="panel px-5 sm:px-7"><ActivityList items={d.items} /></div>
          )}
          {!d.complete && (
            <div className="mt-6 text-center">
              <Button variant="secondary" onClick={() => setWindows((w) => w + 8)} busy={q.isFetching}>Load older ({(LOG_WINDOW * 8n).toLocaleString()} more blocks)</Button>
            </div>
          )}
        </>
      )}
    </VaultGuard>
  )
}
