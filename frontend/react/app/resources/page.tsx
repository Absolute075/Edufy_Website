"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function ResourcesPage() {
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";
  const hasNumericUserPrefix = /^\d+$/.test(firstSegment);
  const userPrefix = hasNumericUserPrefix ? `/${firstSegment}` : "";
  const baseResourcesPath = `${userPrefix}/resources`;
  const readingHref = `${baseResourcesPath}/reading`;
  const listeningHref = `${baseResourcesPath}/listening`;
  const writingHref = `${baseResourcesPath}/writing`;
  const mockHref = `${baseResourcesPath}/mock`;
  const articlesHref = `${baseResourcesPath}/articles`;
  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-neutral-800 pb-4">
          <h1 className="text-2xl font-semibold">Resources</h1>
          <p className="text-sm text-slate-400">
            IELTS sections and vocabulary materials collected for you.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 md:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">IELTS Resources</h2>
                <p className="text-sm text-slate-400">Reading · Listening · Writing · MOCK</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                href={readingHref}
                className="group flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-left min-h-[140px] transition-colors duration-150 hover:border-slate-400 hover:bg-neutral-900"
              >
                <div>
                  <div className="text-sm font-medium text-slate-100">Reading</div>
                  <div className="mt-1 text-xs text-slate-400">
                    Passages, question types, and practice sets
                  </div>
                </div>
                <span className="mt-3 inline-flex items-center text-xs font-medium text-slate-300 group-hover:text-white">
                  Open
                  <span className="ml-1 text-[10px]">→</span>
                </span>
              </Link>
              <Link
                href={listeningHref}
                className="group flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-left min-h-[140px] transition-colors duration-150 hover:border-slate-400 hover:bg-neutral-900"
              >
                <div>
                  <div className="text-sm font-medium text-slate-100">Listening</div>
                  <div className="mt-1 text-xs text-slate-400">
                    Audio practice, note-taking, and tips
                  </div>
                </div>
                <span className="mt-3 inline-flex items-center text-xs font-medium text-slate-300 group-hover:text-white">
                  Open
                  <span className="ml-1 text-[10px]">→</span>
                </span>
              </Link>
              <Link
                href={writingHref}
                className="group flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-left min-h-[140px] transition-colors duration-150 hover:border-slate-400 hover:bg-neutral-900"
              >
                <div>
                  <div className="text-sm font-medium text-slate-100">Writing</div>
                  <div className="mt-1 text-xs text-slate-400">
                    Task 1 &amp; Task 2 samples, structure, and scoring
                  </div>
                </div>
                <span className="mt-3 inline-flex items-center text-xs font-medium text-slate-300 group-hover:text-white">
                  Open
                  <span className="ml-1 text-[10px]">→</span>
                </span>
              </Link>
              <Link
                href={mockHref}
                className="group flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-left min-h-[140px] transition-colors duration-150 hover:border-slate-400 hover:bg-neutral-900"
              >
                <div>
                  <div className="text-sm font-medium text-slate-100">MOCK</div>
                  <div className="mt-1 text-xs text-slate-400">
                    Full-length practice tests with timing
                  </div>
                </div>
                <span className="mt-3 inline-flex items-center text-xs font-medium text-slate-300 group-hover:text-white">
                  Open
                  <span className="ml-1 text-[10px]">→</span>
                </span>
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 md:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Vocabulary</h2>
                <p className="text-sm text-slate-400">Word lists · Topics · Practice</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 min-h-[140px]">
                <div>
                  <div className="text-sm font-medium text-slate-100">Academic Word List</div>
                  <div className="text-xs text-slate-400">Core academic vocabulary by sublist</div>
                </div>
                <button
                  type="button"
                  className="cursor-default inline-flex items-center self-start rounded-full border border-slate-700 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400"
                >
                  We are collecting for you now :)
                </button>
              </div>
              <Link
                href={articlesHref}
                className="group flex flex-col justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 min-h-[140px] transition-colors duration-150 hover:border-slate-400 hover:bg-neutral-900"
              >
                <div>
                  <div className="text-sm font-medium text-slate-100">Articles &amp; Magazines</div>
                  <div className="text-xs text-slate-400">
                    Education · Environment · Technology · Health
                  </div>
                </div>
                <span className="mt-1 inline-flex items-center text-xs font-medium text-slate-300 group-hover:text-white">
                  Open
                  <span className="ml-1 text-[10px]">→</span>
                </span>
              </Link>
              <div className="flex flex-col justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 min-h-[140px]">
                <div>
                  <div className="text-sm font-medium text-slate-100">Phrasal Verbs &amp; Collocations</div>
                  <div className="text-xs text-slate-400">Common combinations to boost fluency</div>
                </div>
                <button
                  type="button"
                  className="cursor-default inline-flex items-center self-start rounded-full border border-slate-700 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400"
                >
                  We are collecting for you now :)
                </button>
              </div>
              <div className="flex flex-col justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 min-h-[140px]">
                <div>
                  <div className="text-sm font-medium text-slate-100">Practice &amp; Quizzes</div>
                  <div className="text-xs text-slate-400">Spaced repetition and quick checks</div>
                </div>
                <button
                  type="button"
                  className="cursor-default inline-flex items-center self-start rounded-full border border-slate-700 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400"
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
