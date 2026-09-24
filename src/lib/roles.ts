// Dev / moderator allowlist. Kept in env (DEV_USERNAMES / DEV_ADDRESSES, comma
// separated, case-insensitive) so granting the role needs no DB migration and
// no direct write to the production database. A dev gets the DEV badge and full
// moderation power (delete any post/comment).
//
// Example: DEV_USERNAMES="Mr_DEV"  or  DEV_ADDRESSES="0xabc...,0xdef..."

function parseSet(v?: string): Set<string> {
  return new Set(
    (v ?? "")
      .toLowerCase()
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

const DEV_NAMES = parseSet(process.env.DEV_USERNAMES);
const DEV_ADDRS = parseSet(process.env.DEV_ADDRESSES);

export function isDev(u?: { username?: string | null; address?: string | null } | null): boolean {
  if (!u) return false;
  if (u.username && DEV_NAMES.has(u.username.toLowerCase())) return true;
  if (u.address && DEV_ADDRS.has(u.address.toLowerCase())) return true;
  return false;
}
