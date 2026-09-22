import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// If you're not signed in, every page sends you to /login (the main page).
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has("wtf_session");
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Run on everything EXCEPT /login, API routes, Next internals, and static assets.
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico|logo.svg|uploads).*)"],
};
