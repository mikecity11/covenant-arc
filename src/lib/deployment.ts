import { getAddress, isAddress } from 'viem'
import { arc } from 'viem/chains'
import { getUsdc, requireChain, buildAddressExplorerUrl, buildTxExplorerUrl } from '@/onchain-facts'

export const CHAIN_ID = arc.id
export const CHAIN = requireChain(CHAIN_ID)
const usdcFact = getUsdc(CHAIN_ID)
if (!usdcFact || usdcFact.decimals !== 6) throw new Error('Arc mainnet USDC fact is missing or has unexpected decimals')
export const USDC_ADDRESS = getAddress(usdcFact.address)

/** Dedicated mainnet setting: never reuse the testnet factory environment variable. */
const rawFactory = import.meta.env.VITE_COVENANT_MAINNET_FACTORY_ADDRESS as string | undefined
export const FACTORY_ADDRESS: `0x${string}` | undefined =
  rawFactory && isAddress(rawFactory) && rawFactory.toLowerCase() !== '0x0000000000000000000000000000000000000000' ? getAddress(rawFactory) : undefined
export const txUrl = (hash: string) => buildTxExplorerUrl(CHAIN_ID, hash)
export const addressUrl = (address: string) => buildAddressExplorerUrl(CHAIN_ID, address)
export const LOG_WINDOW = 5000n
export const DEFAULT_LOOKBACK_WINDOWS = 8n
export const MAX_TEXT_BYTES = 280
