import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "@/components/Sidebar";
import { RightRail } from "@/components/RightRail";
import { TopBar } from "@/components/TopBar";
import { MarketTicker } from "@/components/MarketTicker";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "The Tavern — where Robinhood Chain gathers",
  description:
    "Pull up a stool. Watch the whales, swap the alpha, and see what's happening on Robinhood Chain — live.",
  icons: { icon: "/logo.svg", shortcut: "/logo.svg", apple: "/logo.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-dvh antialiased">
        <Providers>
          <TopBar />
          <MarketTicker />
          <div className="mx-auto flex w-full max-w-[1760px]">
            {/* Left nav */}
            <div className="w-[68px] shrink-0 border-r hairline lg:w-[248px]">
              <Sidebar />
            </div>

            {/* Center feed — fills available width */}
            <div className="min-w-0 flex-1 border-r hairline">{children}</div>

            {/* Right rail */}
            <div className="hidden w-[340px] shrink-0 xl:block 2xl:w-[380px]">
              <div className="px-5 py-4">
                <RightRail />
              </div>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
