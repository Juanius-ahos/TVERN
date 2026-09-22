"use client";

import { usePathname } from "next/navigation";
import { ConnectButton } from "./ConnectButton";
import { Icon } from "./Icon";
import { Logo } from "./Logo";
import { useSession } from "@/lib/useSession";

const nav = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/search", label: "Search", icon: "search" },
  { href: "/whales", label: "Whales", icon: "waves" },
  { href: "/stocks", label: "Stocks", icon: "trending" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useSession();

  const items = user
    ? [...nav, { href: `/wallet/${user.address}`, label: "Profile", icon: "user" }]
    : nav;

  return (
    <aside className="sticky top-11 flex h-[calc(100dvh-2.75rem)] flex-col justify-between px-2 py-4 lg:px-3">
      <div>
        <a href="/" className="mb-5 flex items-center px-2 py-1">
          <Logo />
        </a>

        <nav className="space-y-1">
          {items.map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <a
                key={n.href}
                href={n.href}
                className={`group flex items-center gap-4 rounded-full px-3 py-2.5 text-[16px] transition ${
                  active ? "bg-white/[0.06] font-bold text-white" : "text-[var(--text)] hover:bg-white/[0.04]"
                }`}
              >
                <Icon name={n.icon} size={22} className={active ? "text-[var(--accent)]" : ""} />
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
