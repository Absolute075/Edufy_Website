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

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
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
              className="inline-flex items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-neutral-800"
            >
              Mark all as read
            </button>
          </div>
        </div>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
          <div className="space-y-3">
            {notifications.length === 0 ? (
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
                  <span className={`mt-1 inline-block h-1.5 w-1.5 rounded-full ${n.unread ? "bg-neutral-200" : "bg-neutral-600"}`} />
                  <div>
                    <div className="font-medium text-slate-100">{n.title}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{n.text}</div>
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
