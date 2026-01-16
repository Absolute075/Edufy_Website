"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { isPlanSufficient } from "@/lib/resourcesRegistry";
import { useUserProfile } from "../../../UserProfileProvider";
import { satVideoResourcesRegistry } from "@/lib/satVideoResourcesRegistry";

export default function SatLessonsReportsResourcesPage() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";
  const hasNumericUserPrefix = /^\d+$/.test(firstSegment);
  const userPrefix = hasNumericUserPrefix ? `/${firstSegment}` : "";

  const { data: profileData } = useUserProfile();
  const userPlan = profileData?.plan ?? "free";

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "math" | "english" | "general">("all");
  const [planFilter, setPlanFilter] = useState<"all" | "free" | "premium">("all");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
  const [openTeacherDropdown, setOpenTeacherDropdown] = useState(false);
  const [teacherMediaTypeFilter, setTeacherMediaTypeFilter] = useState<"all" | "video" | "file">("all");
  const [openTeacherMediaTypeDropdown, setOpenTeacherMediaTypeDropdown] = useState(false);

  const items = useMemo(() => {
    return Object.entries(satVideoResourcesRegistry)
      .map(([id, rule]) => ({ id, ...rule }));
  }, []);

  const teacherOptions = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.teacher && item.teacher.trim()) set.add(item.teacher.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  useEffect(() => {
    if (!openTeacherDropdown && !openTeacherMediaTypeDropdown) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest(".teacher-rounded-dropdown") && !target.closest(".teacher-media-type-rounded-dropdown")) {
        setOpenTeacherDropdown(false);
        setOpenTeacherMediaTypeDropdown(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenTeacherDropdown(false);
        setOpenTeacherMediaTypeDropdown(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openTeacherDropdown, openTeacherMediaTypeDropdown]);

  useEffect(() => {
    if (teacherFilter === "all") {
      setTeacherMediaTypeFilter("all");
      setOpenTeacherMediaTypeDropdown(false);
    }
  }, [teacherFilter]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (q) {
        const hay = `${item.title} ${item.id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (typeFilter !== "all" && item.section !== typeFilter) return false;
      if (planFilter !== "all" && item.requiredPlan !== planFilter) return false;
      if (teacherFilter !== "all" && (item.teacher || "") !== teacherFilter) return false;
      if (teacherFilter !== "all" && teacherMediaTypeFilter !== "all" && item.mediaType !== teacherMediaTypeFilter)
        return false;

      return true;
    });
  }, [items, planFilter, searchQuery, teacherFilter, teacherMediaTypeFilter, typeFilter]);

  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-2 border-b border-neutral-800 pb-4">
          <h1 className="text-2xl font-semibold">SAT Lessons &amp; Reports</h1>
          <p className="text-sm text-slate-400">Video lessons, reports, and explanations.</p>
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
                <label className="mb-1 block text-xs font-medium text-slate-400">Section</label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { key: "math", label: "Math" },
                      { key: "english", label: "English" },
                      { key: "general", label: "General" },
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

              <div className="w-full sm:w-auto">
                <label className="mb-1 block text-xs font-medium text-slate-400">Teacher</label>
                <div className="teacher-rounded-dropdown rounded-dropdown">
                  <button
                    type="button"
                    className="rounded-dropdown-trigger"
                    aria-haspopup="listbox"
                    aria-expanded={openTeacherDropdown}
                    onClick={() => setOpenTeacherDropdown((v) => !v)}
                  >
                    <span className="truncate">
                      {teacherFilter === "all" ? "All" : teacherFilter}
                    </span>
                    <span style={{ color: "#718096", fontSize: 12 }}>▼</span>
                  </button>
                  <div
                    className={`rounded-dropdown-menu${openTeacherDropdown ? " is-open" : ""}`}
                    role="listbox"
                    aria-hidden={!openTeacherDropdown}
                  >
                    <button
                      type="button"
                      className="rounded-dropdown-item"
                      onClick={() => {
                        setTeacherFilter("all");
                        setOpenTeacherDropdown(false);
                      }}
                    >
                      All
                    </button>
                    {teacherOptions.map((teacher) => (
                      <button
                        key={teacher}
                        type="button"
                        className="rounded-dropdown-item"
                        onClick={() => {
                          setTeacherFilter(teacher);
                          setOpenTeacherDropdown(false);
                        }}
                      >
                        {teacher}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {teacherFilter !== "all" ? (
                <div className="w-full sm:w-auto">
                  <label className="mb-1 block text-xs font-medium text-slate-400">Type</label>
                  <div className="teacher-media-type-rounded-dropdown rounded-dropdown">
                    <button
                      type="button"
                      className="rounded-dropdown-trigger"
                      aria-haspopup="listbox"
                      aria-expanded={openTeacherMediaTypeDropdown}
                      onClick={() => setOpenTeacherMediaTypeDropdown((v) => !v)}
                    >
                      <span className="truncate">
                        {teacherMediaTypeFilter === "all"
                          ? "All"
                          : teacherMediaTypeFilter === "video"
                            ? "Videos"
                            : "Files"}
                      </span>
                      <span style={{ color: "#718096", fontSize: 12 }}>▼</span>
                    </button>
                    <div
                      className={`rounded-dropdown-menu${openTeacherMediaTypeDropdown ? " is-open" : ""}`}
                      role="listbox"
                      aria-hidden={!openTeacherMediaTypeDropdown}
                    >
                      <button
                        type="button"
                        className="rounded-dropdown-item"
                        onClick={() => {
                          setTeacherMediaTypeFilter("all");
                          setOpenTeacherMediaTypeDropdown(false);
                        }}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        className="rounded-dropdown-item"
                        onClick={() => {
                          setTeacherMediaTypeFilter("video");
                          setOpenTeacherMediaTypeDropdown(false);
                        }}
                      >
                        Videos
                      </button>
                      <button
                        type="button"
                        className="rounded-dropdown-item"
                        onClick={() => {
                          setTeacherMediaTypeFilter("file");
                          setOpenTeacherMediaTypeDropdown(false);
                        }}
                      >
                        Files
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
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
              const locked = !isPlanSufficient(userPlan, item.requiredPlan);

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border border-neutral-800 bg-neutral-950/80 px-5 py-4 ${
                    locked ? "" : "hover:border-slate-400 hover:bg-neutral-900 transition-colors duration-150"
                  }`}
                >
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
                        {item.teacher ? (
                          <span className="rounded-full border border-neutral-700 px-2.5 py-0.5 text-[11px] text-slate-300">
                            {item.teacher}
                          </span>
                        ) : null}
                        <span className="rounded-full border border-neutral-700 px-2.5 py-0.5 text-[11px] text-slate-300">
                          {item.requiredPlan}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (locked) {
                          router.push(
                            `${userPrefix}/billing?redirect=${encodeURIComponent(
                              `${userPrefix}/resources/sat/lessons-reports/watch?id=${encodeURIComponent(item.id)}`
                            )}`
                          );
                          return;
                        }

                        router.push(
                          `${userPrefix}/resources/sat/lessons-reports/watch?id=${encodeURIComponent(item.id)}`
                        );
                      }}
                      className={`shrink-0 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors md:self-center ${
                        locked
                          ? "border-neutral-700 bg-neutral-950 text-slate-200 hover:border-white/60 hover:bg-neutral-900"
                          : "border-neutral-700 bg-white text-slate-900 hover:bg-white/90"
                      }`}
                    >
                      Continue
                    </button>
                  </div>
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

      <style jsx>{`
        .rounded-dropdown {
          position: relative;
          width: 220px;
          max-width: 100%;
          --panel: #0b0f14;
          --border: rgba(255, 255, 255, 0.1);
          --text: #e6edf3;
          --text-soft: #cbd5e1;
          --hover: rgba(255, 255, 255, 0.06);
          --shadow-menu: 0 16px 40px rgba(0, 0, 0, 0.65);
        }

        .rounded-dropdown-trigger {
          width: 100%;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid var(--border);
          background: var(--panel);
          color: var(--text);
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          transition: border-color 160ms ease, transform 160ms ease;
        }

        .rounded-dropdown-trigger:hover {
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
        }

        .rounded-dropdown-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          width: 100%;
          border-radius: 14px;
          border: 1px solid var(--border);
          background: var(--panel);
          box-shadow: var(--shadow-menu);
          overflow: hidden;
          opacity: 0;
          transform: translateY(6px);
          pointer-events: none;
          transition: opacity 180ms ease, transform 180ms ease;
          z-index: 20;
        }

        .rounded-dropdown-menu.is-open {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        .rounded-dropdown-item {
          width: 100%;
          border: none;
          background: transparent;
          padding: 10px 12px;
          text-align: left;
          color: var(--text-soft);
          font-size: 14px;
        }

        .rounded-dropdown-item:hover {
          background: var(--hover);
        }
      `}</style>
    </DashboardShell>
  );
}
