"use client";

import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function ReadingResourcesPage() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-semibold">IELTS Reading Resources</h1>
          <p className="text-sm text-slate-400">
            Curated passages and practice sets. More materials are being collected for you.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
          <h2 className="text-lg font-semibold">Reading catalog</h2>
          <p className="mt-2 text-sm text-slate-400">
            The full interactive reading catalog from the legacy dashboard will be migrated here. For now,
            reading materials are still being prepared.
          </p>
          <div className="mt-4 grid gap-3 text-sm text-slate-300">
            <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <div className="font-medium">Exam-style passages</div>
              <div className="text-xs text-slate-400">
                Practice with authentic-style texts, question types and explanations.
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <div className="font-medium">Skill-focused sets</div>
              <div className="text-xs text-slate-400">
                Tasks grouped by skills: skimming, scanning, detail, inference and more.
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <div className="font-medium">Progress tracking</div>
              <div className="text-xs text-slate-400">
                Your activity will appear in the dashboard Recent Activities section.
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
