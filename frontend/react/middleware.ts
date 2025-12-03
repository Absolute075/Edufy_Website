import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protect all dashboard pages on dash.edufyuzbekistan.com.
// Unauthenticated users (no accessToken cookie) are redirected to /login.

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Public routes that should remain accessible without auth
  const publicPaths = ["/login", "/register"];
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Skip Next.js internal and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("accessToken")?.value;

  if (!accessToken) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    if (pathname !== "/") {
      const redirectTarget = pathname + (search || "");
      loginUrl.searchParams.set("redirect", redirectTarget);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Apply middleware only to authenticated dashboard-like routes.
// Public landing and marketing pages (/, /about, /contact, etc.) stay accessible.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/billing/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/notifications/:path*",
    "/schedule/:path*",
    "/leaderboard/:path*",
    "/resources/:path*",
    "/report/:path*",
    "/mentor/:path*",
    "/payment/:path*",
  ],
};
