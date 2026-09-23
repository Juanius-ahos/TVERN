import { describe, expect, it } from "vitest";
import { shortAddr, formatUsd, formatAmount, timeAgo } from "../format";

describe("shortAddr", () => {
  it("truncates a hex address to 6…4", () => {
    expect(shortAddr("0x5F0DeA3A6A1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C")).toBe(
      "0x5f0d…4b5c",
    );
  });

  it("lowercases the output", () => {
    expect(shortAddr("0xABCDEF1234567890")).toBe("0xabcd…7890");
  });

  it("returns empty string for empty input", () => {
    expect(shortAddr("")).toBe("");
  });
});

describe("formatUsd", () => {
  it("formats millions", () => {
    expect(formatUsd(1_234_567)).toBe("$1.23M");
  });

  it("formats thousands", () => {
    expect(formatUsd(12_345)).toBe("$12.3k");
  });

  it("formats small values as whole dollars", () => {
    expect(formatUsd(42.7)).toBe("$43");
  });

  it("returns $0 for non-finite input", () => {
    expect(formatUsd(NaN)).toBe("$0");
    expect(formatUsd(Infinity)).toBe("$0");
  });
});

describe("formatAmount", () => {
  it("formats millions", () => {
    expect(formatAmount(2_000_000)).toBe("2.00M");
  });

  it("formats thousands", () => {
    expect(formatAmount(5_400)).toBe("5.4k");
  });

  it("keeps two decimals for whole-ish values", () => {
    expect(formatAmount(3.5)).toBe("3.50");
  });

  it("uses precision for sub-dollar values", () => {
    expect(formatAmount(0.00012345)).toBe("0.000123");
  });

  it("returns 0 for non-finite input", () => {
    expect(formatAmount(NaN)).toBe("0");
  });
});

describe("timeAgo", () => {
  const now = Date.now();

  it("reports seconds", () => {
    expect(timeAgo(new Date(now - 12_000))).toBe("12s");
  });

  it("reports minutes", () => {
    expect(timeAgo(new Date(now - 4 * 60_000))).toBe("4m");
  });

  it("reports hours", () => {
    expect(timeAgo(new Date(now - 3 * 3_600_000))).toBe("3h");
  });

  it("reports days", () => {
    expect(timeAgo(new Date(now - 2 * 86_400_000))).toBe("2d");
  });

  it("accepts ISO strings", () => {
    expect(timeAgo(new Date(now - 60_000).toISOString())).toBe("1m");
  });
});