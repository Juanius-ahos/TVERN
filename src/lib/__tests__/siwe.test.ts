import { describe, expect, it } from "vitest";
import { buildSiweMessage, extractNonce, extractAddress } from "../siwe";
import { getAddress } from "viem";

const params = {
  domain: "tavern.app",
  uri: "https://tavern.app/auth/callback",
  address: "0x5F0DeA3A6A1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C",
  nonce: "abc123xyz",
  issuedAt: "2026-09-23T00:00:00.000Z",
  chainId: 1,
};

describe("buildSiweMessage", () => {
  it("produces an EIP-4361 message with the required fields", () => {
    const msg = buildSiweMessage(params);
    expect(msg).toContain(`tavern.app wants you to sign in with your Ethereum account:`);
    expect(msg).toContain(getAddress(params.address));
    expect(msg).toContain("Version: 1");
    expect(msg).toContain("Chain ID: 1");
    expect(msg).toContain("Nonce: abc123xyz");
    expect(msg).toContain("URI: https://tavern.app/auth/callback");
    expect(msg).toContain("Issued At: 2026-09-23T00:00:00.000Z");
  });

  it("checksums the address even if input is lowercase", () => {
    const msg = buildSiweMessage({ ...params, address: params.address.toLowerCase() });
    expect(msg).toContain(getAddress(params.address));
  });
});

describe("extractNonce", () => {
  it("round-trips the nonce from a built message", () => {
    const msg = buildSiweMessage(params);
    expect(extractNonce(msg)).toBe(params.nonce);
  });

  it("returns null when no Nonce line exists", () => {
    expect(extractNonce("hello world")).toBeNull();
  });
});

describe("extractAddress", () => {
  it("reads the address on line 2 of a built message", () => {
    const msg = buildSiweMessage(params);
    expect(extractAddress(msg)).toBe(getAddress(params.address).toLowerCase());
  });

  it("returns null for a malformed message", () => {
    expect(extractAddress("short")).toBeNull();
  });
});