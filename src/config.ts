/**
 * wagmi configuration
 * Built with Arc Studio — https://studio.arc.io
 */

import { http, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { arcTestnet } from 'viem/chains'
import { injected } from 'wagmi/connectors'
import { registerChain } from './tracing'
import { requireChain } from './onchain-facts'

// Read the RPC URL from the generated facts module (viem's default for this chain may be stale).
const ARC_TESTNET_RPC = requireChain(arcTestnet.id).rpcUrls[0]

// Pre-register chain RPC URLs so trace events show correct chain names immediately
registerChain(arcTestnet.id, ARC_TESTNET_RPC)

export const config = createConfig({
  chains: [arcTestnet, mainnet], // mainnet needed for ENS resolution
  connectors: [injected()],
  transports: {
    [arcTestnet.id]: http(ARC_TESTNET_RPC),
    [mainnet.id]: http(), // ENS resolution uses mainnet
  },
})
