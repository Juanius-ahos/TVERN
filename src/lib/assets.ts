// Robinhood-Chain-native asset helpers. "Assets" here = tokenized stocks and
// RH-chain tokens. All market data comes from Robinhood Chain (GeckoTerminal /
// on-chain), never global crypto/stock APIs — we stay inside the Robinhood world.

import { KNOWN_TICKERS } from "./registry";

export function isStockTicker(symbol: string): boolean {
  return KNOWN_TICKERS.has(symbol.toUpperCase());
}

// Extract $CASHTAGS from post text (e.g. "$NVDA", "$POCKA") so they can link to
// the asset's page on Robinhood Chain.
export function extractCashtags(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/\$([A-Za-z][A-Za-z0-9]{0,9})\b/g)) out.add(m[1].toUpperCase());
  return [...out];
}
