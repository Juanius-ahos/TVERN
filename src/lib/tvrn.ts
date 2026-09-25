// $TVERN — The Tavern's house token. Single source of truth for the CA + links.
// Env can override (NEXT_PUBLIC_TVRN_ADDRESS / _SYMBOL); otherwise these defaults win.

export const TVRN_ADDRESS =
  (process.env.NEXT_PUBLIC_TVRN_ADDRESS as string | undefined)?.trim() ||
  "0x51F611F806b36d62010eA93cd957fa1d3E960fEf";

export const TVRN_SYMBOL = (process.env.NEXT_PUBLIC_TVRN_SYMBOL || "TVERN").toUpperCase();
export const TVRN_NAME = "The Tavern";

export const TVRN_LINKS = {
  asset: `/asset/${TVRN_SYMBOL}`,
  explorer: `https://robinhoodchain.blockscout.com/token/${TVRN_ADDRESS}`,
  dexscreener: `https://dexscreener.com/robinhood/${TVRN_ADDRESS}`,
  geckoterminal: `https://www.geckoterminal.com/robinhood/tokens/${TVRN_ADDRESS}`,
};
