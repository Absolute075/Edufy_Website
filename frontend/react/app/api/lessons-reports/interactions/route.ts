import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { dirname, join } from "path";
import { mkdir, readFile, rename, writeFile } from "fs/promises";

export const runtime = "nodejs";

type StoredComment = {
  id: string;
  text: string;
  author: string;
  createdAt: string;
};

type MaterialInteractions = {
  likes: Record<string, true>;
  comments: StoredComment[];
};

type InteractionsStore = {
  materials: Record<string, MaterialInteractions>;
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

function getStorePath(): string {
  const fromEnv = process.env.LESSONS_REPORTS_INTERACTIONS_PATH;
  if (fromEnv && String(fromEnv).trim()) return String(fromEnv).trim();

  // On prod the project is usually: /var/www/Edufy_Website/frontend/react
  // and storage is: /var/www/Edufy_Website/storage
  return join(process.cwd(), "..", "..", "storage", "lessons-reports-interactions.json");
}

async function loadStore(filePath: string): Promise<InteractionsStore> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as InteractionsStore;
    if (!parsed || typeof parsed !== "object") return { materials: {} };
    if (!parsed.materials || typeof parsed.materials !== "object") return { materials: {} };
    return { materials: parsed.materials };
  } catch {
    return { materials: {} };
  }
}

async function saveStore(filePath: string, store: InteractionsStore): Promise<void> {
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });

  const tmpPath = `${filePath}.tmp`;
  await writeFile(tmpPath, JSON.stringify(store, null, 2), "utf8");
  await rename(tmpPath, filePath);
}

function getMaterial(store: InteractionsStore, materialId: string): MaterialInteractions {
  const existing = store.materials[materialId];
  if (existing && typeof existing === "object") {
    return {
      likes: existing.likes && typeof existing.likes === "object" ? existing.likes : {},
      comments: Array.isArray(existing.comments) ? existing.comments : [],
    };
  }
  return { likes: {}, comments: [] };
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

async function getUserIdentity(request: Request): Promise<{ userKey: string; author: string }> {
  const cookieHeader = request.headers.get("cookie") || "";
  if (!cookieHeader) {
    throw new Error("unauthorized");
  }

  // Your auth_service /auth/me reads token from cookies, not Authorization.
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

  const userKey = String(id ?? username ?? email ?? "").trim();
  const author = String(username ?? email ?? "User").trim() || "User";

  if (!userKey) {
    throw new Error("unauthorized");
  }

  return { userKey, author };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const materialId = (url.searchParams.get("id") || "").trim();

  if (!materialId) {
    return json({ error: "missing_id" }, 400);
  }

  const filePath = getStorePath();
  const store = await loadStore(filePath);
  const material = getMaterial(store, materialId);

  const likesCount = Object.keys(material.likes || {}).length;
  let likedByMe = false;
  try {
    const identity = await getUserIdentity(request);
    likedByMe = Boolean(material.likes && material.likes[identity.userKey]);
  } catch {
    // Public read: allow seeing counts/comments without being logged in.
    likedByMe = false;
  }

  return json({
    id: materialId,
    likesCount,
    likedByMe,
    comments: material.comments || [],
  });
}

export async function POST(request: Request) {
  let identity: { userKey: string; author: string };
  try {
    identity = await getUserIdentity(request);
  } catch {
    return json({ error: "unauthorized" }, 401);
  }

  const payload: any = await request.json().catch(() => null);
  const materialId = String(payload?.id ?? "").trim();
  const action = String(payload?.action ?? "").trim();

  if (!materialId) {
    return json({ error: "missing_id" }, 400);
  }

  if (action !== "toggle_like" && action !== "add_comment") {
    return json({ error: "invalid_action" }, 400);
  }

  const filePath = getStorePath();
  const store = await loadStore(filePath);
  const material = getMaterial(store, materialId);

  if (action === "toggle_like") {
    if (material.likes && material.likes[identity.userKey]) {
      delete material.likes[identity.userKey];
    } else {
      material.likes[identity.userKey] = true;
    }
  }

  if (action === "add_comment") {
    const text = String(payload?.text ?? "").trim();
    if (!text) {
      return json({ error: "empty_comment" }, 400);
    }

    const comment: StoredComment = {
      id: randomUUID(),
      text: text.slice(0, 2000),
      author: identity.author,
      createdAt: new Date().toISOString(),
    };

    material.comments = [comment, ...(material.comments || [])].slice(0, 200);
  }

  store.materials[materialId] = material;
  await saveStore(filePath, store);

  const likesCount = Object.keys(material.likes || {}).length;
  const likedByMe = Boolean(material.likes && material.likes[identity.userKey]);

  return json({
    id: materialId,
    likesCount,
    likedByMe,
    comments: material.comments || [],
  });
}
