import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConnectKitButton } from 'connectkit'
import { useAccount, useDeployContract, usePublicClient, useSwitchChain } from 'wagmi'
import { encodeDeployData, formatUnits, getAddress, parseAbi, type Hash } from 'viem'
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Button, Notice } from '@/components/ui'
import { CHAIN_ID, USDC_ADDRESS, FACTORY_ADDRESS, addressUrl, txUrl } from '@/lib/deployment'
import { FACTORY_BYTECODE, FACTORY_DEPLOY_ABI } from '@/lib/factory-artifact'
import { factoryCodeMatches } from '@/lib/verify-factory'
import { factoryAbi } from '@/lib/abi'
import { friendlyError } from '@/lib/errors'

const KEY = 'covenant:mainnet-factory-deployment:5042'
const tokenAbi = parseAbi(['function decimals() view returns (uint8)', 'function symbol() view returns (string)'])
type Record = { hash: Hash; factory?: `0x${string}`; chainId: number }
type Quote = { account: string; gas: bigint; gasPrice: bigint; maxCost: bigint; balance: bigint; time: number }

function readRecord(): Record | null {
  try {
    const r = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Record | null
    return r && r.chainId === 5042 && /^0x[0-9a-fA-F]{64}$/.test(r.hash) ? r : null
  } catch { return null }
}

export default function Deploy() {
  const { address, chainId, isConnected } = useAccount()
  const { switchChain, isPending: switching } = useSwitchChain()
  const { deployContractAsync } = useDeployContract()
  const client = usePublicClient({ chainId: CHAIN_ID })
  const [record, setRecord] = useState<Record | null>(readRecord)
  const [phase, setPhase] = useState<'idle' | 'checking' | 'wallet' | 'confirming' | 'done' | 'failed'>(record ? 'confirming' : 'idle')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const lock = useRef(false)
  const ready = isConnected && chainId === CHAIN_ID
  const busy = phase === 'checking' || phase === 'wallet' || phase === 'confirming'

  useEffect(() => { setQuote(null); setAccepted(false) }, [address, chainId])

  useEffect(() => {
    if (!record?.hash || !client) return
    let cancelled = false
    setPhase('confirming')
    void (async () => {
      try {
        const receipt = await client.waitForTransactionReceipt({ hash: record.hash })
        if (receipt.status !== 'success' || !receipt.contractAddress) throw new Error('Deployment reverted or created no contract. Gas may still have been charged.')
        const factory = getAddress(receipt.contractAddress)
        const [token, code] = await Promise.all([
          client.readContract({ address: factory, abi: factoryAbi, functionName: 'token' }),
          client.getBytecode({ address: factory }),
        ])
        if (getAddress(token) !== USDC_ADDRESS || !code || !factoryCodeMatches(code)) throw new Error('Deployment verification failed. Do not configure or fund this factory.')
        if (cancelled) return
        const next = { hash: record.hash, factory, chainId: CHAIN_ID }
        localStorage.setItem(KEY, JSON.stringify(next))
        setRecord(next)
        setPhase('done')
        setMessage(null)
      } catch (error) {
        if (!cancelled) { setPhase('failed'); setMessage(friendlyError(error).message) }
      }
    })()
    return () => { cancelled = true }
  }, [record?.hash, client])

  const estimate = async () => {
    if (!address || !ready || !client || lock.current) return
    lock.current = true
    setPhase('checking'); setMessage(null); setQuote(null)
    try {
      const [rpcChain, code, decimals, symbol] = await Promise.all([
        client.getChainId(),
        client.getBytecode({ address: USDC_ADDRESS }),
        client.readContract({ address: USDC_ADDRESS, abi: tokenAbi, functionName: 'decimals' }),
        client.readContract({ address: USDC_ADDRESS, abi: tokenAbi, functionName: 'symbol' }),
      ])
      if (rpcChain !== 5042 || !code || code === '0x' || decimals !== 6 || symbol !== 'USDC') throw new Error('Mainnet or USDC verification failed. No transaction has been requested.')
      const data = encodeDeployData({ abi: FACTORY_DEPLOY_ABI, bytecode: FACTORY_BYTECODE, args: [USDC_ADDRESS] })
      const [rawGas, rawPrice, balance] = await Promise.all([
        client.estimateGas({ account: address, data }),
        client.getGasPrice(),
        client.getBalance({ address }),
      ])
      const gas = (rawGas * 120n + 99n) / 100n
      const gasPrice = (rawPrice * 120n + 99n) / 100n
      const maxCost = gas * gasPrice
      if (balance < maxCost) throw new Error('Your Arc mainnet wallet needs more real USDC for the estimated deployment fee. No transaction was sent.')
      setQuote({ account: address, gas, gasPrice, maxCost, balance, time: Date.now() })
      setPhase('idle')
    } catch (error) { setMessage(friendlyError(error).message); setPhase('failed') }
    finally { lock.current = false }
  }

  const deploy = async () => {
    if (!quote || !address || !ready || !accepted || lock.current || record?.hash) return
    if (quote.account !== address || Date.now() - quote.time > 60_000) {
      setQuote(null); setMessage('The fee quote expired. Check the network and estimate again.'); return
    }
    lock.current = true
    setMessage(null); setPhase('wallet')
    try {
      const hash = await deployContractAsync({
        abi: FACTORY_DEPLOY_ABI, bytecode: FACTORY_BYTECODE,
        args: [USDC_ADDRESS], chainId: CHAIN_ID,
        gas: quote.gas, gasPrice: quote.gasPrice,
      })
      const next = { hash, chainId: CHAIN_ID }
      localStorage.setItem(KEY, JSON.stringify(next))
      setRecord(next); setPhase('confirming')
    } catch (error) {
      setMessage(friendlyError(error).message); setPhase('failed')
    } finally { lock.current = false }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <p className="eyebrow">Mainnet deployment</p>
      <h1 className="display mt-4 text-4xl sm:text-5xl">One last wallet step.</h1>
      <p className="mt-5 text-lg leading-relaxed text-ivory-dim">Deploy Covenant's factory on Arc mainnet. This creates the contract used to create treasuries. It does not deposit funds or create a payment.</p>
      <div className="mt-8 space-y-6">
        <Notice tone="alert" title="Real network. Real USDC.">
          This is an unaudited prototype. Deployment spends real USDC on gas and is irreversible. The constructor transfers no USDC and grants no token approval. Review the transaction in your wallet before signing.
        </Notice>
        <dl className="panel grid gap-4 p-6 text-sm sm:grid-cols-2">
          <div><dt className="text-ivory-mute">Network</dt><dd className="mt-1 font-semibold">Arc mainnet · 5042</dd></div>
          <div><dt className="text-ivory-mute">Contract</dt><dd className="mt-1 font-semibold">CovenantFactory · no admin or protocol fee</dd></div>
          <div className="sm:col-span-2"><dt className="text-ivory-mute">Immutable USDC token · 6 decimals</dt><dd className="mt-1 break-all font-mono text-xs">{USDC_ADDRESS}</dd></div>
        </dl>
        {FACTORY_ADDRESS ? <Notice tone="mint" title="A mainnet factory is already configured"><a href={addressUrl(FACTORY_ADDRESS)} target="_blank" rel="noreferrer" className="break-all underline">{FACTORY_ADDRESS}</a>. Use the app instead of deploying another.</Notice> : null}
        {phase === 'done' && record?.factory ? (
          <div className="panel space-y-4 p-6">
            <CheckCircle2 className="size-8 text-mint" />
            <h2 className="display text-2xl">Deployment verified.</h2>
            <p className="text-sm text-ivory-dim">The receipt succeeded, the deployed code matches the compiled factory and its token is canonical Arc USDC.</p>
            <p className="break-all font-mono text-sm">{record.factory}</p>
            <a href={txUrl(record.hash)} target="_blank" rel="noreferrer" className="inline-block text-sm font-semibold text-gold underline">View deployment transaction</a>
            <p className="text-sm text-ivory-dim">Send this factory address or the explorer link to your build assistant. It can now configure the shared app and record the deployment. No funds need to be sent to the factory.</p>
          </div>
        ) : record?.hash ? (
          <Notice title={phase === 'failed' ? 'Deployment needs review' : 'Confirming and verifying deployment'}>
            <a href={txUrl(record.hash)} target="_blank" rel="noreferrer" className="break-all text-gold underline">{record.hash}</a>
            <p className="mt-2">This transaction is saved in this browser. Reload this page to resume verification; do not submit a duplicate deployment.</p>
          </Notice>
        ) : !FACTORY_ADDRESS ? (
          <div className="panel space-y-5 p-6">
            <h2 className="display text-2xl">Prepare your wallet</h2>
            {!isConnected ? <ConnectKitButton.Custom>{({ show }) => <Button onClick={show}>Connect wallet</Button>}</ConnectKitButton.Custom> : !ready ? <Button onClick={() => switchChain({ chainId: CHAIN_ID })} busy={switching}>Switch to Arc mainnet</Button> : (
              <>
                <p className="break-all font-mono text-xs text-ivory-mute">Deploying from {address}</p>
                <Button variant="secondary" busy={phase === 'checking'} disabled={busy} onClick={() => void estimate()}><ShieldCheck className="size-4" /> Check network & estimate fee</Button>
                {quote ? <>
                  <dl className="rounded-xl bg-ink-3 p-4 text-sm"><dt className="text-ivory-mute">Estimated gas cap, including buffer</dt><dd className="mt-1 break-all font-mono">{formatUnits(quote.maxCost, 18)} USDC</dd><dt className="mt-3 text-ivory-mute">Wallet balance</dt><dd className="mt-1 break-all font-mono">{formatUnits(quote.balance, 18)} USDC</dd></dl>
                  <p className="text-xs text-ivory-mute">Quote expires after 60 seconds. Unused gas is not spent. Your wallet shows the final transaction details.</p>
                  <label className="flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} className="mt-1 size-4 shrink-0 accent-blue-600" />I understand this deploys an unaudited contract on Arc mainnet and spends real USDC on gas.</label>
                  <Button onClick={() => void deploy()} disabled={!accepted || busy} busy={phase === 'wallet'}>Review deployment in wallet <ArrowRight className="size-4" /></Button>
                </> : null}
              </>
            )}
          </div>
        ) : null}
        {message ? <div role="alert"><Notice tone="alert">{message}</Notice></div> : null}
        {phase === 'wallet' ? <p role="status" className="text-sm text-ivory-dim">Waiting for your wallet approval. Nothing has been sent until you confirm there.</p> : null}
        <div className="flex flex-wrap gap-6 text-sm">
          <Link to="/app" className="font-semibold text-gold">Back to the app</Link>
          <a href="https://github.com/mikecity11/covenant-arc/blob/main/contracts/CovenantFactory.sol" target="_blank" rel="noreferrer" className="text-ivory-dim underline">Review contract source</a>
        </div>
      </div>
    </div>
  )
}
