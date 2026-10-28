import { useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Button, Dialog, Notice, Pill } from '@/components/ui'
import { TxButton, TxStatus } from '@/components/TxParts'
import { useTx } from '@/hooks/useTx'
import { useWallet } from '@/hooks/useWallet'
import { CommitmentStatus, vaultAbi, type CommitmentView } from '@/lib/abi'
import { CHAIN_ID } from '@/lib/deployment'
import { fmtUsdc } from '@/lib/format'

type Addr = `0x${string}`

export function StatusPill({ c, now }: { c: CommitmentView; now: number }) {
  if (c.status === CommitmentStatus.Claimed) return <Pill>Claimed</Pill>
  if (c.status === CommitmentStatus.Released) return <Pill>Released</Pill>
  return Number(c.dueAt) <= now ? <Pill tone="mint">Claimable</Pill> : <Pill tone="gold">Protected</Pill>
}

/** Claim and release controls. Only the named recipient sees enabled actions. */
export function CommitmentActions({ vault, c, now }: { vault: Addr; c: CommitmentView; now: number }) {
  const { address } = useWallet()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const claim = useTx()
  const release = useTx(() => setConfirmOpen(false))
  const [sure, setSure] = useState(false)

  const isRecipient = Boolean(address && address.toLowerCase() === c.recipient.toLowerCase())
  const outstanding = c.status === CommitmentStatus.Outstanding
  const due = Number(c.dueAt) <= now

  if (!outstanding) return <p className="text-sm text-ivory-mute">This promise has ended. Nothing more can be done with it.</p>

  return (
    <div className="space-y-4">
      {!isRecipient && <Notice>Only the recipient ({c.recipient.slice(0, 6)}…{c.recipient.slice(-4)}) can claim or release this promise.{address ? ' Your connected wallet is not the recipient.' : ''}</Notice>}
      <div className="grid gap-3 sm:grid-cols-2">
        <TxButton
          label={`Claim ${fmtUsdc(c.amount)} USDC`}
          disabled={!isRecipient || !due}
          disabledReason={!isRecipient ? undefined : !due ? 'Not due yet. Claims open at the due time.' : undefined}
          busy={claim.busy}
          onClick={() => void claim.run(() => claim.write({ address: vault, abi: vaultAbi, functionName: 'claim', args: [c.id], chainId: CHAIN_ID }))}
        />
        <Button variant="danger" disabled={!isRecipient} onClick={() => { setSure(false); release.reset(); setConfirmOpen(true) }}>Release (forfeit)…</Button>
      </div>
      <TxStatus phase={claim.phase} hash={claim.hash} message={claim.message} doneText="Claimed. The USDC is now in your wallet." />

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Forfeit this promise?">
        <div className="space-y-5">
          <Notice tone="alert" title="This cannot be undone">
            <p className="flex gap-2"><TriangleAlert className="mt-0.5 size-4 shrink-0 text-rose-alert" /> Releasing gives up your claim to {fmtUsdc(c.amount)} USDC. No money is sent to you. The amount returns to the treasury's available funds.</p>
          </Notice>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-ivory-dim">
            <input type="checkbox" checked={sure} onChange={(e) => setSure(e.target.checked)} className="mt-1 size-5 accent-[#f08a8a]" />
            <span>I confirm that I am permanently forfeiting this promise.</span>
          </label>
          <TxButton
            label="Release and forfeit"
            variant="danger"
            disabled={!sure}
            busy={release.busy}
            onClick={() => void release.run(() => release.write({ address: vault, abi: vaultAbi, functionName: 'release', args: [c.id, sure], chainId: CHAIN_ID }))}
          />
          <TxStatus phase={release.phase} hash={release.hash} message={release.message} doneText="Promise released." />
        </div>
      </Dialog>
    </div>
  )
}
