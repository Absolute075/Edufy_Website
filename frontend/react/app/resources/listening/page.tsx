"use client";

import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function ListeningResourcesPage() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-neutral-800 pb-4">
          <h1 className="text-2xl font-semibold">IELTS Listening Resources</h1>
          <p className="text-sm text-slate-400">
            Audio practice, note-taking strategies, and test-style recordings. Materials are being collected for you.
          </p>
        </div>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
          <h2 className="text-lg font-semibold">Listening catalog</h2>
          <p className="mt-2 text-sm text-slate-400">
            The full interactive listening catalog from Edufy will appear here. For now, new content is being prepared.
          </p>
          <div className="mt-4 grid gap-3 text-sm text-slate-300">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3">
              <div className="font-medium">Practice recordings</div>
              <div className="text-xs text-slate-400">
                Section 1–4 style recordings with questions and explanations.
              </div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3">
              <div className="font-medium">Skills &amp; strategies</div>
              <div className="text-xs text-slate-400">
                Focused tasks for note-taking, prediction and recognising distractors.
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
