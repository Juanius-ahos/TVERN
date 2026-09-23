import { createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { robinhoodChain } from "./chain";

// Sign-in works with any EVM wallet:
//  • injected()      — auto-discovers every installed browser wallet via EIP-6963
//                      (MetaMask, Rabby, Brave, Coinbase extension, Trust, …)
//  • coinbaseWallet  — Coinbase Wallet (extension + mobile), no projectId needed
//  • walletConnect   — the WalletConnect network (hundreds of mobile wallets via QR),
//                      enabled when a project id is configured.
//
// Ethereum mainnet is listed FIRST so wallets connect on a chain they already
// have — signing in never asks anyone to add/switch networks. Robinhood Chain is
// still available for on-chain actions (tips) once you're in.

export const wagmiConfig = createConfig({
  chains: [mainnet, robinhoodChain],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [mainnet.id]: http(),
    [robinhoodChain.id]: http(),
  },
  ssr: true,
});
