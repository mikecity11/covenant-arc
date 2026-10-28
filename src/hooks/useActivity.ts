import { useQuery } from '@tanstack/react-query'
import { usePublicClient } from 'wagmi'
import { parseAbiItem, type Log } from 'viem'
import { CHAIN_ID, LOG_WINDOW } from '@/lib/deployment'
import { readCreationBlock } from '@/hooks/useTreasury'

type Addr = `0x${string}`

export type ActivityKind = 'Deposited' | 'CommitmentCreated' | 'Claimed' | 'Released' | 'Spent'

export interface ActivityItem {
  kind: ActivityKind
  txHash: `0x${string}`
  blockNumber: bigint
  logIndex: number
  timestamp?: number
  actor?: Addr
  amount: bigint
  id?: bigint
  text?: string
  dueAt?: bigint
}

const EVENTS = [
  parseAbiItem('event Deposited(address indexed depositor, uint256 amount)'),
  parseAbiItem('event CommitmentCreated(uint256 indexed id, address indexed recipient, uint256 amount, uint64 dueAt, string description)'),
  parseAbiItem('event Claimed(uint256 indexed id, address indexed recipient, uint256 amount)'),
  parseAbiItem('event Released(uint256 indexed id, address indexed recipient, uint256 amount)'),
  parseAbiItem('event Spent(address indexed to, uint256 amount, string memo)'),
] as const

export interface ActivityResult {
  items: ActivityItem[]
  head: bigint
  scannedFrom: bigint
  /** True only when the scan reached the vault's known creation block. */
  complete: boolean
  hasCreationHint: boolean
}

/**
 * Event history for one vault. The chain is far too deep to scan from block zero, so this reads
 * a bounded number of 5,000-block windows back from the head (or back to the creation block when
 * this browser created the vault) and says plainly how far it looked.
 */
export function useActivity(vault: Addr | undefined, windows: number) {
  const client = usePublicClient({ chainId: CHAIN_ID })
  return useQuery({
    queryKey: ['activity', vault, windows],
    enabled: Boolean(vault && client),
    refetchInterval: 20000,
    queryFn: async (): Promise<ActivityResult> => {
      if (!vault || !client) throw new Error('not ready')
      const head = await client.getBlockNumber()
      const hint = readCreationBlock(vault)
      const reach = LOG_WINDOW * BigInt(windows)
      const floorByDepth = head > reach ? head - reach + 1n : 0n
      const scannedFrom = hint !== undefined && hint > floorByDepth ? hint : floorByDepth
      const complete = hint !== undefined && scannedFrom <= hint

      const ranges: Array<[bigint, bigint]> = []
      for (let to = head; to >= scannedFrom; to -= LOG_WINDOW) {
        const from = to - LOG_WINDOW + 1n > scannedFrom ? to - LOG_WINDOW + 1n : scannedFrom
        ranges.push([from, to])
        if (from === scannedFrom) break
      }

      const logs: Log[] = []
      for (let i = 0; i < ranges.length; i += 4) {
        const batch = await Promise.all(
          ranges.slice(i, i + 4).map(([fromBlock, toBlock]) =>
            client.getLogs({ address: vault, events: EVENTS, fromBlock, toBlock }),
          ),
        )
        batch.forEach((b) => logs.push(...(b as Log[])))
      }

      const items: ActivityItem[] = logs.map((l) => {
        const log = l as Log & { eventName: ActivityKind; args: Record<string, unknown> }
        const a = log.args
        return {
          kind: log.eventName,
          txHash: l.transactionHash as `0x${string}`,
          blockNumber: l.blockNumber as bigint,
          logIndex: l.logIndex as number,
          actor: (a.depositor ?? a.recipient ?? a.to) as Addr | undefined,
          amount: a.amount as bigint,
          id: a.id as bigint | undefined,
          text: (a.description ?? a.memo) as string | undefined,
          dueAt: a.dueAt as bigint | undefined,
        }
      })
      items.sort((x, y) => (x.blockNumber === y.blockNumber ? y.logIndex - x.logIndex : x.blockNumber > y.blockNumber ? -1 : 1))

      const blocks = [...new Set(items.slice(0, 80).map((i) => i.blockNumber))]
      const stamps = new Map<bigint, number>()
      await Promise.all(
        blocks.map(async (n) => {
          const b = await client.getBlock({ blockNumber: n })
          stamps.set(n, Number(b.timestamp))
        }),
      )
      items.forEach((i) => (i.timestamp = stamps.get(i.blockNumber)))

      return { items, head, scannedFrom, complete, hasCreationHint: hint !== undefined }
    },
  })
}
