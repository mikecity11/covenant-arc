import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePublicClient, useWriteContract } from 'wagmi'
import type { Hash, TransactionReceipt } from 'viem'
import { CHAIN_ID } from '@/lib/deployment'
import { friendlyError } from '@/lib/errors'

export type TxPhase = 'idle' | 'wallet' | 'confirming' | 'confirmed' | 'failed'

/**
 * One write at a time with honest state: waiting for the wallet, waiting for a block, confirmed
 * with a real receipt, or failed with a readable reason. Nothing advances on a timer.
 */
export function useTx(onConfirmed?: (receipt: TransactionReceipt) => void) {
  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient({ chainId: CHAIN_ID })
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState<TxPhase>('idle')
  const [hash, setHash] = useState<Hash | undefined>()
  const [message, setMessage] = useState<string | null>(null)

  const reset = useCallback(() => {
    setPhase('idle')
    setHash(undefined)
    setMessage(null)
  }, [])

  const run = useCallback(
    async (send: () => Promise<Hash>) => {
      setPhase('wallet')
      setHash(undefined)
      setMessage(null)
      try {
        const h = await send()
        setHash(h)
        setPhase('confirming')
        if (!publicClient) throw new Error('No RPC client available')
        const receipt = await publicClient.waitForTransactionReceipt({ hash: h })
        if (receipt.status !== 'success') {
          setPhase('failed')
          setMessage('The transaction was mined but reverted onchain. Nothing changed.')
          return undefined
        }
        setPhase('confirmed')
        await queryClient.invalidateQueries()
        onConfirmed?.(receipt)
        return receipt
      } catch (e) {
        const f = friendlyError(e)
        if (f.rejected) {
          setPhase('idle')
          setMessage(f.message)
        } else {
          setPhase('failed')
          setMessage(f.message)
        }
        return undefined
      }
    },
    [publicClient, queryClient, onConfirmed],
  )

  return {
    write: writeContractAsync,
    run,
    reset,
    phase,
    hash,
    message,
    busy: phase === 'wallet' || phase === 'confirming',
  }
}
