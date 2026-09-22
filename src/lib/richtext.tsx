import React from "react";

// Renders post text with $CASHTAGS linked to their Robinhood-Chain asset page,
// and bare URLs made clickable. (Mentions can be added once usernames are unique.)
export function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const regex = /(\$[A-Za-z][A-Za-z0-9]{0,9})\b|(https?:\/\/[^\s]+)/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("$")) {
      const sym = tok.slice(1).toUpperCase();
      parts.push(
        <a key={key++} href={`/asset/${sym}`} className="font-semibold text-[var(--accent)] hover:underline">
          ${sym}
        </a>
      );
    } else {
      parts.push(
        <a
          key={key++}
          href={tok}
          target="_blank"
          rel="noreferrer"
          className="break-all text-[var(--accent)] hover:underline"
        >
          {tok}
        </a>
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return <>{parts}</>;
}
