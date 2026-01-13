"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import awlData from "@/lib/awl.json";

const AWL_SUBLISTS = Array.from({ length: 10 }, (_, i) => i + 1);

const DEFAULT_WORDS_BY_SUBLIST = awlData as unknown as Record<string, string[]>;

const WORDS_STORAGE_KEY = "edufy_awl_words_v1";
const LEARNED_STORAGE_KEY = "edufy_awl_learned_v1";

export default function AcademicWordListPage() {
  const [activeSublist, setActiveSublist] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [importText, setImportText] = useState("");
  const [wordsBySublist, setWordsBySublist] = useState<Record<number, string[]>>({});
  const [learnedByWord, setLearnedByWord] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const nextWords: Record<number, string[]> = {};
    for (const [k, v] of Object.entries(DEFAULT_WORDS_BY_SUBLIST)) {
      const n = Number(k);
      if (!Number.isFinite(n)) continue;
      if (!Array.isArray(v)) continue;
      nextWords[n] = v.map((x) => String(x).trim()).filter(Boolean);
    }
    const nextLearned: Record<string, boolean> = {};

    try {
      const rawWords = window.localStorage.getItem(WORDS_STORAGE_KEY);
      if (rawWords) {
        const parsed = JSON.parse(rawWords) as unknown;
        if (parsed && typeof parsed === "object") {
          for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
            const n = Number(k);
            if (!Number.isFinite(n)) continue;
            if (Array.isArray(v)) {
              nextWords[n] = v.map((x) => String(x).trim()).filter(Boolean);
            }
          }
        }
      }
    } catch {
      // ignore
    }

    try {
      const rawLearned = window.localStorage.getItem(LEARNED_STORAGE_KEY);
      if (rawLearned) {
        const parsed = JSON.parse(rawLearned) as unknown;
        if (parsed && typeof parsed === "object") {
          for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
            nextLearned[k] = Boolean(v);
          }
        }
      }
    } catch {
      // ignore
    }

    setWordsBySublist(nextWords);
    setLearnedByWord(nextLearned);
  }, []);

  const allWordsForSublist = useMemo(() => {
    const list = wordsBySublist[activeSublist] ?? [];
    return Array.from(new Set(list.map((w) => w.trim()).filter(Boolean)));
  }, [activeSublist, wordsBySublist]);

  const filteredWords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const base = q ? allWordsForSublist.filter((w) => w.toLowerCase().includes(q)) : allWordsForSublist;
    return base
      .slice()
      .sort((a, b) => a.localeCompare(b))
      .sort((a, b) => {
        const aL = Boolean(learnedByWord[a]);
        const bL = Boolean(learnedByWord[b]);
        return Number(aL) - Number(bL);
      });
  }, [allWordsForSublist, learnedByWord, searchQuery]);

  const totalCount = allWordsForSublist.length;
  const learnedCount = useMemo(() => {
    return allWordsForSublist.reduce((acc, w) => (learnedByWord[w] ? acc + 1 : acc), 0);
  }, [allWordsForSublist, learnedByWord]);

  const persistWords = (next: Record<number, string[]>) => {
    setWordsBySublist(next);
    try {
      window.localStorage.setItem(WORDS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const persistLearned = (next: Record<string, boolean>) => {
    setLearnedByWord(next);
    try {
      window.localStorage.setItem(LEARNED_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const importWords = () => {
    const incoming = importText
      .split(/[\n,;]/g)
      .map((w) => w.trim())
      .filter(Boolean);

    if (!incoming.length) return;

    const current = wordsBySublist[activeSublist] ?? [];
    const merged = Array.from(new Set([...current, ...incoming]));
    persistWords({ ...wordsBySublist, [activeSublist]: merged });
    setImportText("");
  };

  const clearSublist = () => {
    const next = { ...wordsBySublist, [activeSublist]: [] };
    persistWords(next);
  };

  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <h1 className="text-2xl font-semibold">Academic Word List</h1>
            <p className="text-sm text-slate-400">Core academic vocabulary by sublist</p>
          </div>
        </div>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-1 flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Sublist</label>
                  <select
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-slate-100 transition-all duration-200 ease-out hover:border-white/60 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/40"
                    value={activeSublist}
                    onChange={(e) => setActiveSublist(Number(e.target.value))}
                  >
                    {AWL_SUBLISTS.map((n) => (
                      <option key={n} value={n}>
                        Sublist {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Search</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 transition-all duration-200 ease-out hover:border-white/60 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/40"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs font-medium text-slate-300">
                {learnedCount}/{totalCount} learned
              </div>
              <button
                type="button"
                onClick={clearSublist}
                className="rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-400 hover:bg-neutral-900 hover:text-white"
              >
                Clear sublist
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
              <div className="text-sm font-semibold text-slate-100">Words</div>
              <div className="mt-1 text-sm text-slate-400">
                Click a word to mark it as learned.
              </div>

              <div className="mt-4 max-h-[520px] overflow-auto rounded-xl border border-neutral-800">
                {filteredWords.length ? (
                  <div className="divide-y divide-neutral-900">
                    {filteredWords.map((w) => {
                      const isLearned = Boolean(learnedByWord[w]);
                      return (
                        <button
                          key={w}
                          type="button"
                          onClick={() => {
                            persistLearned({ ...learnedByWord, [w]: !isLearned });
                          }}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-900"
                        >
                          <span className={`font-medium ${isLearned ? "text-slate-500 line-through" : "text-slate-100"}`}>
                            {w}
                          </span>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                              isLearned
                                ? "border-emerald-900/60 bg-emerald-950/30 text-emerald-200"
                                : "border-neutral-800 bg-neutral-950 text-slate-300"
                            }`}
                          >
                            {isLearned ? "Learned" : "Not learned"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-sm text-slate-400">
                    No words yet for this sublist. Use Import to add your list.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
              <div className="text-sm font-semibold text-slate-100">Import words</div>
              <div className="mt-1 text-sm text-slate-400">
                Paste words separated by new lines, commas, or semicolons.
              </div>

              <textarea
                className="mt-4 h-44 w-full resize-none rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 transition-all duration-200 ease-out hover:border-white/60 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/40"
                placeholder={`e.g. analyse\napproach\nassess`}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={importWords}
                  className="rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-400 hover:bg-neutral-900 hover:text-white"
                >
                  Import to Sublist {activeSublist}
                </button>
                <button
                  type="button"
                  onClick={() => setImportText("")}
                  className="rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-400 hover:bg-neutral-900 hover:text-white"
                >
                  Clear input
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
