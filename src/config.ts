/** Wallet configuration. Built with Arc Studio. */
import { http, createConfig } from 'wagmi'
import { arc, arcTestnet, mainnet } from 'viem/chains'
import { injected } from 'wagmi/connectors'
import { registerChain } from './tracing'
import { requireChain } from './onchain-facts'

const arcRpc = requireChain(arc.id).rpcUrls[0]
const testnetRpc = requireChain(arcTestnet.id).rpcUrls[0]
registerChain(arc.id, arcRpc)
registerChain(arcTestnet.id, testnetRpc)

export const config = createConfig({
  chains: [arc, arcTestnet, mainnet],
  connectors: [injected()],
  transports: {
    [arc.id]: http(arcRpc),
    [arcTestnet.id]: http(testnetRpc),
    [mainnet.id]: http('https://cloudflare-eth.com'),
  },
})
