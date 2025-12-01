"use client";

import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function MentorPage() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-semibold">Mentor AI</h1>
          <p className="text-sm text-slate-400">Intelligent guidance is coming soon.</p>
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-cyan-400">
              <span className="text-lg">AI</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Mentor AI</h2>
              <p className="text-sm text-slate-400">
                Personalised study recommendations, feedback and analytics will appear here.
              </p>
            </div>
          </div>
          <div className="flex min-h-[180px] items-center justify-center">
            <p className="text-base text-slate-400">Coming soon</p>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
