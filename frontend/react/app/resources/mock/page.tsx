"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function MockTestsResourcesPage() {
  const [accessFilter, setAccessFilter] = useState<
    "all" | "free" | "plus" | "premium" | "completed"
  >("all");

  return (
    <DashboardShell>
      <div className="max-w-5xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-neutral-800 pb-4">
          <h1 className="text-2xl font-semibold">IELTS MOCK Tests</h1>
          <p className="text-sm text-slate-400">
            Full-length practice tests with realistic timing and section mix.
            Materials are being collected for you.
          </p>
        </div>

        <section className="pt-2">
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-full bg-neutral-900/90 p-1.5 text-sm text-slate-200 shadow-sm">
              {[
                { key: "all", label: "All tests" },
                { key: "free", label: "Free" },
                { key: "plus", label: "Plus" },
                { key: "premium", label: "Premium" },
                { key: "completed", label: "Completed tests" },
              ].map((item) => {
                const isActive = accessFilter === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      setAccessFilter(
                        item.key as
                          | "all"
                          | "free"
                          | "plus"
                          | "premium"
                          | "completed"
                      )
                    }
                    className={`rounded-full px-4 py-1.5 text-sm transition-all duration-300 ease-out ${
                      isActive
                        ? "bg-white text-slate-900 shadow-sm shadow-white/40"
                        : "bg-transparent text-slate-200 hover:bg-neutral-800/80 hover:-translate-y-px"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
