import fs from "fs";
import path from "path";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

function contentTypeFor(file: string) {
  const lower = file.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}

export async function GET(_req: NextRequest, context: { params: Promise<{ file: string }> }) {
  const params = await context.params;
  const raw = String(params.file || "");
  if (!raw || raw.includes("..") || raw.includes("/") || raw.includes("\\")) {
    return new Response("Not found", { status: 404 });
  }

  const dir = path.join(process.cwd(), "data", "publications_media");
  const p = path.join(dir, raw);
  if (!fs.existsSync(p)) {
    return new Response("Not found", { status: 404 });
  }

  const data = fs.readFileSync(p);
  return new Response(data, {
    status: 200,
    headers: {
      "content-type": contentTypeFor(raw),
      "cache-control": "no-store",
      vary: "Accept-Encoding",
    },
  });
}
