"use client";

import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function SatEnglishResourcesPage() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <h1 className="text-2xl font-semibold">SAT Resources — English</h1>
            <p className="text-sm text-slate-400">Reading & writing practice and tips</p>
          </div>
        </div>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-100">We are collecting for you now :)</div>
            <div className="text-sm text-slate-400">English materials will appear here.</div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
