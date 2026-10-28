import { useState } from 'react'
import { useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { Check } from 'lucide-react'
import { Dialog, Field, Input, Notice } from '@/components/ui'
import { TxButton, TxStatus } from '@/components/TxParts'
import { useTx } from '@/hooks/useTx'
import { useWallet } from '@/hooks/useWallet'
import { vaultAbi } from '@/lib/abi'
import { CHAIN_ID, USDC_ADDRESS } from '@/lib/deployment'
import { fmtUsdc, parseAmountInput } from '@/lib/format'
import { previewDeposit } from '@/lib/ledger'

type Addr = `0x${string}`

/** Two real transactions: approve an exact amount, then deposit it. */
export function DepositDialog({ open, onClose, vault, assets, reserved }: { open: boolean; onClose: () => void; vault: Addr; assets: bigint; reserved: bigint }) {
  const { address, ready } = useWallet()
  const [text, setText] = useState('')
  const parsed = parseAmountInput(text)
  const raw = parsed.ok ? parsed.raw : 0n

  const balance = useReadContract({
    address: USDC_ADDRESS, abi: erc20Abi, functionName: 'balanceOf', args: address ? [address] : undefined,
    chainId: CHAIN_ID, query: { enabled: Boolean(address), refetchInterval: 8000 },
  })
  const allowance = useReadContract({
    address: USDC_ADDRESS, abi: erc20Abi, functionName: 'allowance', args: address ? [address, vault] : undefined,
    chainId: CHAIN_ID, query: { enabled: Boolean(address), refetchInterval: 4000 },
  })

  const approveTx = useTx(() => void allowance.refetch())
  const depositTx = useTx(() => setText(''))

  const bal = balance.data ?? 0n
  const allowed = allowance.data ?? 0n
  const needsApproval = raw > 0n && allowed < raw
  const insufficient = parsed.ok && raw > bal && balance.data !== undefined
  const preview = previewDeposit(assets, reserved, raw)
  const invalid = !parsed.ok || raw === 0n || insufficient

  const reason = !parsed.ok ? parsed.error : insufficient ? 'Your wallet does not hold that much USDC.' : undefined

  return (
    <Dialog open={open} onClose={onClose} title="Deposit USDC">
      <div className="space-y-5">
        <p className="text-sm text-ivory-dim">Anyone can fund this treasury. Deposits become available funds immediately; they only become protected when the owner records a promise.</p>
        <Field label="Amount (USDC)" htmlFor="dep-amount" error={reason} hint={balance.data !== undefined ? `Wallet balance: ${fmtUsdc(bal)} USDC` : undefined}>
          <Input id="dep-amount" inputMode="decimal" placeholder="0.00" value={text} onChange={(e) => setText(e.target.value)} className="num text-lg" />
        </Field>
        {balance.data !== undefined && (
          <button type="button" className="text-xs text-gold-soft underline-offset-4 hover:underline" onClick={() => setText(fmtUsdc(bal).replace(/,/g, ''))}>Use full wallet balance</button>
        )}
        {parsed.ok && raw > 0n && (
          <dl className="space-y-1.5 rounded-2xl border border-line bg-ink-3/50 p-4 text-sm">
            <div className="flex justify-between"><dt className="text-ivory-dim">Vault after</dt><dd className="num">{fmtUsdc(preview.assetsAfter)}</dd></div>
            <div className="flex justify-between"><dt className="text-ivory-dim">Available after</dt><dd className="num text-mint">{fmtUsdc(preview.availableAfter)}</dd></div>
          </dl>
        )}

        <ol className="space-y-4">
          <li className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium">
              {!needsApproval && raw > 0n ? <Check className="size-4 text-mint" /> : <span className="grid size-5 place-items-center rounded-full border border-line text-[11px]">1</span>}
              Approve exactly this amount
            </p>
            <TxButton
              label={`Approve ${raw > 0n ? fmtUsdc(raw) : ''} USDC`}
              variant="secondary"
              disabled={invalid || !needsApproval || !ready}
              disabledReason={invalid ? reason ?? 'Enter an amount.' : !needsApproval ? 'Already approved for this amount.' : undefined}
              busy={approveTx.busy}
              onClick={() => void approveTx.run(() => approveTx.write({ address: USDC_ADDRESS, abi: erc20Abi, functionName: 'approve', args: [vault, raw], chainId: CHAIN_ID }))}
            />
            <TxStatus phase={approveTx.phase} hash={approveTx.hash} message={approveTx.message} doneText="Approval confirmed. No USDC has moved yet." />
          </li>
          <li className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium"><span className="grid size-5 place-items-center rounded-full border border-line text-[11px]">2</span> Deposit</p>
            <TxButton
              label={`Deposit ${raw > 0n ? fmtUsdc(raw) : ''} USDC`}
              disabled={invalid || needsApproval}
              disabledReason={needsApproval && !invalid ? 'Approve first.' : undefined}
              busy={depositTx.busy}
              onClick={() => void depositTx.run(() => depositTx.write({ address: vault, abi: vaultAbi, functionName: 'deposit', args: [raw], chainId: CHAIN_ID }))}
            />
            <TxStatus phase={depositTx.phase} hash={depositTx.hash} message={depositTx.message} doneText="Deposit confirmed. The vault balance has increased." />
          </li>
        </ol>
        <Notice>Gas on Arc is paid in USDC from your wallet, in addition to the amount you deposit.</Notice>
      </div>
    </Dialog>
  )
}
