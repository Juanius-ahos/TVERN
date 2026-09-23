"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ConnectButton } from "./ConnectButton";
import { Icon } from "./Icon";
import { Logo } from "./Logo";
import { useSession } from "@/lib/useSession";

const baseNav = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/search", label: "Search", icon: "search" },
  { href: "/explore", label: "Explore", icon: "trending" },
  { href: "/communities", label: "Communities", icon: "users" },
  { href: "/whales", label: "Whales", icon: "waves" },
  { href: "/stocks", label: "Stocks", icon: "trending" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useSession();
  const [unread, setUnread] = useState(0);
  const [dmUnread, setDmUnread] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      setDmUnread(0);
      return;
    }
    const load = async () => {
      try {
        const [n, m] = await Promise.all([
          fetch("/api/notifications").then((r) => r.json()),
          fetch("/api/messages").then((r) => r.json()),
        ]);
        setUnread(n.unread ?? 0);
        setDmUnread(m.unread ?? 0);
      } catch {}
    };
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [user, pathname]);

  const items = user
    ? [
        ...baseNav,
        { href: "/messages", label: "Messages", icon: "mail", badge: dmUnread },
        { href: "/watchlist", label: "Watchlist", icon: "star" },
        { href: "/bookmarks", label: "Bookmarks", icon: "bookmark" },
        { href: "/notifications", label: "Notifications", icon: "bell", badge: unread },
        { href: `/wallet/${user.address}`, label: "Profile", icon: "user" },
        { href: "/settings", label: "Settings", icon: "gear" },
      ]
    : baseNav;

  return (
    <aside className="sticky top-11 flex h-[calc(100dvh-2.75rem)] flex-col justify-between px-2 py-4 lg:px-3">
      <div>
        <a href="/" className="mb-5 flex items-center px-2 py-1">
          <Logo />
        </a>

        <nav className="space-y-1">
          {items.map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            const badge = "badge" in n ? (n.badge as number) : 0;
            return (
              <a
                key={n.href}
                href={n.href}
                className={`group relative flex items-center gap-4 rounded-xl px-3 py-2.5 text-[15.5px] transition ${
                  active
                    ? "bg-[color:var(--accent)]/[0.1] font-bold text-white ring-1 ring-[color:var(--accent)]/20"
                    : "text-[var(--muted)] hover:bg-white/[0.045] hover:text-[var(--text)]"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[var(--accent)]" />
                )}
                <span className="relative">
                  <Icon
                    name={n.icon}
                    size={22}
                    className={`transition ${active ? "text-[var(--accent)]" : "group-hover:text-[var(--text)]"}`}
                  />
                  {badge > 0 && (
                    <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-[var(--accent-ink)] shadow-[0_0_10px_-2px_rgba(204,255,0,0.8)]">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
                <span className="hidden lg:block">{n.label}</span>
              </a>
            );
          })}
        </nav>
      </div>

      <div className="px-1 pb-2">
        <ConnectButton />
      </div>
    </aside>
  );
}
