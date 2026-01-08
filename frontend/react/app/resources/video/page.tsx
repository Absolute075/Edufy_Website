"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { videoResourcesRegistry } from "@/lib/videoResourcesRegistry";

export default function VideoResourcesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "writing" | "listening" | "reading" | "speaking"
  >("all");
  const [planFilter, setPlanFilter] = useState<"all" | "free" | "premium">("all");

  const items = useMemo(() => {
    const planOrder = (plan: (typeof videoResourcesRegistry)[string]["requiredPlan"]) => {
      return plan === "free" ? 0 : 1;
    };

    const sectionOrder = (section: (typeof videoResourcesRegistry)[string]["section"]) => {
      if (section === "writing") return 0;
      if (section === "listening") return 1;
      if (section === "reading") return 2;
      return 3;
    };

    return Object.entries(videoResourcesRegistry)
      .map(([id, rule]) => ({ id, ...rule }))
      .sort((a, b) => {
        const aPlan = planOrder(a.requiredPlan);
        const bPlan = planOrder(b.requiredPlan);
        if (aPlan !== bPlan) return aPlan - bPlan;

        const aSection = sectionOrder(a.section);
        const bSection = sectionOrder(b.section);
        if (aSection !== bSection) return aSection - bSection;

        return a.title.localeCompare(b.title);
      });
  }, []);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (q) {
        const hay = `${item.title} ${item.id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (typeFilter !== "all" && item.section !== typeFilter) return false;
      if (planFilter !== "all" && item.requiredPlan !== planFilter) return false;

      return true;
    });
  }, [items, planFilter, searchQuery, typeFilter]);

  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-neutral-800 pb-4">
          <h1 className="text-2xl font-semibold">Video lessons</h1>
          <p className="text-sm text-slate-400">
            Reports &amp; explanations. Materials are being collected for you.
          </p>
        </div>

        <section className="pt-2">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-slate-400">Search</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 transition-all duration-200 ease-out hover:border-white/60 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/40"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="w-full sm:w-auto">
                <label className="mb-1 block text-xs font-medium text-slate-400">Type</label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { key: "writing", label: "Writing" },
                      { key: "listening", label: "Listening" },
                      { key: "reading", label: "Reading" },
                      { key: "speaking", label: "Speaking" },
                    ] as const
                  ).map((item) => {
                    const isActive = typeFilter === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setTypeFilter((prev) => (prev === item.key ? "all" : item.key))}
                        className={`rounded-full border px-4 py-2 text-sm transition-colors duration-150 ${
                          isActive
                            ? "border-white/70 bg-white text-slate-900"
                            : "border-neutral-800 bg-neutral-950 text-slate-200 hover:border-white/60"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-full bg-neutral-900/90 p-1.5 text-sm text-slate-200 shadow-sm">
                {(
                  [
                    { key: "all", label: "All" },
                    { key: "free", label: "Free" },
                    { key: "premium", label: "Premium" },
                  ] as const
                ).map((item) => {
                  const isActive = planFilter === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setPlanFilter(item.key)}
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
          </div>

          <div className="mt-6 space-y-3">
            {filteredItems.map((item) => {
              const content = (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold text-slate-100">{item.title}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-neutral-700 px-2.5 py-0.5 text-[11px] text-slate-300">
                          {item.section}
                        </span>
                        <span className="rounded-full border border-neutral-700 px-2.5 py-0.5 text-[11px] text-slate-300">
                          {item.mediaType}
                        </span>
                        <span className="rounded-full border border-neutral-700 px-2.5 py-0.5 text-[11px] text-slate-300">
                          {item.requiredPlan}
                        </span>
                      </div>
                    </div>

                    {!item.href && (
                      <span className="shrink-0 rounded-full border border-slate-700 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Soon
                      </span>
                    )}
                  </div>
              );

              if (item.href) {
                const isExternal = /^https?:\/\//i.test(item.href);

                if (isExternal) {
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-2xl border border-neutral-800 bg-neutral-950/80 px-5 py-4 transition-colors duration-150 hover:border-slate-400 hover:bg-neutral-900"
                    >
                      {content}
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="block rounded-2xl border border-neutral-800 bg-neutral-950/80 px-5 py-4 transition-colors duration-150 hover:border-slate-400 hover:bg-neutral-900"
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950/80 px-5 py-4"
                >
                  {content}
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 px-5 py-6 text-sm text-slate-400">
                No materials found.
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
