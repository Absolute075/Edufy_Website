"use client";

import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function MentorPage() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-neutral-800 pb-4">
          <h1 className="text-2xl font-semibold">Mentor AI</h1>
          <p className="text-sm text-slate-400">
            Intelligent guidance and personalised study recommendations will appear here.
          </p>
        </div>

        <section className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
          {/* Mock Mentor AI layout under blur */}
          <div className="relative grid gap-4 md:grid-cols-[220px,1fr]">
            {/* Left: sessions / topics */}
            <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-950/80 p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Sessions
              </div>
              <button className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-left text-xs font-medium text-slate-100">
                IELTS Reading · Week 1
              </button>
              <button className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-left text-xs text-slate-300">
                Writing Task 2 · Ideas
              </button>
              <button className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-left text-xs text-slate-300">
                Vocabulary · Environment
              </button>
            </div>

            {/* Right: chat preview */}
            <div className="flex flex-col rounded-xl border border-neutral-800 bg-neutral-950/80">
              <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-2">
                <div className="flex items-center gap-2 text-sm text-slate-200">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900 text-xs font-semibold text-cyan-300">
                    AI
                  </span>
                  <span>Mentor</span>
                </div>
                <span className="text-xs text-slate-500">Preview</span>
              </div>
              <div className="flex-1 space-y-3 px-4 py-3 text-sm">
                <div className="max-w-[80%] rounded-xl bg-neutral-900 px-3 py-2 text-slate-100">
                  Hi! I can help you plan your IELTS study this week. What would you like to focus on?
                </div>
                <div className="ml-auto max-w-[80%] rounded-xl bg-cyan-500/10 px-3 py-2 text-right text-slate-100">
                  I want to improve my reading speed and accuracy.
                </div>
                <div className="max-w-[80%] rounded-xl bg-neutral-900 px-3 py-2 text-slate-100">
                  Great. I will generate a 7-day reading plan with specific passages and timing goals for you.
                </div>
              </div>
              <div className="border-t border-neutral-800 px-4 py-2">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-neutral-900 px-3 py-1 text-slate-300">
                    Suggest a study plan
                  </span>
                  <span className="rounded-full bg-neutral-900 px-3 py-1 text-slate-300">
                    Analyse my mistakes
                  </span>
                  <span className="rounded-full bg-neutral-900 px-3 py-1 text-slate-300">
                    Explain this concept
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Trailer blur overlay */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <p className="text-3xl font-bold tracking-wide text-white">Coming Soon</p>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
