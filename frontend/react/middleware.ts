import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  resourcesRegistry,
  normalizePlan,
  isPlanSufficient,
  type ResourceCategory,
} from "./lib/resourcesRegistry";

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

function isRegistryCategory(category: string): category is ResourceCategory {
  return category in resourcesRegistry;
}

function parseResourceTarget(pathname: string): { userPrefix: string; category: string; id: string } | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 3) return null;

  // Support both /resources/... and /{userId}/resources/...
  let resourcesIndex = segments.indexOf("resources");
  if (resourcesIndex === -1) return null;

  const userPrefix = resourcesIndex === 1 && /^\d+$/.test(segments[0]) ? `/${segments[0]}` : "";
  const category = segments[resourcesIndex + 1];
  const id = segments[resourcesIndex + 2];
  if (!category || !id) return null;
  return { userPrefix, category, id };
}

function isAdminUiPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function clearAdminTokenCookie(response: NextResponse, request: NextRequest) {
  const rawHost = request.headers.get("host") || "";
  const host = rawHost.split(":")[0]?.toLowerCase() || "";
  const isProdHost = host.endsWith("edufyuzbekistan.com");
  const base = {
    name: "admin_token",
    value: "",
    path: "/",
    maxAge: 0,
    sameSite: "lax" as const,
    secure: request.nextUrl.protocol === "https:",
  };
  // Clear host-only cookie.
  response.cookies.set(base);
  // Clear domain cookie (legacy).
  response.cookies.set({ ...base, domain: isProdHost ? ".edufyuzbekistan.com" : undefined });
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const rawHost = request.headers.get("host") || "";
  const host = rawHost.split(":")[0]?.toLowerCase() || "";

  const apiCandidates = [
    process.env.API_ORIGIN,
    process.env.NEXT_PUBLIC_API_ORIGIN,
    "http://127.0.0.1:8082",
    request.nextUrl.origin,
  ].filter((v): v is string => Boolean(v));

  async function fetchFromApi(path: string, init: RequestInit): Promise<{ res: Response; base: string; url: URL }> {
    let lastError: string | null = null;
    for (const base of apiCandidates) {
      try {
        const url = new URL(path, base);
        const res = await fetch(url, init);
        if (res.status === 404 || res.status === 502 || res.status === 503) {
          lastError = `upstream_${res.status}`;
          continue;
        }
        return { res, base, url };
      } catch (err: any) {
        lastError = String(err?.message ?? err ?? "fetch failed").slice(0, 160);
      }
    }
    throw new Error(lastError || "fetch failed");
  }

  if (request.headers.get("x-edufy-middleware") === "1") {
    return NextResponse.next();
  }

  // Skip Next.js internal and static assets early (also for admin subdomain).
  if (shouldSkipSeoHeaders(pathname)) {
    return NextResponse.next();
  }

  // Never interfere with Next.js Route Handlers under /api.
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (
    pathname === "/resources/materials-sign" ||
    pathname.startsWith("/resources/materials-sign/") ||
    pathname === "/materials-sign" ||
    pathname.startsWith("/materials-sign/") ||
    pathname === "/__materials_sign" ||
    pathname.startsWith("/__materials_sign/")
  ) {
    return NextResponse.next();
  }

  // Only enforce auth redirects on real production domains.
  // Keep localhost / non-edufyuzbekistan hosts free for local development and previews.
  const isProdHost = host.endsWith("edufyuzbekistan.com");
  if (!isProdHost) {
    return applyRobotsHeader(NextResponse.next(), pathname, host);
  }

  // Special handling for admin subdomain: show admin UI instead of main landing.
  if (host === "admin.edufyuzbekistan.com") {
    // Canonical URLs on admin subdomain should NOT contain /admin prefix.
    // Keep /admin as a legacy alias.
    if (pathname === "/admin") {
      const adminToken = request.cookies.get("admin_token")?.value;
      if (!adminToken) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("redirect", pathname + (search || ""));
        return applyRobotsHeader(NextResponse.redirect(loginUrl), pathname, host);
      }

      const rootUrl = request.nextUrl.clone();
      rootUrl.pathname = "/";
      return applyRobotsHeader(NextResponse.redirect(rootUrl), pathname, host);
    }

    // Allow admin API calls.
    if (pathname.startsWith("/admin-api")) {
      return applyRobotsHeader(NextResponse.next(), pathname, host);
    }

    // Admin login should be accessible via /login (canonical) and /admin/login (legacy).
    if (
      pathname === "/login" ||
      pathname.startsWith("/login/") ||
      pathname === "/admin/login" ||
      pathname.startsWith("/admin/login/")
    ) {
      if (pathname === "/login" || pathname.startsWith("/login/")) {
        const rewriteUrl = request.nextUrl.clone();
        rewriteUrl.pathname = "/admin/login";
        return applyRobotsHeader(NextResponse.rewrite(rewriteUrl), pathname, host);
      }
      return applyRobotsHeader(NextResponse.next(), pathname, host);
    }

    let adminToken = request.cookies.get("admin_token")?.value;
    if (!adminToken) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      const redirectTarget = pathname + (search || "");
      loginUrl.searchParams.set("redirect", redirectTarget);
      return applyRobotsHeader(NextResponse.redirect(loginUrl), pathname, host);
    }

    // Backward-compatible: decode old encoded cookies.
    if (adminToken.includes("%")) {
      try {
        adminToken = decodeURIComponent(adminToken);
      } catch {}
    }

    try {
      const infoUrl = new URL("/admin-api/admin/info", request.nextUrl);
      const res = await fetch(infoUrl, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "x-edufy-middleware": "1",
        },
        cache: "no-store",
      });

      if (res.status === 401 || res.status === 403) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        const redirectTarget = pathname + (search || "");
        loginUrl.searchParams.set("redirect", redirectTarget);
        const redirectRes = clearAdminTokenCookie(NextResponse.redirect(loginUrl), request);
        return applyRobotsHeader(redirectRes, pathname, host);
      }
    } catch {
      // If admin service is temporarily unreachable, allow the request to proceed.
    }

    const needsAdminPrefix = pathname === "/" || !isAdminUiPath(pathname);

    if (needsAdminPrefix) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;
      return applyRobotsHeader(NextResponse.rewrite(rewriteUrl), pathname, host);
    }

    // Do not apply user dashboard auth middleware on the admin subdomain.
    return applyRobotsHeader(NextResponse.next(), pathname, host);
  }

  // Protect admin UI routes on the main domain too.
  if (isAdminUiPath(pathname)) {
    if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
      return applyRobotsHeader(NextResponse.next(), pathname, host);
    }
    if (pathname.startsWith("/admin-api")) {
      return applyRobotsHeader(NextResponse.next(), pathname, host);
    }

    const adminToken = request.cookies.get("admin_token")?.value;
    if (!adminToken) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      const redirectTarget = pathname + (search || "");
      loginUrl.searchParams.set("redirect", redirectTarget);
      return applyRobotsHeader(NextResponse.redirect(loginUrl), pathname, host);
    }
  }

  if (pathname === "/The-Role-of-Mothers-in-the-Origins-of-Music") {
    const url = request.nextUrl.clone();
    url.pathname = "/resources/reading/345897";
    return applyRobotsHeader(NextResponse.redirect(url), pathname, host);
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

    const target = parseResourceTarget(pathname);
    if (target) {
      const rule = isRegistryCategory(target.category)
        ? resourcesRegistry[target.category]?.[target.id]
        : undefined;
      const requiredPlan = rule?.requiredPlan ?? "premium";
      if (requiredPlan !== "free") {
        let userPlan = "free";
        let planResolved = false;
        let profileStatus: number | "error" | "skipped" = "skipped";
        let meStatus: number | "error" | "skipped" = "skipped";
        let profileBase = "";
        let meBase = "";
        let profileError: string | null = null;
        let meError: string | null = null;

        try {
          const { res: profileRes, base } = await fetchFromApi("/user/profile", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "x-edufy-middleware": "1",
            },
            cache: "no-store",
          });
          profileBase = base;

          profileStatus = profileRes.status;

          if (profileRes.status === 401 || profileRes.status === 403) {
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = "/login";
            if (pathname !== "/") {
              const redirectTarget = pathname + (search || "");
              loginUrl.searchParams.set("redirect", redirectTarget);
            }
            return applyRobotsHeader(NextResponse.redirect(loginUrl), pathname, host);
          }

          if (profileRes.ok) {
            const body = await profileRes.json().catch(() => null as any);
            const rawPlan =
              body?.plan ??
              body?.data?.plan ??
              body?.user?.plan ??
              body?.profile?.plan ??
              body?.subscription?.plan ??
              body?.data?.subscription?.plan ??
              body?.user?.subscription?.plan ??
              body?.profile?.subscription?.plan ??
              body?.subscriptionPlan ??
              body?.tariff;
            if (rawPlan !== undefined && rawPlan !== null && String(rawPlan).trim()) {
              userPlan = normalizePlan(rawPlan);
              planResolved = true;
            }
          }
        } catch (err: any) {
          profileStatus = "error";
          profileError = String(err?.message ?? err ?? "error").slice(0, 160);
        }

        if (!planResolved) {
          try {
            const { res: meRes, base } = await fetchFromApi("/auth/me", {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "x-edufy-middleware": "1",
              },
              cache: "no-store",
            });
            meBase = base;

            meStatus = meRes.status;

            if (meRes.ok) {
              const body = await meRes.json().catch(() => null as any);
              const rawPlan =
                body?.plan ??
                body?.data?.plan ??
                body?.user?.plan ??
                body?.profile?.plan ??
                body?.subscription?.plan ??
                body?.data?.subscription?.plan ??
                body?.user?.subscription?.plan ??
                body?.profile?.subscription?.plan ??
                body?.subscriptionPlan ??
                body?.tariff;
              if (rawPlan !== undefined && rawPlan !== null && String(rawPlan).trim()) {
                userPlan = normalizePlan(rawPlan);
                planResolved = true;
              }
            }
          } catch (err: any) {
            meStatus = "error";
            meError = String(err?.message ?? err ?? "error").slice(0, 160);
          }
        }

        if (!isPlanSufficient(normalizePlan(userPlan), requiredPlan)) {
          const billingUrl = request.nextUrl.clone();
          billingUrl.pathname = `${target.userPrefix}/billing`;
          if (pathname !== "/") {
            const redirectTarget = pathname + (search || "");
            billingUrl.searchParams.set("redirect", redirectTarget);
          }
          const res = NextResponse.redirect(billingUrl);
          res.headers.set(
            "X-Edufy-Plan-Debug",
            `required=${requiredPlan}; user=${normalizePlan(userPlan)}; resolved=${planResolved ? "1" : "0"}; profile=${profileStatus}; me=${meStatus}; profileBase=${profileBase}; meBase=${meBase}; profileErr=${profileError ?? ""}; meErr=${meError ?? ""}`
          );
          return applyRobotsHeader(res, pathname, host);
        }
      }
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
