"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function SatMathResourcesPage() {
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";
  const hasNumericUserPrefix = /^\d+$/.test(firstSegment);
  const userPrefix = hasNumericUserPrefix ? `/${firstSegment}` : "";

  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <h1 className="text-2xl font-semibold">SAT Resources — Math</h1>
            <p className="text-sm text-slate-400">Practice sets and explanations</p>
          </div>
          <Link
            href={`${userPrefix}/resources`}
            className="rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-400 hover:bg-neutral-900 hover:text-white"
          >
            Back to Resources
          </Link>
        </div>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-100">We are collecting for you now :)</div>
            <div className="text-sm text-slate-400">Math materials will appear here.</div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
