import { useState } from 'react'
import { getAddress, isAddress } from 'viem'
import { Check, X } from 'lucide-react'
import { Dialog, Field, Input, Notice } from '@/components/ui'
import { TxButton, TxStatus } from '@/components/TxParts'
import { useTx } from '@/hooks/useTx'
import { vaultAbi } from '@/lib/abi'
import { CHAIN_ID, MAX_TEXT_BYTES } from '@/lib/deployment'
import { fmtUsdc, parseAmountInput, utf8Length } from '@/lib/format'
import { previewSpend, refusalCopy } from '@/lib/ledger'

type Addr = `0x${string}`

/** Owner-only discretionary payment with a preview that mirrors the vault's own check. */
export function SpendDialog({ open, onClose, vault, assets, reserved, isOwner }: { open: boolean; onClose: () => void; vault: Addr; assets: bigint; reserved: bigint; isOwner: boolean }) {
  const [to, setTo] = useState('')
  const [text, setText] = useState('')
  const [memo, setMemo] = useState('')
  const tx = useTx(() => { setText(''); setMemo('') })

  const parsed = parseAmountInput(text)
  const raw = parsed.ok ? parsed.raw : 0n
  const addrOk = isAddress(to.trim())
  const toAddr = addrOk ? getAddress(to.trim()) : undefined
  const isVaultItself = toAddr === vault
  const preview = previewSpend(assets, reserved, raw)
  const memoTooLong = utf8Length(memo) > MAX_TEXT_BYTES
  const blocked = !isOwner || !parsed.ok || raw === 0n || !addrOk || isVaultItself || !preview.ok || memoTooLong

  return (
    <Dialog open={open} onClose={onClose} title="Send a payment">
      <div className="space-y-5">
        {!isOwner && <Notice tone="gold" title="Owner only">Only the treasury owner can spend. Connect the owner wallet to enable this action.</Notice>}
        <Field label="Recipient address" htmlFor="sp-to" error={to && !addrOk ? 'Enter a valid 0x address.' : isVaultItself ? 'Cannot send to the vault itself.' : undefined}>
          <Input id="sp-to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="0x…" spellCheck={false} className="font-mono text-sm" />
        </Field>
        <Field label="Amount (USDC)" htmlFor="sp-amount" error={parsed.ok ? undefined : parsed.error}>
          <Input id="sp-amount" inputMode="decimal" placeholder="0.00" value={text} onChange={(e) => setText(e.target.value)} className="num text-lg" />
        </Field>
        <Field label="Memo (optional)" htmlFor="sp-memo" error={memoTooLong ? `Keep it under ${MAX_TEXT_BYTES} bytes.` : undefined} hint="Stored in the public event log.">
          <Input id="sp-memo" value={memo} onChange={(e) => setMemo(e.target.value)} />
        </Field>

        <div aria-live="polite" className="rounded-2xl border border-line bg-ink-3/50 p-4 text-sm">
          <p className="mb-2 text-xs uppercase tracking-[0.12em] text-ivory-mute">Transfer preview</p>
          <div className="space-y-1.5">
            <div className="flex justify-between"><span className="text-ivory-dim">Available now</span><span className="num text-mint">{fmtUsdc(assets > reserved ? assets - reserved : 0n)}</span></div>
            <div className="flex justify-between"><span className="text-ivory-dim">Protected (cannot be spent)</span><span className="num text-gold-soft">{fmtUsdc(reserved)}</span></div>
          </div>
          {parsed.ok && raw > 0n && (
            preview.ok ? (
              <p className="mt-3 flex items-start gap-2 text-mint"><Check className="mt-0.5 size-4 shrink-0" /> Allowed. Vault would hold {fmtUsdc(preview.assetsAfter)}, with {fmtUsdc(preview.availableAfter)} still available.</p>
            ) : (
              <p className="mt-3 flex items-start gap-2 text-rose-alert"><X className="mt-0.5 size-4 shrink-0" /> {refusalCopy(preview, fmtUsdc)} The vault would reject this transaction.</p>
            )
          )}
        </div>

        <TxButton
          label="Send payment"
          disabled={blocked}
          disabledReason={!isOwner ? 'Connect the owner wallet.' : undefined}
          busy={tx.busy}
          onClick={() => toAddr && void tx.run(() => tx.write({ address: vault, abi: vaultAbi, functionName: 'spend', args: [toAddr, raw, memo], chainId: CHAIN_ID }))}
        />
        <TxStatus phase={tx.phase} hash={tx.hash} message={tx.message} doneText="Payment confirmed." />
      </div>
    </Dialog>
  )
}
