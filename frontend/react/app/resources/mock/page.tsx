"use client";

import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function MockTestsResourcesPage() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-neutral-800 pb-4">
          <h1 className="text-2xl font-semibold">IELTS MOCK Tests</h1>
          <p className="text-sm text-slate-400">
            Full-length practice tests with realistic timing and section mix. Materials are being collected for you.
          </p>
        </div>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
          <h2 className="text-lg font-semibold">MOCK test center</h2>
          <p className="mt-2 text-sm text-slate-400">
            Here you will be able to take timed full-exam simulations and see your performance summary. For now, new
            tests are being prepared.
          </p>
          <div className="mt-4 grid gap-3 text-sm text-slate-300">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3">
              <div className="font-medium">Exam-style sessions</div>
              <div className="text-xs text-slate-400">
                Complete Listening, Reading and Writing in one go with built-in timers.
              </div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3">
              <div className="font-medium">Performance overview</div>
              <div className="text-xs text-slate-400">
                Track your scores, timing and improvements across mock attempts.
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
