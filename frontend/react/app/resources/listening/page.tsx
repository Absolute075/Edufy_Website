"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { clearTestCompleted, getCompletedTestIds } from "@/lib/completedTests";
import { resourcesRegistry } from "@/lib/resourcesRegistry";

export default function ListeningResourcesPage() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";
  const hasNumericUserPrefix = /^\d+$/.test(firstSegment);
  const userPrefix = hasNumericUserPrefix ? `/${firstSegment}` : "";

  const [completedIds, setCompletedIds] = useState<Set<string>>(() => new Set());

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "real" | "cambridge">("all");
  const [partFilter, setPartFilter] = useState<
    "all" | "full" | "1" | "2" | "3" | "4"
  >("all");
  const [accessFilter, setAccessFilter] = useState<
    "all" | "free" | "premium" | "completed"
  >("all");
  const [typeOpen, setTypeOpen] = useState(false);
  const [partOpen, setPartOpen] = useState(false);

  useEffect(() => {
    const sync = () => setCompletedIds(new Set(getCompletedTestIds("listening")));
    sync();

    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    const onVisibility = () => {
      if (!document.hidden) sync();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const items = useMemo(() => {
    const partOrder = (part: (typeof resourcesRegistry.listening)[string]["part"]) => {
      return part === "full" ? 5 : part;
    };

    return Object.entries(resourcesRegistry.listening)
      .map(([id, rule]) => ({ id, ...rule }))
      .sort((a, b) => {
        const aOrder = partOrder(a.part);
        const bOrder = partOrder(b.part);
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.title.localeCompare(b.title);
      });
  }, []);

  const isFullListening = (item: (typeof items)[number]) => {
    return item.part === "full" || (item.part === 4 && item.questions === 40 && item.minutes === 30);
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      const isCompleted = completedIds.has(item.id);

      if (q) {
        const hay = `${item.title} ${item.id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (typeFilter !== "all" && item.examType !== typeFilter) return false;

      if (partFilter !== "all") {
        if (partFilter === "full") {
          if (!isFullListening(item)) return false;
        } else {
          if (String(item.part) !== partFilter) return false;
        }
      }

      if (accessFilter === "completed") {
        if (!isCompleted) return false;
      } else {
        if (accessFilter !== "all" && item.requiredPlan !== accessFilter) return false;
      }

      return true;
    });
  }, [accessFilter, completedIds, items, partFilter, searchQuery, typeFilter]);

  function renderDifficulty(itemDifficulty: "easy" | "medium" | "hard") {
    const activeCount = itemDifficulty === "easy" ? 1 : itemDifficulty === "medium" ? 2 : 3;
    const isEasy = activeCount >= 1;
    const isMedium = activeCount >= 2;
    const isHard = activeCount >= 3;

    const label = itemDifficulty.toUpperCase();
    const activeBg =
      itemDifficulty === "easy"
        ? "bg-emerald-500"
        : itemDifficulty === "medium"
          ? "bg-yellow-400"
          : "bg-red-500";
    const labelColor =
      itemDifficulty === "easy"
        ? "text-emerald-400"
        : itemDifficulty === "medium"
          ? "text-yellow-300"
          : "text-red-400";

    return (
      <div className="inline-flex items-center gap-2">
        <div className="inline-flex items-end gap-1">
          <span className={`w-1.5 rounded-sm ${isEasy ? activeBg : "bg-neutral-700/70"} h-2.5`} />
          <span className={`w-1.5 rounded-sm ${isMedium ? activeBg : "bg-neutral-700/70"} h-4`} />
          <span className={`w-1.5 rounded-sm ${isHard ? activeBg : "bg-neutral-700/70"} h-6`} />
        </div>
        <span className={`text-[11px] font-semibold tracking-wide ${labelColor}`}>{label}</span>
      </div>
    );
  }

  function ClockIcon() {
    return (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400">
        <path
          d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  function QuestionsIcon() {
    return (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400">
        <path
          d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M9.5 9a2.5 2.5 0 1 1 3.8 2.15c-.83.5-1.3 1.03-1.3 1.85v.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <DashboardShell>
      <div className="max-w-5xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-neutral-800 pb-4">
          <h1 className="text-2xl font-semibold">IELTS Listening</h1>
          <p className="text-sm text-slate-400">
            Audio practice, note-taking strategies, and test-style recordings.
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
                      <span>
                        {typeFilter === "all" ? "All" : typeFilter === "real" ? "Real Exam" : "Cambridge"}
                      </span>
                      <span className="ml-2 text-xs text-slate-500">▼</span>
                    </button>
                    {typeOpen && (
                      <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl bg-neutral-950/95 shadow-lg">
                        {[
                          { value: "all", label: "All" },
                          { value: "real", label: "Real Exam" },
                          { value: "cambridge", label: "Cambridge" },
                        ].map((opt) => {
                          const isActive = typeFilter === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setTypeFilter(
                                  opt.value as "all" | "real" | "cambridge"
                                );
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
                    Sections
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setPartOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-2xl border border-neutral-700 bg-neutral-950/90 px-3 py-2.5 text-sm text-slate-100 shadow-sm transition-all duration-200 ease-out hover:border-white/60 focus:outline-none focus:ring-1 focus:ring-white/40 focus:border-white"
                    >
                      <span>
                        {partFilter === "all"
                          ? "All"
                          : partFilter === "full"
                          ? "Full"
                          : partFilter === "1"
                          ? "Section 1"
                          : partFilter === "2"
                          ? "Section 2"
                          : partFilter === "3"
                          ? "Section 3"
                          : "Section 4"}
                      </span>
                      <span className="ml-2 text-xs text-slate-500">▼</span>
                    </button>
                    {partOpen && (
                      <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl bg-neutral-950/95 shadow-lg">
                        {[
                          { value: "all", label: "All" },
                          { value: "full", label: "Full" },
                          { value: "1", label: "Section 1" },
                          { value: "2", label: "Section 2" },
                          { value: "3", label: "Section 3" },
                          { value: "4", label: "Section 4" },
                        ].map((opt) => {
                          const isActive = partFilter === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setPartFilter(
                                  opt.value as
                                    | "all"
                                    | "full"
                                    | "1"
                                    | "2"
                                    | "3"
                                    | "4"
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

          <div className="mt-6 space-y-3">
            {filteredItems.map((item) => {
              const href = `${userPrefix}/resources/listening/${item.id}`;
              const isCompleted = completedIds.has(item.id);
              const isFull = isFullListening(item);
              return (
                <Link
                  key={item.id}
                  href={href}
                  className="block rounded-2xl border border-neutral-800 bg-neutral-950/80 px-5 py-4 transition-colors duration-150 hover:border-slate-400 hover:bg-neutral-900"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold text-slate-100">{item.title}</div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {isFull ? "Full" : `Section ${item.part}`}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        {renderDifficulty(item.difficulty)}
                        <span className="text-slate-600">|</span>
                        <span className="inline-flex items-center gap-2 text-xs text-slate-300">
                          <ClockIcon />
                          {item.minutes} minutes
                        </span>
                        <span className="text-slate-600">|</span>
                        <span className="inline-flex items-center gap-2 text-xs text-slate-300">
                          <QuestionsIcon />
                          {item.questions} questions
                        </span>
                      </div>
                    </div>

                    {accessFilter === "completed" && isCompleted ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          clearTestCompleted("listening", item.id);
                          setCompletedIds((prev) => {
                            const next = new Set(prev);
                            next.delete(item.id);
                            return next;
                          });
                          router.push(href);
                        }}
                        className="mt-1 inline-flex items-center self-start rounded-full border border-neutral-700 bg-neutral-950 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-100 transition-colors hover:border-white/60 hover:bg-neutral-900 md:self-center"
                      >
                        Re-Do test
                      </button>
                    ) : (
                      <div className="mt-1 inline-flex items-center self-start rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-300 md:self-center">
                        {item.requiredPlan}
                      </div>
                    )}
                  </div>
                </Link>
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
