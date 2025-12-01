"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

type Notification = {
  id: number;
  title: string;
  text: string;
  unread?: boolean;
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    title: "Welcome to Edufy!",
    text: "We’re glad you’re here. Explore your dashboard to get started.",
    unread: true,
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [toast, setToast] = useState(false);

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    setToast(true);
    window.setTimeout(() => setToast(false), 2000);
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Notifications</h1>
              <p className="text-sm text-slate-400">Latest updates and alerts.</p>
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
            >
              Mark all as read
            </button>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-sm text-slate-400">You have no notifications yet.</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 rounded-xl border px-3 py-3 text-sm ${
                    n.unread
                      ? "border-cyan-500/50 bg-slate-950 shadow-[0_0_0_1px_rgba(34,211,238,0.35)]"
                      : "border-slate-800 bg-slate-950"
                  }`}
                >
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-cyan-400/80" />
                  <div>
                    <div className="font-medium text-slate-100">{n.title}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{n.text}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {toast && (
          <div className="fixed bottom-6 right-6 rounded-xl border border-emerald-500/70 bg-slate-950 px-4 py-2 text-sm font-medium text-emerald-300 shadow-lg shadow-emerald-500/30">
            All notifications marked as read
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
