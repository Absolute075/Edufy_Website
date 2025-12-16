"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function WritingResourcesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"real">("real");
  const [partFilter, setPartFilter] = useState<"all" | "1" | "2">("all");
  const [accessFilter, setAccessFilter] = useState<
    "all" | "free" | "plus" | "premium" | "completed"
  >("all");
  const [typeOpen, setTypeOpen] = useState(false);
  const [partOpen, setPartOpen] = useState(false);

  return (
    <DashboardShell>
      <div className="max-w-5xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-neutral-800 pb-4">
          <h1 className="text-2xl font-semibold">IELTS Writing</h1>
          <p className="text-sm text-slate-400">
            Task 1 &amp; Task 2 samples, structures, and scoring guidance.
            Materials are being collected for you.
          </p>
        </div>

        <section className="pt-2">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-slate-400">
                    Search
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 transition-all duration-200 ease-out hover:border-white/60 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/40"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="w-full sm:w-40">
                  <label className="mb-1 block text-xs font-medium text-slate-400">
                    Type
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setTypeOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-2xl border border-neutral-700 bg-neutral-950/90 px-3 py-2.5 text-sm text-slate-100 shadow-sm transition-all duration-200 ease-out hover:border-white/60 focus:outline-none focus:ring-1 focus:ring-white/40 focus:border-white"
                    >
                      <span>Real Exam</span>
                      <span className="ml-2 text-xs text-slate-500">▼</span>
                    </button>
                    {typeOpen && (
                      <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl bg-neutral-950/95 shadow-lg">
                        {[
                          { value: "real", label: "Real Exam" },
                        ].map((opt) => {
                          const isActive = typeFilter === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setTypeFilter(opt.value as "real");
                                setTypeOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                                isActive
                                  ? "bg-white/10 text-slate-50"
                                  : "text-slate-200 hover:bg-neutral-800/80"
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full sm:w-40">
                  <label className="mb-1 block text-xs font-medium text-slate-400">
                    Parts
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setPartOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-2xl border border-neutral-700 bg-neutral-950/90 px-3 py-2.5 text-sm text-slate-100 shadow-sm transition-all duration-200 ease-out hover:border-white/60 focus:outline-none focus:ring-1 focus:ring-white/40 focus:border-white"
                    >
                      <span>
                        {partFilter === "all"
                          ? "All tasks"
                          : partFilter === "1"
                          ? "Task 1"
                          : "Task 2"}
                      </span>
                      <span className="ml-2 text-xs text-slate-500">▼</span>
                    </button>
                    {partOpen && (
                      <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl bg-neutral-950/95 shadow-lg">
                        {[
                          { value: "all", label: "All tasks" },
                          { value: "1", label: "Task 1" },
                          { value: "2", label: "Task 2" },
                        ].map((opt) => {
                          const isActive = partFilter === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setPartFilter(
                                  opt.value as "all" | "1" | "2"
                                );
                                setPartOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                                isActive
                                  ? "bg-white/10 text-slate-50"
                                  : "text-slate-200 hover:bg-neutral-800/80"
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

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
