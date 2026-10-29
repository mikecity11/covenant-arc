import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { getAddress, isAddress } from 'viem'
import { CHAIN_ID } from '@/lib/deployment'

type Addr = `0x${string}`

interface TreasuryContextValue {
  vault: Addr | undefined
  saved: Addr[]
  select: (address: Addr | undefined) => void
  remember: (address: Addr) => void
  forget: (address: Addr) => void
  dialogOpen: boolean
  setDialogOpen: (open: boolean) => void
}

const KEY_SELECTED = `covenant:v2:${CHAIN_ID}:vault`
const KEY_SAVED = `covenant:v2:${CHAIN_ID}:saved`

const readSaved = (): Addr[] => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY_SAVED) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((a): a is string => typeof a === 'string' && isAddress(a)).map((a) => getAddress(a)) : []
  } catch {
    return []
  }
}

const readSelected = (): Addr | undefined => {
  const v = localStorage.getItem(KEY_SELECTED)
  return v && isAddress(v) ? getAddress(v) : undefined
}

const Ctx = createContext<TreasuryContextValue | null>(null)

/** Which treasury the dashboard is looking at. Stored locally in the browser; no server. */
export function TreasuryProvider({ children }: { children: ReactNode }) {
  const [vault, setVault] = useState<Addr | undefined>(readSelected)
  const [saved, setSaved] = useState<Addr[]>(readSaved)

  const remember = useCallback((address: Addr) => {
    setSaved((prev) => {
      const next = prev.includes(address) ? prev : [...prev, address]
      localStorage.setItem(KEY_SAVED, JSON.stringify(next))
      return next
    })
  }, [])

  const select = useCallback((address: Addr | undefined) => {
    setVault(address)
    if (address) localStorage.setItem(KEY_SELECTED, address)
    else localStorage.removeItem(KEY_SELECTED)
  }, [])

  const forget = useCallback((address: Addr) => {
    setSaved((prev) => {
      const next = prev.filter((a) => a !== address)
      localStorage.setItem(KEY_SAVED, JSON.stringify(next))
      return next
    })
    setVault((cur) => {
      if (cur === address) localStorage.removeItem(KEY_SELECTED)
      return cur === address ? undefined : cur
    })
  }, [])

  const [dialogOpen, setDialogOpen] = useState(false)

  const value = useMemo(
    () => ({ vault, saved, select, remember, forget, dialogOpen, setDialogOpen }),
    [vault, saved, select, remember, forget, dialogOpen],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTreasury(): TreasuryContextValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useTreasury must be used inside TreasuryProvider')
  return v
}

/** Block at which a vault was created through this app, used as the activity scan floor. */
export const creationBlockKey = (vault: string) => `covenant:v2:${CHAIN_ID}:block:${vault.toLowerCase()}`
export const saveCreationBlock = (vault: string, block: bigint) =>
  localStorage.setItem(creationBlockKey(vault), block.toString())
export const readCreationBlock = (vault: string): bigint | undefined => {
  const v = localStorage.getItem(creationBlockKey(vault))
  return v && /^\d+$/.test(v) ? BigInt(v) : undefined
}
