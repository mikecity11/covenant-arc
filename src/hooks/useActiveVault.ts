import { useTreasury } from '@/hooks/useTreasury'
import { useCommitments, useVault } from '@/hooks/useVault'
import { useWallet } from '@/hooks/useWallet'

/** The selected treasury with live state, commitments and the connected wallet's role. */
export function useActiveVault() {
  const { vault, setDialogOpen } = useTreasury()
  const { address } = useWallet()
  const state = useVault(vault)
  const commitments = useCommitments(vault, state.count)
  const isOwner = Boolean(address && state.owner && address.toLowerCase() === state.owner.toLowerCase())
  return { vault, state, commitments, isOwner, address, openSelector: () => setDialogOpen(true) }
}
