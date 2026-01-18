import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

async function requireAdmin(request: Request): Promise<{ ok: true } | { ok: false; res: NextResponse }> {
  const cookieStore = await cookies();
  const tokenRaw = cookieStore.get("admin_token")?.value;
  const cookieHeader = request.headers.get("cookie") || "";

  const requestOrigin = (() => {
    try {
      return new URL(request.url).origin;
    } catch {
      return "";
    }
  })();

  if (!tokenRaw) {
    if (!cookieHeader) {
      return { ok: false, res: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
    }

    const candidates = [
      process.env.API_ORIGIN,
      process.env.NEXT_PUBLIC_API_ORIGIN,
      "http://127.0.0.1:8082",
      requestOrigin,
    ].filter((v): v is string => Boolean(v));

    for (const base of candidates) {
      try {
        const meUrl = new URL("/auth/me", base);
        const res = await fetch(meUrl, {
          headers: {
            cookie: cookieHeader,
            "x-edufy-middleware": "1",
            Accept: "application/json",
          },
          cache: "no-store",
        });

        if (res.status === 401) {
          return { ok: false, res: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
        }

        if (!res.ok) {
          continue;
        }

        const data: any = await res.json().catch(() => null);
        const role = String(data?.role ?? "").toUpperCase();
        if (role !== "ADMIN") {
          return { ok: false, res: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
        }

        return { ok: true };
      } catch {
      }
    }

    return { ok: false, res: NextResponse.json({ error: "upstream_unreachable" }, { status: 502 }) };
  }

  let token = tokenRaw;
  if (token.includes("%")) {
    try {
      token = decodeURIComponent(token);
    } catch {}
  }

  const candidates = [process.env.ADMIN_API_ORIGIN, "http://127.0.0.1:8090", requestOrigin].filter(
    (v): v is string => Boolean(v)
  );

  let res: Response | null = null;
  for (const base of candidates) {
    try {
      const infoUrl = new URL("/admin-api/admin/info", base);
      res = await fetch(infoUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-edufy-middleware": "1",
          Accept: "application/json",
        },
        cache: "no-store",
      });
      break;
    } catch {
      res = null;
    }
  }

  if (!res) {
    return { ok: false, res: NextResponse.json({ error: "upstream_unreachable" }, { status: 502 }) };
  }

  if (res.status === 401 || res.status === 403) {
    return { ok: false, res: NextResponse.json({ error: "unauthorized" }, { status: res.status }) };
  }

  if (!res.ok) {
    return { ok: false, res: NextResponse.json({ error: "upstream_error" }, { status: 502 }) };
  }

  return { ok: true };
}

function guessExtension(fileName: string, type: string) {
  const lower = String(fileName || "").toLowerCase();
  const idx = lower.lastIndexOf(".");
  if (idx > -1 && idx < lower.length - 1) {
    const ext = lower.slice(idx + 1).replace(/[^a-z0-9]/g, "");
    if (ext) return ext;
  }

  const ct = String(type || "").toLowerCase();
  if (ct === "image/png") return "png";
  if (ct === "image/jpeg" || ct === "image/jpg") return "jpg";
  if (ct === "image/webp") return "webp";
  if (ct === "image/gif") return "gif";
  if (ct === "video/mp4") return "mp4";
  if (ct === "video/webm") return "webm";
  if (ct === "video/quicktime") return "mov";
  return "bin";
}

function isGifSignature(head: Buffer) {
  if (!head || head.length < 6) return false;
  const sig = head.subarray(0, 6).toString("ascii");
  return sig === "GIF87a" || sig === "GIF89a";
}

function isWebmSignature(head: Buffer) {
  // EBML header: 1A 45 DF A3
  return head?.length >= 4 && head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3;
}

function isMp4Signature(head: Buffer) {
  // ISO BMFF: .... 'ftyp'
  return head?.length >= 12 && head.subarray(4, 8).toString("ascii") === "ftyp";
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.res;

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  const type = String(file.type || "");
  const typeLower = type.toLowerCase();
  const extGuessed = guessExtension(file.name, type);
  const allowedImageExts = ["png", "jpg", "jpeg", "webp", "gif"];
  const allowedVideoExts = ["mp4", "webm", "mov", "m4v"];
  const allowedExts = [...allowedImageExts, ...allowedVideoExts];

  // Detect actual format for common "fake gif" cases (mp4/webm saved as .gif)
  let ext = extGuessed;
  if (extGuessed === "gif") {
    try {
      const head = Buffer.from(await file.slice(0, 16).arrayBuffer());
      if (!isGifSignature(head)) {
        if (isWebmSignature(head)) {
          ext = "webm";
        } else if (isMp4Signature(head)) {
          ext = "mp4";
        } else {
          return NextResponse.json({ error: "invalid_gif" }, { status: 400 });
        }
      }
    } catch {
      return NextResponse.json({ error: "invalid_gif" }, { status: 400 });
    }
  }

  const allowExtensionFallback = typeLower === "" || typeLower === "application/octet-stream";
  const isImageType = typeLower.startsWith("image/");
  const isVideoType = typeLower.startsWith("video/");
  const isImageExt = allowedImageExts.includes(ext);
  const isVideoExt = allowedVideoExts.includes(ext);

  if (
    !(allowExtensionFallback && allowedExts.includes(ext)) &&
    !((isImageType && isImageExt) || (isVideoType && isVideoExt) || (isImageType && isVideoExt))
  ) {
    // (isImageType && isVideoExt) is for "fake gif" where browser sends image/gif but bytes are mp4/webm.
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }

  const size = Number(file.size || 0);
  if (!Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: "empty_file" }, { status: 400 });
  }

  const maxBytes = allowedVideoExts.includes(ext) ? 60 * 1024 * 1024 : ext === "gif" ? 30 * 1024 * 1024 : 15 * 1024 * 1024;
  if (size > maxBytes) {
    return NextResponse.json({ error: "file_too_large" }, { status: 400 });
  }

  if (!(allowedExts.includes(ext))) {
    return NextResponse.json({ error: "unsupported_extension" }, { status: 400 });
  }

  const id = crypto.randomBytes(16).toString("hex");
  const normalizedExt = ext === "jpeg" ? "jpg" : ext;
  const filename = `${id}.${normalizedExt}`;

  const dir = path.join(process.cwd(), "data", "publications_media");
  fs.mkdirSync(dir, { recursive: true });

  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(dir, filename), buf);

  const url = `/api/publications/media/${encodeURIComponent(filename)}`;
  return NextResponse.json({ url }, { status: 201 });
}
