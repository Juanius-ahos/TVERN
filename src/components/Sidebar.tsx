"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ConnectButton } from "./ConnectButton";
import { Icon } from "./Icon";
import { Logo } from "./Logo";
import { useSession } from "@/lib/useSession";

const baseNav = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/explore", label: "Explore", icon: "compass" },
  { href: "/tokens", label: "Markets", icon: "markets", accent: true },
  { href: "/search", label: "Search", icon: "search" },
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
        { href: "/notifications", label: "Notifications", icon: "bell", badge: unread },
        { href: "/messages", label: "Messages", icon: "mail", badge: dmUnread },
        { href: `/wallet/${user.address}`, label: "Profile", icon: "user" },
      ]
    : baseNav;

  return (
    <aside className="sticky top-11 flex h-[calc(100dvh-2.75rem)] flex-col justify-between px-2 py-4 lg:px-3">
      <div>
        <a href="/" className="mb-6 flex items-center px-2 py-1">
          <Logo />
        </a>

        <nav className="space-y-0.5">
          {items.map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            const badge = "badge" in n ? (n.badge as number) : 0;
            const accent = "accent" in n && (n as { accent?: boolean }).accent === true;
            return (
              <a
                key={n.href}
                href={n.href}
                className={`group relative flex items-center gap-4 rounded-lg px-3 py-2.5 text-[15px] transition ${
                  accent
                    ? "bg-[color:var(--accent)]/10 font-semibold text-[var(--accent-text)] hover:bg-[color:var(--accent)]/20"
                    : active
                      ? "font-semibold text-[var(--text)]"
                      : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                <span className="relative">
                  {accent ? (
                    <svg
                      width="21"
                      height="21"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M4 19V11M9 19V6M14 19v-9M19 19V8" />
                    </svg>
                  ) : (
                    <Icon
                      name={n.icon}
                      size={21}
                      fill={active && (n.icon === "home" || n.icon === "user")}
                      className={active ? "text-[var(--text)]" : "text-[var(--muted)] group-hover:text-[var(--text)]"}
                    />
                  )}
                  {badge > 0 && (
                    <span className="absolute -right-1.5 -top-1 grid h-[15px] min-w-[15px] place-items-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-[var(--accent-ink)]">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
                <span className="hidden lg:block">{n.label}</span>
              </a>
            );
          })}

          {user && (
            <a
              href="/settings"
              className={`group flex items-center gap-4 rounded-lg px-3 py-2.5 text-[15px] transition ${
                pathname.startsWith("/settings")
                  ? "font-semibold text-[var(--text)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              <Icon name="gear" size={21} className="text-[var(--muted)] group-hover:text-[var(--text)]" />
              <span className="hidden lg:block">Settings</span>
            </a>
          )}
        </nav>
      </div>

      <div className="px-1 pb-2">
        <ConnectButton />
        <div className="mt-3 hidden gap-3 px-2 text-[12px] text-[var(--faint)] lg:flex">
          <a href="/docs" className="hover:text-[var(--muted)]">
            Docs
          </a>
          <a href="/docs#api" className="hover:text-[var(--muted)]">
            API
          </a>
        </div>
      </div>
    </aside>
  );
}
