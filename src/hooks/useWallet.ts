import { useEffect, useState } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { CHAIN_ID } from '@/lib/deployment'

/** Wallet + network state for the single supported chain (Arc mainnet). */
export function useWallet() {
  const { address, isConnected, isConnecting, chainId } = useAccount()
  const { switchChain, isPending: switching } = useSwitchChain()
  const wrongChain = isConnected && chainId !== CHAIN_ID
  return {
    address,
    isConnected,
    isConnecting,
    chainId,
    wrongChain,
    switching,
    switchToArc: () => switchChain({ chainId: CHAIN_ID }),
    /** Ready to sign a write on the right chain. */
    ready: isConnected && !wrongChain,
  }
}

/** Current unix seconds, ticking once a second (display only; the chain is the authority). */
export function useNowSec(): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}
