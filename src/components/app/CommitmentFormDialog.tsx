import { useState } from 'react'
import { getAddress, isAddress } from 'viem'
import { Check, X } from 'lucide-react'
import { Dialog, Field, Input, Notice, TextArea } from '@/components/ui'
import { TxButton, TxStatus } from '@/components/TxParts'
import { useTx } from '@/hooks/useTx'
import { useNowSec } from '@/hooks/useWallet'
import { vaultAbi } from '@/lib/abi'
import { CHAIN_ID, MAX_TEXT_BYTES } from '@/lib/deployment'
import { fmtUsdc, localInputToUnix, parseAmountInput, utf8Length } from '@/lib/format'
import { previewCommit, refusalCopy } from '@/lib/ledger'

type Addr = `0x${string}`

/** Owner-only: records a fixed, fully funded promise. Shows the reserved/available result first. */
export function CommitmentFormDialog({ open, onClose, vault, assets, reserved, isOwner }: { open: boolean; onClose: () => void; vault: Addr; assets: bigint; reserved: bigint; isOwner: boolean }) {
  const now = useNowSec()
  const [recipient, setRecipient] = useState('')
  const [text, setText] = useState('')
  const [due, setDue] = useState('')
  const [desc, setDesc] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const tx = useTx(() => { setRecipient(''); setText(''); setDue(''); setDesc(''); setAcknowledged(false) })

  const parsed = parseAmountInput(text)
  const raw = parsed.ok ? parsed.raw : 0n
  const addrOk = isAddress(recipient.trim())
  const toAddr = addrOk ? getAddress(recipient.trim()) : undefined
  const dueAt = localInputToUnix(due)
  const dueOk = dueAt !== null && Number(dueAt) > now
  const descBytes = utf8Length(desc)
  const preview = previewCommit(assets, reserved, raw)
  const recipientBad = Boolean(toAddr && toAddr === vault)

  const blocked = !isOwner || !parsed.ok || raw === 0n || !addrOk || recipientBad || !dueOk || descBytes > MAX_TEXT_BYTES || !preview.ok || !acknowledged

  return (
    <Dialog open={open} onClose={onClose} title="Record a promise">
      <div className="space-y-5">
        {!isOwner && <Notice tone="gold" title="Owner only">Only the treasury owner can record promises.</Notice>}
        <Field label="Recipient address" htmlFor="c-to" error={recipient && !addrOk ? 'Enter a valid 0x address.' : recipientBad ? 'Cannot promise to the vault itself.' : undefined}>
          <Input id="c-to" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="0x…" spellCheck={false} className="font-mono text-sm" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount (USDC)" htmlFor="c-amount" error={parsed.ok ? undefined : parsed.error}>
            <Input id="c-amount" inputMode="decimal" placeholder="0.00" value={text} onChange={(e) => setText(e.target.value)} className="num" />
          </Field>
          <Field label="Due" htmlFor="c-due" error={due && !dueOk ? 'Choose a time in the future.' : undefined}>
            <Input id="c-due" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
        </div>
        <Field label="Description" htmlFor="c-desc" error={descBytes > MAX_TEXT_BYTES ? 'Too long.' : undefined} hint={`${descBytes}/${MAX_TEXT_BYTES} bytes. Public onchain.`}>
          <TextArea id="c-desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. November contributor stipend" />
        </Field>

        <div aria-live="polite" className="rounded-2xl border border-line bg-ink-3/50 p-4 text-sm">
          <p className="mb-2 text-xs uppercase tracking-[0.12em] text-ivory-mute">Preview before you sign</p>
          <div className="space-y-1.5">
            <div className="flex justify-between"><span className="text-ivory-dim">Reserved</span><span className="num text-gold-soft">{fmtUsdc(reserved)} → {fmtUsdc(preview.ok ? preview.reservedAfter : reserved)}</span></div>
            <div className="flex justify-between"><span className="text-ivory-dim">Available</span><span className="num text-mint">{fmtUsdc(assets > reserved ? assets - reserved : 0n)} → {fmtUsdc(preview.ok ? preview.availableAfter : assets > reserved ? assets - reserved : 0n)}</span></div>
          </div>
          {parsed.ok && raw > 0n && (preview.ok ? (
            <p className="mt-3 flex items-start gap-2 text-mint"><Check className="mt-0.5 size-4 shrink-0" /> Fully funded. The vault will accept this promise.</p>
          ) : (
            <p className="mt-3 flex items-start gap-2 text-rose-alert"><X className="mt-0.5 size-4 shrink-0" /> {refusalCopy(preview, fmtUsdc)} Deposit more first.</p>
          ))}
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-sm text-ivory-dim">
          <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} className="mt-1 size-5 accent-[#c9a55c]" />
          <span>I understand this promise is permanent: I cannot cancel it, change it or take the money back. Only the recipient can claim or release it.</span>
        </label>

        <TxButton
          label="Record promise"
          disabled={blocked}
          busy={tx.busy}
          disabledReason={!isOwner ? 'Connect the owner wallet.' : undefined}
          onClick={() => toAddr && dueAt !== null && void tx.run(() => tx.write({ address: vault, abi: vaultAbi, functionName: 'createCommitment', args: [toAddr, raw, dueAt, desc], chainId: CHAIN_ID }))}
        />
        <TxStatus phase={tx.phase} hash={tx.hash} message={tx.message} doneText="Promise recorded and reserved." />
      </div>
    </Dialog>
  )
}
