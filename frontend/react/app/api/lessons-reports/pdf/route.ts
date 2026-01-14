import { NextResponse } from "next/server";
import { dirname, join } from "path";
import { mkdir, open, readFile, rename, stat, unlink, writeFile } from "fs/promises";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { isPlanSufficient, normalizePlan } from "@/lib/resourcesRegistry";
import { videoResourcesRegistry } from "@/lib/videoResourcesRegistry";
import { satVideoResourcesRegistry } from "@/lib/satVideoResourcesRegistry";

export const runtime = "nodejs";

type Catalog = "ielts" | "sat";

function noStoreHeaders(extra?: Record<string, string>) {
  return {
    "cache-control": "no-store",
    ...(extra || {}),
  };
}

function normalizeCatalog(input: unknown): Catalog {
  const v = String(input ?? "")
    .trim()
    .toLowerCase();
  return v === "sat" ? "sat" : "ielts";
}

function getRule(catalog: Catalog, id: string) {
  if (catalog === "ielts") return videoResourcesRegistry[id] || null;
  return satVideoResourcesRegistry[id] || null;
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

async function getUserIdentity(request: Request): Promise<{ userId: string; role: string; plan: string }> {
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
    body?.subscription?.plan ??
    body?.data?.subscription?.plan ??
    body?.user?.subscription?.plan ??
    body?.profile?.subscription?.plan ??
    body?.subscriptionPlan ??
    body?.tariff;

  const userId = String(id ?? username ?? email ?? "").trim();
  if (!userId) {
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
        const rawProfilePlan =
          p?.plan ??
          p?.data?.plan ??
          p?.user?.plan ??
          p?.profile?.plan ??
          p?.subscription?.plan ??
          p?.data?.subscription?.plan ??
          p?.user?.subscription?.plan ??
          p?.profile?.subscription?.plan ??
          p?.subscriptionPlan ??
          p?.tariff;
        if (rawProfilePlan !== undefined && rawProfilePlan !== null && String(rawProfilePlan).trim()) {
          plan = normalizePlan(rawProfilePlan);
        }
      }
    } catch {
      // ignore
    }
  }
  return { userId, role: String(role ?? "").trim(), plan };
}

function getCacheFilePath(catalog: Catalog, materialId: string, userId: string) {
  const base = join(process.cwd(), "..", "..", "storage", "pdf-cache", catalog, materialId);
  return join(base, `${userId}.pdf`);
}

async function withFileLock<T>(lockPath: string, fn: () => Promise<T>) {
  let handle: any = null;

  const startedAt = Date.now();
  const timeoutMs = 60_000;
  const staleMs = 5 * 60_000;

  while (!handle) {
    try {
      handle = await open(lockPath, "wx");
    } catch (err: any) {
      const code = String(err?.code ?? "");
      if (code !== "EEXIST") throw err;

      try {
        const st = await stat(lockPath);
        const ageMs = Date.now() - st.mtimeMs;
        if (Number.isFinite(ageMs) && ageMs > staleMs) {
          await unlink(lockPath).catch(() => {});
          continue;
        }
      } catch {
        // ignore
      }
      if (Date.now() - startedAt > timeoutMs) {
        throw new Error("lock_timeout");
      }
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  try {
    return await fn();
  } finally {
    try {
      await handle.close();
    } catch {}
    try {
      await unlink(lockPath);
    } catch {}
  }
}

async function fileExistsAndFresh(filePath: string, maxAgeMs: number) {
  try {
    const st = await stat(filePath);
    if (!st.isFile()) return false;
    const ageMs = Date.now() - st.mtimeMs;
    return ageMs >= 0 && ageMs <= maxAgeMs;
  } catch {
    return false;
  }
}

async function generateWatermarkedPdf(srcPdf: Uint8Array, watermarkText: string) {
  const pdfDoc = await PDFDocument.load(srcPdf);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();
  for (const page of pages) {
    const { width, height } = page.getSize();
    const fontSize = Math.max(16, Math.min(width, height) / 18);

    const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
    const x = Math.max(10, (width - textWidth) / 2);
    const y = height / 2;

    page.drawText(watermarkText, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.5, 0.5, 0.5),
      rotate: degrees(35),
      opacity: 0.12,
    });

    page.drawText(watermarkText, {
      x: Math.max(10, width * 0.08),
      y: Math.max(10, height * 0.12),
      size: Math.max(12, fontSize * 0.75),
      font,
      color: rgb(0.6, 0.6, 0.6),
      rotate: degrees(35),
      opacity: 0.08,
    });
  }

  const out = await pdfDoc.save();
  return new Uint8Array(out);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const catalog = normalizeCatalog(url.searchParams.get("catalog"));
  const id = String(url.searchParams.get("id") || "").trim();

  if (!id) {
    return new NextResponse(JSON.stringify({ error: "missing_id" }), {
      status: 400,
      headers: noStoreHeaders({ "content-type": "application/json" }),
    });
  }

  let identity: { userId: string; role: string; plan: string };
  try {
    identity = await getUserIdentity(request);
  } catch {
    return new NextResponse(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: noStoreHeaders({ "content-type": "application/json" }),
    });
  }

  const rule = getRule(catalog, id);
  if (!rule || rule.mediaType !== "file" || !rule.href) {
    return new NextResponse(JSON.stringify({ error: "not_found" }), {
      status: 404,
      headers: noStoreHeaders({ "content-type": "application/json" }),
    });
  }

  const href = String(rule.href || "").trim();
  if (!/\.pdf($|\?)/i.test(href)) {
    return new NextResponse(JSON.stringify({ error: "unsupported_file" }), {
      status: 415,
      headers: noStoreHeaders({ "content-type": "application/json" }),
    });
  }

  const isAdmin = String(identity.role).toUpperCase() === "ADMIN";
  const required = rule.requiredPlan;
  const userPlan = isAdmin ? "premium" : identity.plan;

  if (!isAdmin && !isPlanSufficient(userPlan as any, required as any)) {
    return new NextResponse(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: noStoreHeaders({
        "content-type": "application/json",
        "x-edufy-plan-debug": `required=${required}; user=${String(userPlan)}; role=${String(identity.role)}; catalog=${catalog}; id=${id}`,
      }),
    });
  }

  const cacheMaxAgeMs = 30 * 24 * 60 * 60 * 1000;
  const cachePath = getCacheFilePath(catalog, id, identity.userId);
  const lockPath = `${cachePath}.lock`;

  const upstreamSecret = String(process.env.VIDEO_UPSTREAM_SECRET || "").trim();

  const dir = dirname(cachePath);
  await mkdir(dir, { recursive: true });

  if (await fileExistsAndFresh(cachePath, cacheMaxAgeMs)) {
    const cached = await readFile(cachePath);
    return new NextResponse(cached, {
      status: 200,
      headers: noStoreHeaders({
        "content-type": "application/pdf",
        "content-disposition": 'inline; filename="document.pdf"',
        "x-content-type-options": "nosniff",
      }),
    });
  }

  return await withFileLock(lockPath, async () => {
    if (await fileExistsAndFresh(cachePath, cacheMaxAgeMs)) {
      const cached = await readFile(cachePath);
      return new NextResponse(cached, {
        status: 200,
        headers: noStoreHeaders({
          "content-type": "application/pdf",
          "content-disposition": 'inline; filename="document.pdf"',
          "x-content-type-options": "nosniff",
        }),
      });
    }

    let upstreamUrl: URL;
    try {
      upstreamUrl = new URL(href);
    } catch {
      return new NextResponse(JSON.stringify({ error: "bad_href" }), {
        status: 500,
        headers: noStoreHeaders({ "content-type": "application/json" }),
      });
    }

    const allowedOrigin = "https://resources.edufyuzbekistan.com";
    if (upstreamUrl.origin !== allowedOrigin) {
      return new NextResponse(JSON.stringify({ error: "bad_origin" }), {
        status: 400,
        headers: noStoreHeaders({ "content-type": "application/json" }),
      });
    }

    const upstreamRes = await fetch(upstreamUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/pdf",
        ...(upstreamSecret ? { "x-video-internal": upstreamSecret } : null),
      },
    });

    if (!upstreamRes.ok) {
      return new NextResponse(JSON.stringify({ error: `upstream_${upstreamRes.status}` }), {
        status: upstreamRes.status,
        headers: noStoreHeaders({ "content-type": "application/json" }),
      });
    }

    const buf = new Uint8Array(await upstreamRes.arrayBuffer());
    const watermarkText = `edufyuzbekistan.com • ${identity.userId}`;
    const out = await generateWatermarkedPdf(buf, watermarkText);

    const tmpPath = `${cachePath}.tmp`;
    await writeFile(tmpPath, out);
    await unlink(cachePath).catch(() => {});
    await rename(tmpPath, cachePath);

    return new NextResponse(out, {
      status: 200,
      headers: noStoreHeaders({
        "content-type": "application/pdf",
        "content-disposition": 'inline; filename="document.pdf"',
        "x-content-type-options": "nosniff",
      }),
    });
  });
}
