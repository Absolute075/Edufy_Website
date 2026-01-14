import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { isPlanSufficient, normalizePlan } from "@/lib/resourcesRegistry";
import { videoResourcesRegistry } from "@/lib/videoResourcesRegistry";
import { satVideoResourcesRegistry } from "@/lib/satVideoResourcesRegistry";

export const runtime = "nodejs";

type Catalog = "ielts" | "sat";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

function extractRawPlan(body: any) {
  if (!body) return undefined;

  return (
    body?.plan ??
    body?.data?.plan ??
    body?.user?.plan ??
    body?.data?.user?.plan ??
    body?.profile?.plan ??
    body?.data?.profile?.plan ??
    body?.user?.profile?.plan ??
    body?.data?.user?.profile?.plan ??
    body?.subscription?.plan ??
    body?.data?.subscription?.plan ??
    body?.user?.subscription?.plan ??
    body?.data?.user?.subscription?.plan ??
    body?.profile?.subscription?.plan ??
    body?.data?.profile?.subscription?.plan ??
    body?.user?.profile?.subscription?.plan ??
    body?.data?.user?.profile?.subscription?.plan ??
    body?.subscriptionPlan ??
    body?.data?.subscriptionPlan ??
    body?.tariff ??
    body?.data?.tariff
  );
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

  const rawPlan = extractRawPlan(body);

  const userKey = String(id ?? username ?? email ?? "").trim();
  if (!userKey) {
    throw new Error("unauthorized");
  }

  let plan = normalizePlan(rawPlan);
  if (plan === "free") {
    try {
      const profileRes = await fetchFromApi(request, "/user/profile", {
        headers: {
          cookie: cookieHeader,
          "x-edufy-middleware": "1",
          Accept: "application/json",
        },
        cache: "no-store",
      });
      if (profileRes.ok) {
        const p: any = await profileRes.json().catch(() => null);
        const rawProfilePlan = extractRawPlan(p);
        if (rawProfilePlan !== undefined && rawProfilePlan !== null && String(rawProfilePlan).trim()) {
          plan = normalizePlan(rawProfilePlan);
        }
      }
    } catch {
      // ignore
    }
  }

  return { userKey, role: String(role ?? "").trim(), plan };
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function signToken(payload: object, secret: string): string {
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(createHmac("sha256", secret).update(body).digest());
  return `${body}.${sig}`;
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

export async function POST(request: Request) {
  const secret = String(process.env.VIDEO_TOKEN_SECRET || "").trim();
  if (!secret) {
    return json({ error: "missing_secret" }, 500);
  }

  let identity: { userKey: string; role: string; plan: string };
  try {
    identity = await getUserIdentity(request);
  } catch {
    return json({ error: "unauthorized" }, 401);
  }

  const payload: any = await request.json().catch(() => null);
  const catalog = String(payload?.catalog || "").trim().toLowerCase() as Catalog;
  const id = String(payload?.id || "").trim();

  if (catalog !== "ielts" && catalog !== "sat") {
    return json({ error: "invalid_catalog" }, 400);
  }

  if (!id) {
    return json({ error: "missing_id" }, 400);
  }

  const rule = getRule(catalog, id);
  if (!rule || rule.mediaType !== "video" || !rule.href) {
    return json({ error: "not_found" }, 404);
  }

  const isAdmin = String(identity.role).toUpperCase() === "ADMIN";
  const required = rule.requiredPlan;
  const userPlan = isAdmin ? "premium" : identity.plan;

  if (!isAdmin && !isPlanSufficient(userPlan as any, required as any)) {
    return NextResponse.json(
      { error: "forbidden" },
      {
        status: 403,
        headers: {
          "cache-control": "no-store",
          "x-edufy-plan-debug": `required=${String(required)}; user=${String(userPlan)}; role=${String(
            identity.role
          )}; catalog=${String(catalog)}; id=${String(id)}; auth=cookie`,
        },
      }
    );
  }

  const exp = Math.floor(Date.now() / 1000) + 1800;
  const token = signToken({ sub: identity.userKey, id, catalog, exp }, secret);

  const v = verifyToken(token, secret);
  if (!v.ok) {
    return json({ error: "token_failed" }, 500);
  }

  return json({ token, exp }, 200);
}
