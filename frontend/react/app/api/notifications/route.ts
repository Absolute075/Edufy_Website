import { NextResponse } from "next/server";
import { dirname, join } from "path";
import { mkdir, readFile, rename, writeFile } from "fs/promises";

export const runtime = "nodejs";

type StoredNotification = {
  id: string;
  title: string;
  text: string;
  href?: string;
  createdAt: string;
  unread: boolean;
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

function getNotificationsPath(): string {
  const fromEnv = process.env.NOTIFICATIONS_PATH;
  if (fromEnv && String(fromEnv).trim()) return String(fromEnv).trim();
  return join(process.cwd(), "..", "..", "storage", "notifications.json");
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

async function getUserKey(request: Request): Promise<string> {
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
  const userKey = String(id ?? username ?? email ?? "").trim();
  if (!userKey) {
    throw new Error("unauthorized");
  }
  return userKey;
}

export async function GET(request: Request) {
  let userKey: string;
  try {
    userKey = await getUserKey(request);
  } catch {
    return json({ error: "unauthorized" }, 401);
  }

  const path = getNotificationsPath();
  const store = await loadNotificationsStore(path);
  const list = store.users[userKey] || [];
  return json({ notifications: list });
}

export async function POST(request: Request) {
  let userKey: string;
  try {
    userKey = await getUserKey(request);
  } catch {
    return json({ error: "unauthorized" }, 401);
  }

  const payload: any = await request.json().catch(() => null);
  const action = String(payload?.action ?? "").trim();

  if (action !== "mark_all_read" && action !== "mark_read") {
    return json({ error: "invalid_action" }, 400);
  }

  const path = getNotificationsPath();
  const store = await loadNotificationsStore(path);
  const list = store.users[userKey] || [];

  if (action === "mark_all_read") {
    store.users[userKey] = list.map((n) => ({ ...n, unread: false }));
  }

  if (action === "mark_read") {
    const id = String(payload?.id ?? "").trim();
    if (!id) return json({ error: "missing_id" }, 400);
    store.users[userKey] = list.map((n) => (n.id === id ? { ...n, unread: false } : n));
  }

  await saveNotificationsStore(path, store);
  return json({ notifications: store.users[userKey] || [] });
}
