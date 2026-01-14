import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { dirname, join } from "path";
import { mkdir, readFile, rename, writeFile } from "fs/promises";

export const runtime = "nodejs";

 type Catalog = "ielts" | "sat";

type StoredComment = {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  parentId?: string | null;
  authorKey?: string;
};

type StoredNotification = {
  id: string;
  title: string;
  text: string;
  href?: string;
  createdAt: string;
  unread: boolean;
};

type MaterialInteractions = {
  likes: Record<string, true>;
  comments: StoredComment[];
};

type InteractionsStore = {
  materials: Record<string, MaterialInteractions>;
};

type NotificationsStore = {
  users: Record<string, StoredNotification[]>;
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

function normalizeCatalog(input: unknown): Catalog {
  const v = String(input ?? "")
    .trim()
    .toLowerCase();
  return v === "sat" ? "sat" : "ielts";
}

function getStorePath(catalog: Catalog): string {
  const fromEnvKey =
    catalog === "sat"
      ? process.env.LESSONS_REPORTS_INTERACTIONS_PATH_SAT
      : process.env.LESSONS_REPORTS_INTERACTIONS_PATH_IELTS;
  if (fromEnvKey && String(fromEnvKey).trim()) return String(fromEnvKey).trim();

  const fromEnv = process.env.LESSONS_REPORTS_INTERACTIONS_PATH;
  if (fromEnv && String(fromEnv).trim()) return String(fromEnv).trim();

  // On prod the project is usually: /var/www/Edufy_Website/frontend/react
  // and storage is: /var/www/Edufy_Website/storage
  return join(process.cwd(), "..", "..", "storage", `lessons-reports-interactions.${catalog}.json`);
}

function getNotificationsPath(): string {
  const fromEnv = process.env.NOTIFICATIONS_PATH;
  if (fromEnv && String(fromEnv).trim()) return String(fromEnv).trim();

  return join(process.cwd(), "..", "..", "storage", "notifications.json");
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

async function loadNotificationsStore(filePath: string): Promise<NotificationsStore> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as NotificationsStore;
    if (!parsed || typeof parsed !== "object") return { users: {} };
    if (!parsed.users || typeof parsed.users !== "object") return { users: {} };
    return { users: parsed.users };
  } catch {
    return { users: {} };
  }
}

async function saveNotificationsStore(filePath: string, store: NotificationsStore): Promise<void> {
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });

  const tmpPath = `${filePath}.tmp`;
  await writeFile(tmpPath, JSON.stringify(store, null, 2), "utf8");
  await rename(tmpPath, filePath);
}

function toPublicComment(c: StoredComment, viewerUserKey: string | null, viewerIsAdmin: boolean) {
  const isOwner = Boolean(viewerUserKey && c.authorKey && String(c.authorKey).trim() === viewerUserKey);
  const canDelete = Boolean(viewerIsAdmin || isOwner);
  return {
    id: c.id,
    text: c.text,
    author: c.author,
    createdAt: c.createdAt,
    parentId: c.parentId ?? null,
    canDelete,
  };
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

async function getUserIdentity(
  request: Request
): Promise<{ userKey: string; author: string; role: "STUDENT" | "TEACHER" | "ADMIN" | string }> {
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
  const role = body?.role ?? body?.user?.role ?? body?.data?.role ?? "";

  const userKey = String(id ?? username ?? email ?? "").trim();
  const author = String(username ?? email ?? "User").trim() || "User";

  if (!userKey) {
    throw new Error("unauthorized");
  }

  return { userKey, author, role: String(role || "").trim() };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const materialId = (url.searchParams.get("id") || "").trim();
  const catalog = normalizeCatalog(url.searchParams.get("catalog"));

  if (!materialId) {
    return json({ error: "missing_id" }, 400);
  }

  const filePath = getStorePath(catalog);
  const store = await loadStore(filePath);
  const material = getMaterial(store, materialId);

  const likesCount = Object.keys(material.likes || {}).length;
  let likedByMe = false;
  let viewerUserKey: string | null = null;
  let viewerIsAdmin = false;
  try {
    const identity = await getUserIdentity(request);
    viewerUserKey = identity.userKey;
    viewerIsAdmin = String(identity.role).toUpperCase() === "ADMIN";
    likedByMe = Boolean(material.likes && material.likes[identity.userKey]);
  } catch {
    // Public read: allow seeing counts/comments without being logged in.
    likedByMe = false;
  }

  const response: any = {
    id: materialId,
    likesCount,
    likedByMe,
    comments: (material.comments || []).map((c) => toPublicComment(c, viewerUserKey, viewerIsAdmin)),
  };

  if (viewerUserKey) {
    response.viewer = { userKey: viewerUserKey, isAdmin: viewerIsAdmin };
  }

  return json(response);
}

export async function POST(request: Request) {
  let identity: { userKey: string; author: string; role: string };
  try {
    identity = await getUserIdentity(request);
  } catch {
    return json({ error: "unauthorized" }, 401);
  }

  const payload: any = await request.json().catch(() => null);
  const materialId = String(payload?.id ?? "").trim();
  const action = String(payload?.action ?? "").trim();
  const catalog = normalizeCatalog(payload?.catalog);

  if (!materialId) {
    return json({ error: "missing_id" }, 400);
  }

  if (action !== "toggle_like" && action !== "add_comment" && action !== "delete_comment") {
    return json({ error: "invalid_action" }, 400);
  }

  const filePath = getStorePath(catalog);
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

    const parentIdRaw = payload?.parentId;
    const parentId = parentIdRaw === undefined || parentIdRaw === null ? null : String(parentIdRaw).trim();
    if (parentId !== null && !parentId) {
      return json({ error: "invalid_parent" }, 400);
    }

    let repliedToUserKey: string | null = null;
    if (parentId) {
      const parent = (material.comments || []).find((c) => c && c.id === parentId);
      if (!parent) {
        return json({ error: "invalid_parent" }, 400);
      }
      if (parent.authorKey && String(parent.authorKey).trim()) {
        repliedToUserKey = String(parent.authorKey).trim();
      }
    }

    const comment: StoredComment = {
      id: randomUUID(),
      text: text.slice(0, 2000),
      author: identity.author,
      createdAt: new Date().toISOString(),
      parentId,
      authorKey: identity.userKey,
    };

    material.comments = [comment, ...(material.comments || [])].slice(0, 200);

    if (parentId && repliedToUserKey && repliedToUserKey !== identity.userKey) {
      try {
        const nPath = getNotificationsPath();
        const nStore = await loadNotificationsStore(nPath);
        const list = nStore.users[repliedToUserKey] || [];
        const href =
          catalog === "sat"
            ? `/resources/sat/lessons-reports/watch?id=${encodeURIComponent(materialId)}`
            : `/resources/lessons-reports/watch?id=${encodeURIComponent(materialId)}`;
        const notif: StoredNotification = {
          id: randomUUID(),
          title: "Вам ответили",
          text: `Вам ответили в этом видео: ${materialId}`,
          href,
          createdAt: new Date().toISOString(),
          unread: true,
        };
        nStore.users[repliedToUserKey] = [notif, ...list].slice(0, 200);
        await saveNotificationsStore(nPath, nStore);
      } catch {
        // ignore
      }
    }
  }

  if (action === "delete_comment") {
    const commentId = String(payload?.commentId ?? "").trim();
    if (!commentId) {
      return json({ error: "missing_comment_id" }, 400);
    }

    const viewerIsAdmin = String(identity.role).toUpperCase() === "ADMIN";
    const target = (material.comments || []).find((c) => c && c.id === commentId);
    if (!target) {
      return json({ error: "comment_not_found" }, 404);
    }

    const ownerKey = target.authorKey ? String(target.authorKey).trim() : "";
    const isOwner = Boolean(ownerKey && ownerKey === identity.userKey);
    if (!viewerIsAdmin && !isOwner) {
      return json({ error: "forbidden" }, 403);
    }

    const idsToDelete = new Set<string>();
    idsToDelete.add(commentId);
    let changed = true;
    while (changed) {
      changed = false;
      for (const c of material.comments || []) {
        if (!c) continue;
        const pid = c.parentId ? String(c.parentId).trim() : "";
        if (pid && idsToDelete.has(pid) && !idsToDelete.has(c.id)) {
          idsToDelete.add(c.id);
          changed = true;
        }
      }
    }

    material.comments = (material.comments || []).filter((c) => c && !idsToDelete.has(c.id));
  }

  store.materials[materialId] = material;
  await saveStore(filePath, store);

  const likesCount = Object.keys(material.likes || {}).length;
  const likedByMe = Boolean(material.likes && material.likes[identity.userKey]);
  const viewerIsAdmin = String(identity.role).toUpperCase() === "ADMIN";

  return json({
    id: materialId,
    likesCount,
    likedByMe,
    viewer: { userKey: identity.userKey, isAdmin: viewerIsAdmin },
    comments: (material.comments || []).map((c) => toPublicComment(c, identity.userKey, viewerIsAdmin)),
  });
}
