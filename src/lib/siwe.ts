import { createSiweMessage } from "viem/siwe";
import { getAddress } from "viem";

export type SiweParams = {
  domain: string;
  uri: string;
  address: string;
  nonce: string;
  issuedAt: string;
  chainId: number;
};

// Build a strictly EIP-4361-compliant message (wallets like MetaMask validate this).
export function buildSiweMessage(p: SiweParams): string {
  return createSiweMessage({
    address: getAddress(p.address),
    chainId: p.chainId,
    domain: p.domain,
    nonce: p.nonce,
    uri: p.uri,
    version: "1",
    statement: "Sign in to The Tavern. This only proves you own this wallet — no transaction, no gas.",
    issuedAt: new Date(p.issuedAt),
  });
}

export function extractNonce(message: string): string | null {
  const m = message.match(/^Nonce: (.+)$/m);
  return m ? m[1].trim() : null;
}

export function extractAddress(message: string): string | null {
  // EIP-4361: the address is on line 2.
  const lines = message.split("\n");
  return lines[1]?.trim().toLowerCase() ?? null;
}
