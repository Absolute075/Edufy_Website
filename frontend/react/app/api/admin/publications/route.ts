import { NextResponse } from "next/server";
import {
  listPublications,
  readPublicationsFile,
  writePublicationsFile,
  type Publication,
  type PublicationBlock,
  type PublicationType,
} from "@/lib/publicationsStore";

async function requireAdmin(request: Request): Promise<{ ok: true } | { ok: false; res: NextResponse }> {
  const cookie = request.headers.get("cookie") || "";
  const origin = (() => {
    try {
      return new URL(request.url).origin;
    } catch {
      return "";
    }
  })();

  if (!origin) {
    return { ok: false, res: NextResponse.json({ error: "bad_request" }, { status: 400 }) };
  }

  try {
    const res = await fetch(`${origin}/api/admin/info`, {
      headers: { cookie, Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return { ok: false, res: NextResponse.json({ error: "unauthorized" }, { status: res.status }) };
    }

    return { ok: true };
  } catch {
    return { ok: false, res: NextResponse.json({ error: "auth_check_failed" }, { status: 502 }) };
  }
}

function normalizeType(input: unknown): PublicationType {
  return String(input || "").trim().toLowerCase() === "changelog" ? "changelog" : "changelog";
}

function normalizeBlocks(input: unknown): PublicationBlock[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((b) => {
      const title = String((b as any)?.title || "").trim();
      const itemsRaw = Array.isArray((b as any)?.items) ? (b as any).items : [];
      const items = itemsRaw.map((x: any) => String(x || "").trim()).filter(Boolean);
      return { title, items };
    })
    .filter((b) => b.title && b.items.length);
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.res;

  const url = new URL(request.url);
  const typeRaw = String(url.searchParams.get("type") || "").trim();
  const type = (typeRaw === "changelog" ? "changelog" : undefined) as PublicationType | undefined;

  const publications = listPublications(type, false);
  return NextResponse.json({ publications }, { status: 200 });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.res;

  const body: any = await request.json().catch(() => null);
  const now = new Date().toISOString();

  const type = normalizeType(body?.type);
  const title = String(body?.title || "").trim();
  const date = String(body?.date || "").trim();
  const imageUrlRaw = String(body?.imageUrl || "").trim();
  const imageUrl = imageUrlRaw ? imageUrlRaw : undefined;
  const blocks = normalizeBlocks(body?.blocks);
  const published = Boolean(body?.published);

  if (!title || !date || !blocks.length) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const id = `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const entry: Publication = {
    id,
    type,
    title,
    date,
    imageUrl,
    blocks,
    published,
    createdAt: now,
    updatedAt: now,
  };

  const file = readPublicationsFile();
  file.publications.unshift(entry);
  writePublicationsFile(file);

  return NextResponse.json({ publication: entry }, { status: 201 });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.res;

  const body: any = await request.json().catch(() => null);
  const id = String(body?.id || "").trim();
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  const file = readPublicationsFile();
  const idx = file.publications.findIndex((p) => p.id === id);
  if (idx < 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const existing = file.publications[idx];
  const now = new Date().toISOString();

  const title = String(body?.title ?? existing.title).trim();
  const date = String(body?.date ?? existing.date).trim();
  const imageUrlRaw = String(body?.imageUrl ?? existing.imageUrl ?? "").trim();
  const imageUrl = imageUrlRaw ? imageUrlRaw : undefined;
  const published = typeof body?.published === "boolean" ? body.published : existing.published;
  const blocks = body?.blocks ? normalizeBlocks(body.blocks) : existing.blocks;

  if (!title || !date || !blocks.length) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const updated: Publication = {
    ...existing,
    title,
    date,
    imageUrl,
    blocks,
    published,
    updatedAt: now,
  };

  file.publications[idx] = updated;
  writePublicationsFile(file);

  return NextResponse.json({ publication: updated }, { status: 200 });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.res;

  const url = new URL(request.url);
  const id = String(url.searchParams.get("id") || "").trim();
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  const file = readPublicationsFile();
  const before = file.publications.length;
  file.publications = file.publications.filter((p) => p.id !== id);
  if (file.publications.length === before) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  writePublicationsFile(file);
  return NextResponse.json({ ok: true }, { status: 200 });
}
