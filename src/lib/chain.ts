import { createPublicClient, defineChain, http } from "viem";

const RPC_URL =
  process.env.RPC_URL || "https://rpc.mainnet.chain.robinhood.com";

// Robinhood Chain, Arbitrum Orbit L2, chain id 4663, ETH gas.
export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://robinhoodchain.blockscout.com",
    },
  },
});

// Read-only client for querying the chain. A browser-like UA is required -
// the public RPC sits behind Cloudflare and drops requests with a blank UA.
export const publicClient = createPublicClient({
  chain: robinhoodChain,
  transport: http(RPC_URL, {
    fetchOptions: {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; wtf-happened/0.1)" },
    },
  }),
});

export const BLOCKSCOUT_API =
  process.env.BLOCKSCOUT_API || "https://robinhoodchain.blockscout.com/api/v2";
