"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  changelogEntries,
  changelogLabels,
  type ChangelogEntry,
  type ChangelogLabel,
} from "@/lib/changelogRegistry";

type LabelFilter = "All" | ChangelogLabel;

function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function matchesQuery(entry: ChangelogEntry, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();

  const hay = [
    entry.title,
    entry.summary || "",
    entry.labels.join(" "),
    entry.sections.map((s) => `${s.title} ${s.items.join(" ")}`).join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return hay.includes(q);
}

export default function ChangelogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLabel, setActiveLabel] = useState<LabelFilter>("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim();

    return changelogEntries.filter((entry) => {
      const matchesLabel = activeLabel === "All" || entry.labels.includes(activeLabel);
      const matchesSearch = matchesQuery(entry, q);
      return matchesLabel && matchesSearch;
    });
  }, [activeLabel, searchQuery]);

  return (
    <main className="min-h-screen text-white legal-page-main">
      <div className="flex min-h-screen">
        <aside className="hidden md:flex w-72 lg:w-80 xl:w-96 border-r border-white/10 bg-white/5 px-5 sm:px-6 py-8 space-y-5 flex-col">
          <div className="mb-2">
            <Link href="/">
              <span className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
                <span className="text-base">&larr;</span>
                <span className="uppercase tracking-[0.2em]">Back</span>
              </span>
            </Link>
          </div>

          <div>
            <h2 className="text-xs sm:text-xl font-semibold uppercase tracking-[0.25em] text-gray-300">
              Filter
            </h2>
          </div>

          <div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search updates..."
              className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40"
            />
          </div>

          <div className="pt-1 flex flex-wrap gap-2">
            {["All" as const, ...changelogLabels].map((label) => {
              const isActive = activeLabel === label;
              const text = label === "All" ? "All" : label;

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setActiveLabel(label)}
                  className={`px-3 py-1.5 rounded-full text-[0.65rem] sm:text-xs uppercase tracking-[0.22em] border transition-colors ${
                    isActive
                      ? "bg-white text-black border-white"
                      : "bg-black/40 text-gray-300 border-white/20 hover:border-white/60"
                  }`}
                >
                  {label === "All" ? "All" : text}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-white/10 space-y-2 text-xs text-gray-400">
            <p className="uppercase tracking-[0.22em] text-[11px] text-gray-500">Links</p>
            <Link href="/blog" className="block hover:text-white transition-colors">
              Blog
            </Link>
          </div>
        </aside>

        <div className="flex-1">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 py-20">
            <header className="mb-10 legal-hero-block">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bebas tracking-[0.35em] uppercase text-white mb-4 text-left">
                <span className="mr-3">Edufy</span>
                <span>Changelog</span>
              </h1>
              <p className="text-gray-300 max-w-2xl text-left">
                Latest updates and changes.
              </p>
            </header>

            <section className="legal-content-block space-y-4">
              {filteredEntries.length === 0 ? (
                <p className="text-sm text-gray-400">No updates match your filters yet.</p>
              ) : (
                filteredEntries.map((entry) => {
                  const expanded = openId === entry.id;

                  return (
                    <article
                      key={entry.id}
                      className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenId((prev) => (prev === entry.id ? null : entry.id))}
                        className="w-full text-left p-6 sm:p-8 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-6">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              {entry.labels.map((label) => (
                                <span
                                  key={label}
                                  className="px-3 py-1 rounded-full border border-white/15 bg-black/40 text-[11px] uppercase tracking-[0.18em] text-gray-200"
                                >
                                  {label}
                                </span>
                              ))}
                            </div>

                            <h2 className="text-xl sm:text-2xl font-semibold text-white break-words">
                              {entry.title}
                            </h2>
                            {entry.summary ? (
                              <p className="mt-2 text-sm sm:text-base text-gray-300 leading-relaxed">
                                {entry.summary}
                              </p>
                            ) : null}
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="text-xs uppercase tracking-[0.2em] text-gray-400">
                              {formatDate(entry.date)}
                            </div>
                            <div className="mt-2 text-[11px] uppercase tracking-[0.22em] text-white/70">
                              {expanded ? "Hide" : "View"}
                            </div>
                          </div>
                        </div>
                      </button>

                      {expanded ? (
                        <div className="px-6 sm:px-8 pb-8 border-t border-white/10">
                          <div className="pt-6 space-y-6">
                            {entry.sections.map((section) => (
                              <div key={section.title}>
                                <h3 className="text-sm sm:text-base font-semibold uppercase tracking-[0.25em] text-gray-200 mb-3">
                                  {section.title}
                                </h3>
                                <ul className="space-y-2 text-sm sm:text-base text-gray-300 leading-relaxed list-disc list-inside">
                                  {section.items.map((item, idx) => (
                                    <li key={`${section.title}-${idx}`}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
