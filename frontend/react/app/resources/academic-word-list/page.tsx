"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import awlData from "@/lib/awl.json";

const AWL_SUBLISTS = Array.from({ length: 10 }, (_, i) => i + 1);

const DEFAULT_WORDS_BY_SUBLIST = awlData as unknown as Record<string, string[]>;

const WORDS_STORAGE_KEY = "edufy_awl_words_v1";
const LEARNED_STORAGE_KEY = "edufy_awl_learned_v1";
const DEFINITIONS_STORAGE_KEY = "edufy_awl_definitions_v1";

export default function AcademicWordListPage() {
  const [activeSublist, setActiveSublist] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [importText, setImportText] = useState("");
  const [wordsBySublist, setWordsBySublist] = useState<Record<number, string[]>>({});
  const [learnedByWord, setLearnedByWord] = useState<Record<string, boolean>>({});
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [definitionLoading, setDefinitionLoading] = useState(false);
  const [definitionError, setDefinitionError] = useState<string | null>(null);
  const [definition, setDefinition] = useState<any | null>(null);

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

  useEffect(() => {
    const w = (selectedWord || "").trim();
    if (!w) {
      setDefinition(null);
      setDefinitionError(null);
      setDefinitionLoading(false);
      return;
    }

    const key = w.toLowerCase();
    const controller = new AbortController();

    setDefinitionLoading(true);
    setDefinitionError(null);

    try {
      const raw = window.localStorage.getItem(DEFINITIONS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as any;
        const cached = parsed?.[key];
        if (cached && typeof cached === "object") {
          setDefinition(cached);
          setDefinitionLoading(false);
          return () => controller.abort();
        }
      }
    } catch {
      // ignore
    }

    (async () => {
      try {
        const res = await fetch(`/api/awl/definition?word=${encodeURIComponent(w)}&t=${Date.now()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const body = await res.json().catch(() => null);
        if (!body || body.ok !== true) {
          setDefinition(body);
          setDefinitionError("No definition found");
          return;
        }

        setDefinition(body);
        try {
          const raw = window.localStorage.getItem(DEFINITIONS_STORAGE_KEY);
          const parsed = raw ? (JSON.parse(raw) as any) : {};
          const next = parsed && typeof parsed === "object" ? parsed : {};
          next[key] = body;
          window.localStorage.setItem(DEFINITIONS_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
      } catch (e: any) {
        if (String(e?.name || "") === "AbortError") return;
        setDefinitionError(String(e?.message || e || "Failed to load definition").slice(0, 200));
        setDefinition(null);
      } finally {
        setDefinitionLoading(false);
      }
    })();

    return () => controller.abort();
  }, [selectedWord]);

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
      <div className="space-y-5">
        <div className="flex flex-col gap-1 border-b border-neutral-800 pb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Academic Word List</h1>
          <p className="text-sm text-slate-400">Core academic vocabulary by sublist</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12 lg:gap-0">
          <aside className="lg:col-span-3 lg:sticky lg:top-20 h-fit lg:pr-6 lg:border-r lg:border-neutral-800">
            <div className="grid gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Sublist</label>
                <select
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-sm text-slate-100 transition-all duration-200 ease-out hover:border-white/60 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/40"
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
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 transition-all duration-200 ease-out hover:border-white/60 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/40"
                  placeholder="Type to filter words..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="rounded-full border border-neutral-800 bg-neutral-950/60 px-3 py-1.5 text-xs font-medium text-slate-300">
                  {learnedCount}/{totalCount} learned
                </div>
                <button
                  type="button"
                  onClick={clearSublist}
                  className="rounded-full border border-neutral-800 bg-neutral-950/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-400 hover:bg-neutral-900 hover:text-white"
                >
                  Clear sublist
                </button>
              </div>

              <div className="mt-2 border-t border-neutral-800 pt-4">
                <div className="text-sm font-semibold text-slate-100">Import</div>
                <div className="mt-1 text-xs text-slate-400">New lines, commas, or semicolons.</div>

                <textarea
                  className="mt-3 h-36 w-full resize-none rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 transition-all duration-200 ease-out hover:border-white/60 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/40"
                  placeholder={`e.g. analyse\napproach\nassess`}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                />

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={importWords}
                    className="rounded-full border border-neutral-800 bg-neutral-950/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-400 hover:bg-neutral-900 hover:text-white"
                  >
                    Import to Sublist {activeSublist}
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportText("")}
                    className="rounded-full border border-neutral-800 bg-neutral-950/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-400 hover:bg-neutral-900 hover:text-white"
                  >
                    Clear input
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <section className="lg:col-span-5 lg:px-6 lg:border-r lg:border-neutral-800">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-100">Words</div>
                <div className="mt-1 text-xs text-slate-400">Click a word to toggle learned + open explanation.</div>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-800">
              <div className="max-h-[calc(100vh-220px)] overflow-auto">
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
                            setSelectedWord(w);
                          }}
                          className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-neutral-900/70 ${
                            selectedWord === w ? "bg-neutral-900/60" : ""
                          }`}
                        >
                          <span className={`font-medium ${isLearned ? "text-slate-500 line-through" : "text-slate-100"}`}>
                            {w}
                          </span>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                              isLearned
                                ? "border-emerald-900/60 bg-emerald-950/30 text-emerald-200"
                                : "border-neutral-800 bg-neutral-950/60 text-slate-300"
                            }`}
                          >
                            {isLearned ? "Learned" : "Not learned"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-sm text-slate-400">No words yet for this sublist. Use Import to add your list.</div>
                )}
              </div>
            </div>
          </section>

          <aside className="lg:col-span-4 lg:sticky lg:top-20 h-fit lg:pl-6">
            <div>
              <div className="text-sm font-semibold text-slate-100">Explanation</div>
              <div className="mt-1 text-xs text-slate-400">Select a word to see its meaning.</div>

              <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-950/50 p-4">
                {!selectedWord ? (
                  <div className="text-sm text-slate-400">No word selected.</div>
                ) : definitionLoading ? (
                  <div className="text-sm text-slate-400">Loading...</div>
                ) : definitionError ? (
                  <div className="text-sm text-red-300">{definitionError}</div>
                ) : definition?.ok ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-lg font-semibold text-slate-100">{definition.word || selectedWord}</div>
                      {definition.phonetic ? <div className="mt-1 text-sm text-slate-400">{definition.phonetic}</div> : null}
                    </div>

                    {Array.isArray(definition.meanings) && definition.meanings.length ? (
                      <div className="space-y-3">
                        {definition.meanings.map((m: any, idx: number) => (
                          <div key={`${idx}`} className="space-y-2">
                            {m?.partOfSpeech ? (
                              <div className="text-xs uppercase tracking-wide text-slate-400">{String(m.partOfSpeech)}</div>
                            ) : null}
                            {Array.isArray(m?.definitions) ? (
                              <div className="space-y-2">
                                {m.definitions.slice(0, 4).map((d: any, j: number) => (
                                  <div key={`${idx}-${j}`} className="text-sm text-slate-100">
                                    {String(d?.definition || "")}
                                    {d?.example ? <div className="mt-1 text-xs text-slate-400">{String(d.example)}</div> : null}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400">No meanings returned.</div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">No definition found.</div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}
