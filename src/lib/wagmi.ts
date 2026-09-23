import { createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { injected, coinbaseWallet, walletConnect } from "wagmi/connectors";
import { robinhoodChain } from "./chain";

// Sign-in works with any EVM wallet:
//  • injected()     , auto-discovers every installed browser wallet via EIP-6963
//                      (MetaMask, Rabby, Brave, Coinbase extension, Trust, …)
//  • coinbaseWallet , Coinbase Wallet (extension + mobile smart wallet)
//  • walletConnect  , the WalletConnect network (hundreds of mobile wallets via QR),
//                      enabled once NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is set.
//
// Ethereum mainnet is listed FIRST so wallets connect on a chain they already
// have, signing in never asks anyone to add/switch networks. Robinhood Chain is
// still available for on-chain actions (tips) once you're in.

const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

const metadata = {
  name: "The Tavern",
  description: "The live market and community for Robinhood Chain.",
  url: "https://tvern.xyz",
  icons: ["https://tvern.xyz/logo.png"],
};

export const wagmiConfig = createConfig({
  chains: [mainnet, robinhoodChain],
  connectors: [
    injected({ shimDisconnect: true }),
    coinbaseWallet({ appName: metadata.name, appLogoUrl: metadata.icons[0] }),
    ...(wcProjectId ? [walletConnect({ projectId: wcProjectId, showQrModal: true, metadata })] : []),
  ],
  transports: {
    [mainnet.id]: http(),
    [robinhoodChain.id]: http(),
  },
  ssr: true,
});
