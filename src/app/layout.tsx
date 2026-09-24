import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "@/components/Sidebar";
import { RightRail } from "@/components/RightRail";
import { TopBar } from "@/components/TopBar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["opsz"],
});

const STABLE_URL = "https://tvern.xyz";

export const metadata: Metadata = {
  metadataBase: new URL(STABLE_URL),
  title: {
    default: "The Tavern, the live market and community for Robinhood Chain",
    template: "%s · The Tavern",
  },
  description:
    "See every token, trade, and conversation on Robinhood Chain, live. The Tavern is where the chain gathers.",
  openGraph: {
    type: "website",
    siteName: "The Tavern",
    url: STABLE_URL,
    title: "The Tavern, the live market and community for Robinhood Chain",
    description:
      "See every token, trade, and conversation on Robinhood Chain, live. The Tavern is where the chain gathers.",
  },
  twitter: {
    card: "summary",
    title: "The Tavern, the live market and community for Robinhood Chain",
    description:
      "See every token, trade, and conversation on Robinhood Chain, live. The Tavern is where the chain gathers.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`} suppressHydrationWarning>
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
          <div className="mx-auto flex w-full max-w-[1600px]">
            {/* Left nav */}
            <div className="w-[68px] shrink-0 border-r hairline lg:w-[248px]">
              <Sidebar />
            </div>

            {/* Center feed, fills available width */}
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
