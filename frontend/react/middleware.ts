import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protect all dashboard pages on dash.edufyuzbekistan.com.
// Unauthenticated users (no accessToken cookie) are redirected to /login.

function isProtectedPath(pathname: string) {
  const protectedRoots = [
    "/dashboard",
    "/billing",
    "/profile",
    "/settings",
    "/notifications",
    "/schedule",
    "/leaderboard",
    "/resources",
    "/report",
    "/mentor",
    "/payment",
  ];

  if (protectedRoots.some((root) => pathname === root || pathname.startsWith(`${root}/`))) {
    return true;
  }

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length >= 2) {
    const secondSegment = `/${parts[1]}`;
    if (protectedRoots.some((root) => root === secondSegment)) {
      return true;
    }
  }

  return false;
}

function shouldSkipSeoHeaders(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images")
  );
}

function applyRobotsHeader(response: NextResponse, pathname: string, host: string) {
  if (shouldSkipSeoHeaders(pathname)) return response;

  const indexableHosts = new Set(["edufyuzbekistan.com", "www.edufyuzbekistan.com"]);
  const isIndexableHost = indexableHosts.has(host);
  const noIndexPrefixes = ["/login", "/register", "/reset-password", "/admin"];
  const shouldNoIndex = !isIndexableHost || isProtectedPath(pathname) || noIndexPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  response.headers.set("X-Robots-Tag", shouldNoIndex ? "noindex, follow" : "index, follow");
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const rawHost = request.headers.get("host") || "";
  const host = rawHost.split(":")[0]?.toLowerCase() || "";

  // Only enforce auth redirects on real production domains.
  // Keep localhost / non-edufyuzbekistan hosts free for local development and previews.
  const isProdHost = host.endsWith("edufyuzbekistan.com");
  if (!isProdHost) {
    return applyRobotsHeader(NextResponse.next(), pathname, host);
  }

  // Special handling for admin subdomain: show admin UI instead of main landing.
  if (host === "admin.edufyuzbekistan.com") {
    if (pathname === "/") {
      const adminUrl = request.nextUrl.clone();
      adminUrl.pathname = "/admin";
      return applyRobotsHeader(NextResponse.redirect(adminUrl), pathname, host);
    }
    // Do not apply user dashboard auth middleware on the admin subdomain.
    return applyRobotsHeader(NextResponse.next(), pathname, host);
  }

  // Skip Next.js internal and static assets
  if (shouldSkipSeoHeaders(pathname)) {
    return NextResponse.next();
  }

  // Enforce auth only for protected areas.
  if (isProtectedPath(pathname)) {
    const accessToken = request.cookies.get("accessToken")?.value;

    if (!accessToken) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      if (pathname !== "/") {
        const redirectTarget = pathname + (search || "");
        loginUrl.searchParams.set("redirect", redirectTarget);
      }
      return applyRobotsHeader(NextResponse.redirect(loginUrl), pathname, host);
    }
  }

  return applyRobotsHeader(NextResponse.next(), pathname, host);
}

// Apply middleware only to authenticated dashboard-like routes.
// Public landing and marketing pages (/, /about, /contact, etc.) stay accessible.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
