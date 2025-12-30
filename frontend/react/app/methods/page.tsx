"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePageTitle } from "../lib/usePageTitle";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

const METHODS = [
  {
    key: "sq3r",
    title: "SQ3R",
    desc: "Survey · Question · Read · Recite · Review — turn reading into active learning.",
  },
  {
    key: "pomodoro",
    title: "Pomodoro",
    desc: "Timed focus sessions that keep momentum without burnout.",
  },
  {
    key: "feynman",
    title: "Feynman Technique",
    desc: "Explain it simply, find gaps, repeat until it becomes clear.",
  },
  {
    key: "active-recall",
    title: "Active Recall",
    desc: "Learn by testing yourself — not by re-reading.",
  },
  {
    key: "mind-mapping",
    title: "Mind Mapping",
    desc: "Visual structure for ideas: concepts, links, examples.",
  },
  {
    key: "leitner",
    title: "Leitner System",
    desc: "Spaced flashcards with boxes: hard cards more often, easy cards less.",
  },
  {
    key: "kaizen",
    title: "Kaizen",
    desc: "Small daily improvements that compound into big results.",
  },
  {
    key: "spaced-repetition",
    title: "Spaced Repetition",
    desc: "Review right before you forget to build long-term memory.",
  },
] as const;

export default function StudyMethodsIndexPage() {
  usePageTitle("Edufy – Study Methods");
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";
  const hasNumericUserPrefix = /^\d+$/.test(firstSegment);
  const userPrefix = hasNumericUserPrefix ? `/${firstSegment}` : "";

  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-neutral-800 pb-4">
          <h1 className="text-2xl font-semibold">Study Methods</h1>
          <p className="text-sm text-slate-400">
            Pick a method, learn the steps, and try a ready-to-use template.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {METHODS.map((m) => (
            <Link
              key={m.key}
              href={`${userPrefix}/methods/${m.key}`}
              className="group rounded-2xl border border-neutral-800 bg-black p-5 transition-colors hover:border-slate-400 hover:bg-neutral-900"
            >
              <div className="text-sm font-semibold text-slate-100">{m.title}</div>
              <div className="mt-2 text-xs leading-relaxed text-slate-400">{m.desc}</div>
              <div className="mt-4 inline-flex items-center text-xs font-medium text-slate-300 group-hover:text-white">
                Open
                <span className="ml-1 text-[10px]">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
