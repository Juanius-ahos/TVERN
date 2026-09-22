// Minimal EIP-4361 (Sign-In With Ethereum) message. Kept simple on purpose.

export type SiweParams = {
  domain: string;
  uri: string;
  address: string;
  nonce: string;
  issuedAt: string;
  chainId: number;
};

export function buildSiweMessage(p: SiweParams): string {
  return [
    `${p.domain} wants you to sign in with your Ethereum account:`,
    p.address,
    ``,
    `Sign in to The Tavern — no transaction, no gas.`,
    ``,
    `URI: ${p.uri}`,
    `Version: 1`,
    `Chain ID: ${p.chainId}`,
    `Nonce: ${p.nonce}`,
    `Issued At: ${p.issuedAt}`,
  ].join("\n");
}

export function extractNonce(message: string): string | null {
  const m = message.match(/^Nonce: (.+)$/m);
  return m ? m[1].trim() : null;
}

export function extractAddress(message: string): string | null {
  // second line of the message is the address
  const lines = message.split("\n");
  return lines[1]?.trim().toLowerCase() ?? null;
}
