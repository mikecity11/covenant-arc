import { useQuery } from '@tanstack/react-query'
import { useReadContracts, usePublicClient } from 'wagmi'
import { getAddress } from 'viem'
import { vaultAbi, CommitmentStatus, type CommitmentView } from '@/lib/abi'
import { CHAIN_ID, USDC_ADDRESS } from '@/lib/deployment'

type Addr = `0x${string}`

export interface VaultState {
  loading: boolean
  /** The address did not answer like a Covenant vault. */
  invalid: boolean
  /** The vault is bound to a token other than Arc Testnet USDC. */
  wrongToken: boolean
  owner?: Addr
  token?: Addr
  assets: bigint
  reserved: bigint
  available: bigint
  count: bigint
  refetch: () => void
}

/** Live treasury figures. Read from the vault itself, never inferred from wallet balances. */
export function useVault(vault: Addr | undefined): VaultState {
  const base = { address: vault, abi: vaultAbi, chainId: CHAIN_ID } as const
  const { data, isLoading, isError, refetch } = useReadContracts({
    allowFailure: true,
    contracts: [
      { ...base, functionName: 'owner' },
      { ...base, functionName: 'token' },
      { ...base, functionName: 'balance' },
      { ...base, functionName: 'reserved' },
      { ...base, functionName: 'available' },
      { ...base, functionName: 'commitmentCount' },
    ],
    query: { enabled: Boolean(vault), refetchInterval: 8000 },
  })

  const ok = data?.every((d) => d.status === 'success') ?? false
  const owner = data?.[0].status === 'success' ? (data[0].result) : undefined
  const token = data?.[1].status === 'success' ? (data[1].result) : undefined
  const num = (i: number) => (data?.[i]?.status === 'success' ? (data[i].result as bigint) : 0n)

  return {
    loading: Boolean(vault) && isLoading,
    invalid: Boolean(vault) && !isLoading && (isError || !ok),
    wrongToken: Boolean(token) && getAddress(token as Addr) !== USDC_ADDRESS,
    owner,
    token,
    assets: num(2),
    reserved: num(3),
    available: num(4),
    count: num(5),
    refetch: () => void refetch(),
  }
}

const PAGE = 50n

interface RawCommitment {
  recipient: Addr
  amount: bigint
  dueAt: bigint
  createdAt: bigint
  status: number
  description: string
}

/** Every commitment in the vault, newest last, read from contract state in pages. */
export function useCommitments(vault: Addr | undefined, count: bigint) {
  const client = usePublicClient({ chainId: CHAIN_ID })
  return useQuery({
    queryKey: ['commitments', vault, count.toString()],
    enabled: Boolean(vault && client),
    refetchInterval: 10000,
    queryFn: async (): Promise<CommitmentView[]> => {
      if (!vault || !client) return []
      const out: CommitmentView[] = []
      for (let start = 0n; start < count; start += PAGE) {
        const page = (await client.readContract({
          address: vault,
          abi: vaultAbi,
          functionName: 'getCommitments',
          args: [start, PAGE],
        })) as readonly RawCommitment[]
        page.forEach((c, i) =>
          out.push({
            id: start + BigInt(i),
            recipient: c.recipient,
            amount: c.amount,
            dueAt: c.dueAt,
            createdAt: c.createdAt,
            status: c.status,
            description: c.description,
          }),
        )
      }
      return out
    },
  })
}

export const statusLabel = (s: CommitmentStatus) =>
  s === CommitmentStatus.Outstanding ? 'Protected' : s === CommitmentStatus.Claimed ? 'Claimed' : 'Released'
