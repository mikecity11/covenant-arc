import { useState } from 'react'
import { ConnectKitButton } from 'connectkit'
import { Check, Copy, ExternalLink, Loader2, TriangleAlert, Wallet } from 'lucide-react'
import { Button } from '@/components/ui'
import { useWallet } from '@/hooks/useWallet'
import type { TxPhase } from '@/hooks/useTx'
import { CHAIN, addressUrl, txUrl } from '@/lib/deployment'
import { shortAddr } from '@/lib/format'

/** Address with copy and explorer link. */
export function AddressChip({ address, label }: { address: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ink-3/60 py-1 pl-3 pr-1.5 font-mono text-xs text-ivory-dim">
      {label && <span className="mr-1 text-ivory-mute">{label}</span>}
      <span title={address}>{shortAddr(address)}</span>
      <button
        type="button"
        aria-label="Copy address"
        onClick={() => {
          void navigator.clipboard?.writeText(address)
          setCopied(true)
          setTimeout(() => setCopied(false), 1400)
        }}
        className="grid size-7 place-items-center rounded-full hover:bg-ink-4 hover:text-ivory"
      >
        {copied ? <Check className="size-3.5 text-mint" /> : <Copy className="size-3.5" />}
      </button>
      <a
        href={addressUrl(address)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View address on explorer"
        className="grid size-7 place-items-center rounded-full hover:bg-ink-4 hover:text-ivory"
      >
        <ExternalLink className="size-3.5" />
      </a>
    </span>
  )
}

/**
 * The single submit control for every write: connect, switch network, then act. It refuses to
 * pretend: if the wallet is missing or on the wrong chain, the action label is replaced.
 */
export function TxButton({
  label,
  onClick,
  disabled,
  busy,
  variant = 'primary',
  disabledReason,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  busy?: boolean
  variant?: 'primary' | 'danger' | 'secondary'
  disabledReason?: string
}) {
  const { isConnected, wrongChain, switchToArc, switching } = useWallet()
  if (!isConnected) {
    return (
      <ConnectKitButton.Custom>
        {({ show }) => (
          <Button onClick={show} className="w-full">
            <Wallet className="size-4" /> Connect wallet
          </Button>
        )}
      </ConnectKitButton.Custom>
    )
  }
  if (wrongChain) {
    return (
      <Button onClick={switchToArc} busy={switching} className="w-full">
        Switch to {CHAIN.name}
      </Button>
    )
  }
  return (
    <div className="space-y-2">
      <Button variant={variant} onClick={onClick} disabled={disabled} busy={busy} className="w-full">
        {busy ? 'Working…' : label}
      </Button>
      {disabled && disabledReason && <p className="text-center text-xs text-ivory-mute">{disabledReason}</p>}
    </div>
  )
}

/** Honest transaction status: wallet, confirming, confirmed (with receipt link) or failed. */
export function TxStatus({ phase, hash, message, doneText }: { phase: TxPhase; hash?: string; message: string | null; doneText?: string }) {
  if (phase === 'idle' && !message) return null
  return (
    <div role="status" aria-live="polite" className="rounded-2xl border border-line bg-ink-3/60 p-4 text-sm">
      {phase === 'wallet' && (
        <p className="flex items-center gap-2 text-ivory-dim">
          <Loader2 className="size-4 animate-spin" /> Confirm in your wallet…
        </p>
      )}
      {phase === 'confirming' && (
        <p className="flex items-center gap-2 text-ivory-dim">
          <Loader2 className="size-4 animate-spin" /> Submitted. Waiting for confirmation on {CHAIN.name}…
        </p>
      )}
      {phase === 'confirmed' && (
        <p className="flex items-center gap-2 text-mint">
          <Check className="size-4" /> {doneText ?? 'Confirmed onchain.'}
        </p>
      )}
      {phase === 'failed' && (
        <p className="flex items-start gap-2 text-rose-alert">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" /> {message}
        </p>
      )}
      {phase === 'idle' && message && <p className="text-ivory-dim">{message}</p>}
      {hash && (
        <a
          href={txUrl(hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 font-mono text-xs text-gold-soft underline-offset-4 hover:underline"
        >
          Receipt {shortAddr(hash)} <ExternalLink className="size-3" />
        </a>
      )}
    </div>
  )
}
