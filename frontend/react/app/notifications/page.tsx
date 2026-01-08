"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api";

type Notification = {
  id: string;
  title: string;
  text: string;
  href?: string;
  createdAt?: string;
  unread?: boolean;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api("/api/notifications", { method: "GET" });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `request_failed_${res.status}`);
      }
      const body: any = await res.json().catch(() => null);
      const list = Array.isArray(body?.notifications) ? body.notifications : [];
      setNotifications(list);
    } catch (err: any) {
      setError(String(err?.message ?? err ?? "Failed to load notifications").slice(0, 160));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  function handleMarkAllRead() {
    setLoading(true);
    setError(null);
    api("/api/notifications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || `request_failed_${res.status}`);
        }
        const body: any = await res.json().catch(() => null);
        const list = Array.isArray(body?.notifications) ? body.notifications : [];
        setNotifications(list);
      })
      .catch((err: any) => {
        setError(String(err?.message ?? err ?? "Failed to mark as read").slice(0, 160));
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function handleMarkRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    api("/api/notifications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "mark_read", id }),
    })
      .then(async (res) => {
        if (!res.ok) return;
        const body: any = await res.json().catch(() => null);
        const list = Array.isArray(body?.notifications) ? body.notifications : null;
        if (list) setNotifications(list);
      })
      .catch(() => {
        // ignore
      });
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-neutral-800 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Notifications</h1>
              <p className="text-sm text-slate-400">Latest updates and alerts.</p>
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-neutral-800"
            >
              Mark all as read
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 px-5 py-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
          <div className="space-y-3">
            {loading && notifications.length === 0 ? (
              <div className="text-sm text-slate-400">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="text-sm text-slate-400">You have no notifications yet.</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 rounded-xl border px-3 py-3 text-sm ${
                    n.unread
                      ? "border-neutral-500/80 bg-neutral-950 shadow-[0_0_0_1px_rgba(148,163,184,0.4)]"
                      : "border-neutral-800 bg-neutral-950"
                  }`}
                >
                  <span
                    className={`mt-1 inline-block h-1.5 w-1.5 rounded-full ${
                      n.unread ? "bg-neutral-200" : "bg-neutral-600"
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="font-medium text-slate-100">{n.title}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{n.text}</div>
                    {n.href && (
                      <div className="mt-2">
                        <Link
                          href={n.href}
                          onClick={() => {
                            if (n.unread) handleMarkRead(n.id);
                          }}
                          className="inline-flex items-center rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-neutral-800"
                        >
                          Open
                        </Link>
                      </div>
                    )}
                    {!n.href && n.unread && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => handleMarkRead(n.id)}
                          className="inline-flex items-center rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-neutral-800"
                        >
                          Mark as read
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
