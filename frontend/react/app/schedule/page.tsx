"use client";

import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function SchedulePage() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-neutral-800 pb-4">
          <h1 className="text-2xl font-semibold">Schedule</h1>
          <p className="text-sm text-slate-400">Your upcoming lessons and study events.</p>
        </div>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Upcoming</h2>
              <p className="text-sm text-slate-400">Your next events</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-sm text-slate-400">No events scheduled yet.</div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
