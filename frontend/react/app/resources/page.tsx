"use client";

import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function ResourcesPage() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-semibold">Resources</h1>
          <p className="text-sm text-slate-400">
            IELTS sections and vocabulary materials collected for you.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">IELTS Resources</h2>
                <p className="text-sm text-slate-400">Reading · Listening · Writing · MOCK</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950 px-3 py-3">
                <div>
                  <div className="text-sm font-medium text-slate-100">Reading</div>
                  <div className="text-xs text-slate-400">
                    Passages, question types, and practice sets
                  </div>
                </div>
                <Link
                  href="/resources/reading"
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-900"
                >
                  Open
                </Link>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950 px-3 py-3">
                <div>
                  <div className="text-sm font-medium text-slate-100">Listening</div>
                  <div className="text-xs text-slate-400">Audio practice, note-taking, and tips</div>
                </div>
                <button
                  type="button"
                  className="cursor-default rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400"
                >
                  We are collecting for you now :)
                </button>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950 px-3 py-3">
                <div>
                  <div className="text-sm font-medium text-slate-100">Writing</div>
                  <div className="text-xs text-slate-400">
                    Task 1 &amp; Task 2 samples, structure, and scoring
                  </div>
                </div>
                <button
                  type="button"
                  className="cursor-default rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400"
                >
                  We are collecting for you now :)
                </button>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950 px-3 py-3">
                <div>
                  <div className="text-sm font-medium text-slate-100">MOCK</div>
                  <div className="text-xs text-slate-400">Full-length practice tests with timing</div>
                </div>
                <button
                  type="button"
                  className="cursor-default rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400"
                >
                  We are collecting for you now :)
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Vocabulary</h2>
                <p className="text-sm text-slate-400">Word lists · Topics · Practice</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950 px-3 py-3">
                <div>
                  <div className="text-sm font-medium text-slate-100">Academic Word List</div>
                  <div className="text-xs text-slate-400">Core academic vocabulary by sublist</div>
                </div>
                <button
                  type="button"
                  className="cursor-default rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400"
                >
                  We are collecting for you now :)
                </button>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950 px-3 py-3">
                <div>
                  <div className="text-sm font-medium text-slate-100">Topic-Based Sets</div>
                  <div className="text-xs text-slate-400">
                    Education · Environment · Technology · Health
                  </div>
                </div>
                <button
                  type="button"
                  className="cursor-default rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400"
                >
                  We are collecting for you now :)
                </button>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950 px-3 py-3">
                <div>
                  <div className="text-sm font-medium text-slate-100">Phrasal Verbs &amp; Collocations</div>
                  <div className="text-xs text-slate-400">Common combinations to boost fluency</div>
                </div>
                <button
                  type="button"
                  className="cursor-default rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400"
                >
                  We are collecting for you now :)
                </button>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950 px-3 py-3">
                <div>
                  <div className="text-sm font-medium text-slate-100">Practice &amp; Quizzes</div>
                  <div className="text-xs text-slate-400">Spaced repetition and quick checks</div>
                </div>
                <button
                  type="button"
                  className="cursor-default rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400"
                >
                  We are collecting for you now :)
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
