import { useState } from 'react'
import { useReadContract, usePublicClient } from 'wagmi'
import { getAddress, isAddress, parseEventLogs, type TransactionReceipt } from 'viem'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Dialog, Field, Input, Notice, Pill } from '@/components/ui'
import { AddressChip, TxButton, TxStatus } from '@/components/TxParts'
import { useTx } from '@/hooks/useTx'
import { saveCreationBlock, useTreasury } from '@/hooks/useTreasury'
import { useWallet } from '@/hooks/useWallet'
import { factoryAbi, vaultAbi } from '@/lib/abi'
import { CHAIN, CHAIN_ID, FACTORY_ADDRESS, USDC_ADDRESS } from '@/lib/deployment'

type Addr = `0x${string}`

export function TreasuryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { vault, saved, select, remember, forget } = useTreasury()
  const { address } = useWallet()
  const factory = FACTORY_ADDRESS
  const client = usePublicClient({ chainId: CHAIN_ID })
  const [input, setInput] = useState('')
  const [checking, setChecking] = useState(false)
  const [openError, setOpenError] = useState<string | null>(null)

  const owned = useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: 'vaultsOf',
    args: address ? [address] : undefined,
    chainId: CHAIN_ID,
    query: { enabled: Boolean(FACTORY_ADDRESS && address) },
  })
  const factoryToken = useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: 'token',
    chainId: CHAIN_ID,
    query: { enabled: Boolean(FACTORY_ADDRESS) },
  })
  const factoryMismatch = factoryToken.data !== undefined && getAddress(factoryToken.data) !== USDC_ADDRESS

  const created = useTx((receipt: TransactionReceipt) => {
    const [log] = parseEventLogs({ abi: factoryAbi, logs: receipt.logs, eventName: 'VaultCreated' })
    if (!log) return
    const v = log.args.vault
    saveCreationBlock(v, receipt.blockNumber)
    remember(v)
    select(v)
  })

  const choose = (a: Addr) => {
    remember(a)
    select(a)
    onClose()
  }

  const openByAddress = async () => {
    setOpenError(null)
    if (!isAddress(input.trim())) return setOpenError('That is not a valid address.')
    const a = getAddress(input.trim())
    if (!client) return setOpenError('No RPC connection available.')
    setChecking(true)
    try {
      const [token] = await Promise.all([
        client.readContract({ address: a, abi: vaultAbi, functionName: 'token' }),
        client.readContract({ address: a, abi: vaultAbi, functionName: 'owner' }),
      ])
      if (getAddress(token) !== USDC_ADDRESS) {
        setOpenError('This vault holds a different token than Arc Testnet USDC, so Covenant will not open it.')
        return
      }
      setInput('')
      choose(a)
    } catch {
      setOpenError(`That address does not respond like a Covenant vault on ${CHAIN.name}.`)
    } finally {
      setChecking(false)
    }
  }

  const mine = (owned.data ?? [])
  const all = [...new Set<Addr>([...mine, ...saved])]

  return (
    <Dialog open={open} onClose={onClose} title="Treasuries">
      <div className="space-y-7">
        <section aria-labelledby="t-list">
          <h3 id="t-list" className="eyebrow mb-3">Your treasuries</h3>
          {all.length === 0 ? (
            <p className="text-sm text-ivory-mute">None yet. Create one or open one by address.</p>
          ) : (
            <ul className="space-y-2">
              {all.map((a) => (
                <li key={a} className="flex items-center justify-between gap-2 rounded-xl border border-line p-2 pl-3">
                  <button onClick={() => choose(a)} className="flex flex-1 items-center gap-2 py-1 text-left text-sm hover:text-gold-soft">
                    {a === vault && <Pill tone="gold">Selected</Pill>}
                    {mine.includes(a) && <Pill tone="mint">Owner</Pill>}
                    <span className="font-mono text-xs">{a.slice(0, 10)}…{a.slice(-6)}</span>
                  </button>
                  {saved.includes(a) && (
                    <button aria-label="Remove from list" onClick={() => forget(a)} className="grid size-10 place-items-center rounded-full text-ivory-mute hover:bg-ink-3 hover:text-ivory">
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="t-create" className="space-y-3 border-t border-line pt-6">
          <h3 id="t-create" className="eyebrow">Create a treasury</h3>
          {!FACTORY_ADDRESS ? (
            <Notice tone="gold" title="Factory not deployed yet">
              Creating a treasury needs the Covenant factory contract on {CHAIN.name}. It has been written and tested but not deployed, so creation is disabled instead of faked. You can still open an existing vault below.
            </Notice>
          ) : factoryMismatch ? (
            <Notice tone="alert" title="Factory is bound to a different token">
              The configured factory does not use Arc Testnet USDC, so creating vaults is disabled.
            </Notice>
          ) : (
            <>
              <p className="text-sm text-ivory-dim">Your connected wallet becomes the permanent owner of a new, non-upgradeable vault.</p>
              <AddressChip address={FACTORY_ADDRESS} label="Factory" />
              <TxButton
                label="Create treasury"
                busy={created.busy}
                onClick={() => factory && void created.run(() => created.write({ address: factory, abi: factoryAbi, functionName: 'createVault', chainId: CHAIN_ID }))}
              />
              <TxStatus phase={created.phase} hash={created.hash} message={created.message} doneText="Treasury created and selected." />
            </>
          )}
        </section>

        <section aria-labelledby="t-open" className="space-y-3 border-t border-line pt-6">
          <h3 id="t-open" className="eyebrow">Open an existing vault</h3>
          <Field label="Vault address" htmlFor="vault-addr" error={openError ?? undefined}>
            <Input id="vault-addr" value={input} onChange={(e) => setInput(e.target.value)} placeholder="0x…" spellCheck={false} className="font-mono text-sm" />
          </Field>
          <Button variant="secondary" onClick={() => void openByAddress()} busy={checking} disabled={input.trim() === ''}>
            <Plus className="size-4" /> Open vault
          </Button>
        </section>
      </div>
    </Dialog>
  )
}
