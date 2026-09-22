import { createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { robinhoodChain } from "./chain";

// Ethereum mainnet is listed FIRST so wallets connect on a chain they already
// have — logging in never asks anyone to add/switch to a custom network (that
// was triggering MetaMask's scary warnings and breaking Phantom). Robinhood
// Chain is still supported for on-chain actions (tips) once you're in.
export const wagmiConfig = createConfig({
  chains: [mainnet, robinhoodChain],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [robinhoodChain.id]: http(),
  },
  ssr: true,
});
