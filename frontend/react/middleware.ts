import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protect all dashboard pages on dash.edufyuzbekistan.com.
// Unauthenticated users (no accessToken cookie) are redirected to /login.

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // Only enforce auth redirects on real production domains.
  // Keep localhost / non-edufyuzbekistan hosts free for local development and previews.
  const isProdHost = host.endsWith("edufyuzbekistan.com");
  if (!isProdHost) {
    return NextResponse.next();
  }

  // Special handling for admin subdomain: show admin UI instead of main landing.
  if (host === "admin.edufyuzbekistan.com") {
    if (pathname === "/") {
      const adminUrl = request.nextUrl.clone();
      adminUrl.pathname = "/admin";
      return NextResponse.redirect(adminUrl);
    }
    // Do not apply user dashboard auth middleware on the admin subdomain.
    return NextResponse.next();
  }

  // Keep public landing page ("/") accessible without auth on regular domains.
  if (pathname === "/") {
    return NextResponse.next();
  }

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
    "/",
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
    "/:userId/dashboard/:path*",
    "/:userId/billing/:path*",
    "/:userId/profile/:path*",
    "/:userId/settings/:path*",
    "/:userId/notifications/:path*",
    "/:userId/schedule/:path*",
    "/:userId/leaderboard/:path*",
    "/:userId/resources/:path*",
    "/:userId/report/:path*",
    "/:userId/mentor/:path*",
    "/:userId/payment/:path*",
  ],
};
