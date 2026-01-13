import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { isPlanSufficient, normalizePlan } from "@/lib/resourcesRegistry";
import { videoResourcesRegistry } from "@/lib/videoResourcesRegistry";
import { satVideoResourcesRegistry } from "@/lib/satVideoResourcesRegistry";

export const runtime = "nodejs";

type Catalog = "ielts" | "sat";

function noStoreHeaders(extra?: Record<string, string>) {
  return {
    "cache-control": "no-store",
    ...extra,
  };
}

async function fetchFromApi(request: Request, path: string, init: RequestInit) {
  const requestOrigin = (() => {
    try {
      return new URL(request.url).origin;
    } catch {
      return "";
    }
  })();

  const apiCandidates = [
    process.env.API_ORIGIN,
    process.env.NEXT_PUBLIC_API_ORIGIN,
    "http://127.0.0.1:8082",
    requestOrigin,
  ].filter((v): v is string => Boolean(v));

  let lastError: string | null = null;
  for (const base of apiCandidates) {
    try {
      const url = new URL(path, base);
      const res = await fetch(url, init);
      if (res.status === 404 || res.status === 502 || res.status === 503) {
        lastError = `upstream_${res.status}`;
        continue;
      }
      return res;
    } catch (err: any) {
      lastError = String(err?.message ?? err ?? "fetch failed").slice(0, 160);
    }
  }
  throw new Error(lastError || "fetch failed");
}

async function getUserIdentity(request: Request): Promise<{ userKey: string; role: string; plan: string }> {
  const cookieHeader = request.headers.get("cookie") || "";
  if (!cookieHeader) {
    throw new Error("unauthorized");
  }

  const res = await fetchFromApi(request, "/auth/me", {
    headers: {
      cookie: cookieHeader,
      "x-edufy-middleware": "1",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("unauthorized");
  }

  const body: any = await res.json().catch(() => null);

  const id = body?.id ?? body?.user?.id ?? body?.data?.id;
  const username = body?.username ?? body?.user?.username ?? body?.data?.username;
  const email = body?.email ?? body?.user?.email ?? body?.data?.email;
  const role = body?.role ?? body?.user?.role ?? body?.data?.role ?? "";

  const rawPlan =
    body?.plan ??
    body?.data?.plan ??
    body?.user?.plan ??
    body?.profile?.plan ??
    body?.subscriptionPlan ??
    body?.tariff;

  const userKey = String(id ?? username ?? email ?? "").trim();
  if (!userKey) {
    throw new Error("unauthorized");
  }

  const plan = normalizePlan(rawPlan);
  return { userKey, role: String(role ?? "").trim(), plan };
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function verifyToken(token: string, secret: string): { ok: boolean; payload: any | null } {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return { ok: false, payload: null };
  const [body, sig] = parts;

  const expected = b64url(createHmac("sha256", secret).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, payload: null };
  }

  try {
    const jsonStr = Buffer.from(body.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const payload = JSON.parse(jsonStr);
    return { ok: true, payload };
  } catch {
    return { ok: false, payload: null };
  }
}

function getRule(catalog: Catalog, id: string) {
  if (catalog === "ielts") return videoResourcesRegistry[id] || null;
  return satVideoResourcesRegistry[id] || null;
}

function getHlsRootFromHref(href: string): { rootUrl: string; keyFile: string } {
  const u = new URL(href);
  const pathname = u.pathname;
  const lastSlash = pathname.lastIndexOf("/");
  const dir = lastSlash >= 0 ? pathname.slice(0, lastSlash + 1) : "/";
  const filename = lastSlash >= 0 ? pathname.slice(lastSlash + 1) : pathname;
  const base = filename.replace(/\.[^.]+$/, "");
  const rootPath = `${dir}hls/${base}/`;
  return { rootUrl: `${u.origin}${rootPath}`, keyFile: "enc.key" };
}

export async function GET(request: Request) {
  const secret = String(process.env.VIDEO_TOKEN_SECRET || "").trim();
  if (!secret) {
    return new NextResponse(JSON.stringify({ error: "missing_secret" }), {
      status: 500,
      headers: noStoreHeaders({ "content-type": "application/json" }),
    });
  }

  const upstreamSecret = String(process.env.VIDEO_UPSTREAM_SECRET || "").trim();

  const url = new URL(request.url);
  const catalog = String(url.searchParams.get("catalog") || "").trim().toLowerCase() as Catalog;
  const id = String(url.searchParams.get("id") || "").trim();
  const token = String(url.searchParams.get("token") || "").trim();

  if (catalog !== "ielts" && catalog !== "sat") {
    return new NextResponse(JSON.stringify({ error: "invalid_catalog" }), {
      status: 400,
      headers: noStoreHeaders({ "content-type": "application/json" }),
    });
  }

  if (!id || !token) {
    return new NextResponse(JSON.stringify({ error: "missing_params" }), {
      status: 400,
      headers: noStoreHeaders({ "content-type": "application/json" }),
    });
  }

  const verified = verifyToken(token, secret);
  if (!verified.ok) {
    return new NextResponse(JSON.stringify({ error: "invalid_token" }), {
      status: 401,
      headers: noStoreHeaders({ "content-type": "application/json" }),
    });
  }

  const p: any = verified.payload || null;
  const exp = Number(p?.exp ?? 0);
  if (!exp || exp < Math.floor(Date.now() / 1000)) {
    return new NextResponse(JSON.stringify({ error: "expired" }), {
      status: 401,
      headers: noStoreHeaders({ "content-type": "application/json" }),
    });
  }

  if (String(p?.id ?? "") !== id || String(p?.catalog ?? "") !== catalog) {
    return new NextResponse(JSON.stringify({ error: "token_mismatch" }), {
      status: 401,
      headers: noStoreHeaders({ "content-type": "application/json" }),
    });
  }

  let identity: { userKey: string; role: string; plan: string };
  try {
    identity = await getUserIdentity(request);
  } catch {
    return new NextResponse(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: noStoreHeaders({ "content-type": "application/json" }),
    });
  }

  if (String(p?.sub ?? "") !== identity.userKey) {
    return new NextResponse(JSON.stringify({ error: "token_user_mismatch" }), {
      status: 401,
      headers: noStoreHeaders({ "content-type": "application/json" }),
    });
  }

  const rule = getRule(catalog, id);
  if (!rule || rule.mediaType !== "video" || !rule.href) {
    return new NextResponse(JSON.stringify({ error: "not_found" }), {
      status: 404,
      headers: noStoreHeaders({ "content-type": "application/json" }),
    });
  }

  const isAdmin = String(identity.role).toUpperCase() === "ADMIN";
  const required = rule.requiredPlan;
  const userPlan = isAdmin ? "premium" : identity.plan;
  if (!isAdmin && !isPlanSufficient(userPlan as any, required as any)) {
    return new NextResponse(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: noStoreHeaders({ "content-type": "application/json" }),
    });
  }

  const { rootUrl, keyFile } = getHlsRootFromHref(rule.href);
  const upstream = new URL(keyFile, rootUrl);

  const upstreamRes = await fetch(upstream, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/octet-stream",
      ...(upstreamSecret ? { "x-video-internal": upstreamSecret } : null),
    },
  });

  if (!upstreamRes.ok) {
    return new NextResponse(JSON.stringify({ error: `upstream_${upstreamRes.status}` }), {
      status: upstreamRes.status,
      headers: noStoreHeaders({ "content-type": "application/json" }),
    });
  }

  const body = await upstreamRes.arrayBuffer();
  return new NextResponse(body, {
    status: 200,
    headers: noStoreHeaders({
      "content-type": "application/octet-stream",
    }),
  });
}
