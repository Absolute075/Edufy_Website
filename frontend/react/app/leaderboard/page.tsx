"use client";

import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function LeaderboardPage() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-semibold">Leaderboard</h1>
          <p className="text-sm text-slate-400">Global progress tracking is coming soon.</p>
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
          <div className="flex min-h-[180px] items-center justify-center">
            <p className="text-base text-slate-400">Coming soon</p>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
