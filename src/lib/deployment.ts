import { getAddress, isAddress } from 'viem'
import { arcTestnet } from 'viem/chains'
import { getUsdc, requireChain, buildAddressExplorerUrl, buildTxExplorerUrl } from '@/onchain-facts'

/** Covenant targets Arc Testnet only. Mainnet is deliberately not wired. */
export const CHAIN_ID = arcTestnet.id
export const CHAIN = requireChain(CHAIN_ID)

const usdcFact = getUsdc(CHAIN_ID)
if (!usdcFact) throw new Error('USDC is missing from the onchain facts for Arc Testnet')
export const USDC_ADDRESS = getAddress(usdcFact.address)

/**
 * The factory address is read from the environment. It stays undefined until a reviewed factory
 * has actually been deployed and its address written to .env as VITE_COVENANT_FACTORY_ADDRESS.
 * Nothing here is a placeholder: no address means writes that need the factory stay disabled.
 */
const rawFactory = import.meta.env.VITE_COVENANT_FACTORY_ADDRESS as string | undefined
export const FACTORY_ADDRESS: `0x${string}` | undefined =
  rawFactory && isAddress(rawFactory) ? getAddress(rawFactory) : undefined

export const txUrl = (hash: string) => buildTxExplorerUrl(CHAIN_ID, hash)
export const addressUrl = (address: string) => buildAddressExplorerUrl(CHAIN_ID, address)

/** Log scanning: the RPC rejects ranges of roughly 10,000 blocks, so we page in 5,000-block windows. */
export const LOG_WINDOW = 5000n
export const DEFAULT_LOOKBACK_WINDOWS = 8n

export const MAX_TEXT_BYTES = 280
