'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAdminAuth } from './useAdminAuth';
import { resourcesRegistry } from '@/lib/resourcesRegistry';
import { articlesRegistry, type ArticleTag } from '@/lib/articlesRegistry';
import { videoResourcesRegistry } from '@/lib/videoResourcesRegistry';
import { satVideoResourcesRegistry } from '@/lib/satVideoResourcesRegistry';

export default function AdminDashboardPage() {
  const { info, loading, error } = useAdminAuth();

  const readingItems = Object.values(resourcesRegistry.reading);
  const listeningItems = Object.values(resourcesRegistry.listening);
  const articleItems = Object.values(articlesRegistry);
  const ieltsVideoItems = Object.values(videoResourcesRegistry);
  const ieltsVideoEntries = Object.entries(videoResourcesRegistry);
  const satVideoItems = Object.values(satVideoResourcesRegistry);
  const satVideoEntries = Object.entries(satVideoResourcesRegistry);

  const ARTICLE_TAGS = [
    'education',
    'environment',
    'science',
    'lifestyle',
    'technology',
    'wellbeing',
    'research',
    'general',
    'history',
    'crime',
    'finance',
    'politics',
    'sport',
    'medicine',
  ] as const satisfies ReadonlyArray<ArticleTag>;

  const countPlans = (
    items: Array<{ requiredPlan: 'free' | 'premium' }>,
  ): { total: number; free: number; premium: number } => {
    let free = 0;
    let premium = 0;
    for (const item of items) {
      if (item.requiredPlan === 'premium') premium += 1;
      else free += 1;
    }
    return { total: items.length, free, premium };
  };

  const countParts = (
    items: Array<{ part: 1 | 2 | 3 | 4 | 'full' }>,
  ): Record<'1' | '2' | '3' | '4' | 'full', number> => {
    return items.reduce(
      (acc, item) => {
        const key = String(item.part) as '1' | '2' | '3' | '4' | 'full';
        acc[key] += 1;
        return acc;
      },
      { '1': 0, '2': 0, '3': 0, '4': 0, full: 0 },
    );
  };

  const readingCounts = countPlans(readingItems);
  const listeningCounts = countPlans(listeningItems);
  const readingPartCounts = countParts(readingItems);
  const listeningPartCounts = countParts(listeningItems);
  const articleTagCounts = ARTICLE_TAGS.reduce(
    (acc, tag) => {
      acc[tag] = 0;
      return acc;
    },
    {} as Record<ArticleTag, number>,
  );

  for (const item of articleItems) {
    for (const tag of item.tags) {
      articleTagCounts[tag] += 1;
    }
  }

  const ieltsVideoCountsByPlan = countPlans(ieltsVideoItems);
  const ieltsVideoCountsByMediaType = ieltsVideoItems.reduce(
    (acc, item) => {
      acc[item.mediaType] += 1;
      return acc;
    },
    { video: 0, file: 0 },
  );

  const ieltsVideoCountsBySection = ieltsVideoItems.reduce(
    (acc, item) => {
      acc[item.section] += 1;
      return acc;
    },
    { writing: 0, listening: 0, reading: 0, speaking: 0 },
  );

  const sortedIeltsVideoEntries = [...ieltsVideoEntries].sort((a, b) => {
    const aRule = a[1];
    const bRule = b[1];
    const sectionCompare = aRule.section.localeCompare(bRule.section);
    if (sectionCompare !== 0) return sectionCompare;
    return aRule.title.localeCompare(bRule.title);
  });

  const satVideoCountsByPlan = countPlans(satVideoItems);
  const satVideoCountsByMediaType = satVideoItems.reduce(
    (acc, item) => {
      acc[item.mediaType] += 1;
      return acc;
    },
    { video: 0, file: 0 },
  );

  const satVideoCountsBySection = satVideoItems.reduce(
    (acc, item) => {
      const sections = Array.isArray(item.section) ? item.section : [item.section];
      for (const s of sections) {
        acc[s] += 1;
      }
      return acc;
    },
    { math: 0, english: 0, general: 0 },
  );

  const sortedSatVideoEntries = [...satVideoEntries].sort((a, b) => {
    const aRule = a[1];
    const bRule = b[1];
    const aSection = Array.isArray(aRule.section) ? aRule.section.join(',') : aRule.section;
    const bSection = Array.isArray(bRule.section) ? bRule.section.join(',') : bRule.section;
    const sectionCompare = aSection.localeCompare(bSection);
    if (sectionCompare !== 0) return sectionCompare;
    return aRule.title.localeCompare(bRule.title);
  });

  const [readingSearchQuery, setReadingSearchQuery] = useState('');

  const readingSearchResults = useMemo(() => {
    const q = readingSearchQuery.trim().toLowerCase();
    if (!q) return [];

    return Object.entries(resourcesRegistry.reading)
      .map(([id, rule]) => ({ id, ...rule }))
      .filter((item) => {
        const hay = `${item.id} ${item.title}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [readingSearchQuery]);

  if (loading) {
    return <p className="text-sm text-gray-300">Loading admin dashboard...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[0.2em] uppercase">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-gray-400">
          Signed in as <span className="font-mono text-gray-200">{info?.admin ?? 'Unknown'}</span>
        </p>
      </div>

      <div className="grid gap-4">
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gray-400 mb-3">Materials</p>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 px-5 py-4 mb-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Reading title check</div>
              <input
                type="text"
                value={readingSearchQuery}
                onChange={(e) => setReadingSearchQuery(e.target.value)}
                placeholder="Type reading title or ID..."
                className="mt-3 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 transition-all duration-200 ease-out hover:border-white/60 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/40"
              />

              {readingSearchQuery.trim() ? (
                <div className="mt-3">
                  <div className="text-xs text-slate-400">
                    Matches: <span className="text-slate-100">{readingSearchResults.length}</span>
                  </div>
                  <div className="mt-3 max-h-60 space-y-2 overflow-auto pr-1">
                    {readingSearchResults.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-neutral-800 bg-black/30 px-4 py-3"
                      >
                        <div className="truncate text-sm font-semibold text-slate-100">{item.title}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          ID: <span className="font-mono text-slate-200">{item.id}</span>
                          {' • '}Part: <span className="text-slate-200">{item.part}</span>
                          {' • '}Plan: <span className="text-slate-200">{item.requiredPlan}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-xs text-slate-500">Start typing to search in Reading registry.</div>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 px-5 py-4 xl:col-span-1 xl:aspect-square flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Reading</div>
                    <div className="mt-2 text-3xl font-semibold text-slate-100">{readingCounts.total}</div>
                    <div className="mt-0.5 text-xs text-slate-500">Total materials</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-xs text-slate-400">
                    <span>
                      Free <span className="text-slate-100">{readingCounts.free}</span>
                    </span>
                    <span>
                      Premium <span className="text-slate-100">{readingCounts.premium}</span>
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Passages</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(['1', '2', '3', 'full'] as const).map((key) => (
                      <span
                        key={key}
                        className="rounded-full border border-neutral-800 bg-black/30 px-3 py-1 text-xs text-slate-300"
                      >
                        {key === 'full' ? 'Full' : `P${key}`} -{' '}
                        <span className="text-slate-100">{readingPartCounts[key]}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 px-5 py-4 xl:col-span-1 xl:aspect-square flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Listening</div>
                    <div className="mt-2 text-3xl font-semibold text-slate-100">{listeningCounts.total}</div>
                    <div className="mt-0.5 text-xs text-slate-500">Total materials</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-xs text-slate-400">
                    <span>
                      Free <span className="text-slate-100">{listeningCounts.free}</span>
                    </span>
                    <span>
                      Premium <span className="text-slate-100">{listeningCounts.premium}</span>
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Sections</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(['1', '2', '3', '4', 'full'] as const).map((key) => (
                      <span
                        key={key}
                        className="rounded-full border border-neutral-800 bg-black/30 px-3 py-1 text-xs text-slate-300"
                      >
                        {key === 'full' ? 'Full' : `S${key}`} -{' '}
                        <span className="text-slate-100">{listeningPartCounts[key]}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 xl:col-span-2">
                <div className="text-sm text-gray-200">Articles by tag</div>
                <div className="mt-1 text-xs text-gray-400">
                  Total: <span className="text-gray-200">{articleItems.length}</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {ARTICLE_TAGS.map((tag) => (
                    <div key={tag} className="rounded border border-white/10 bg-black/20 px-2 py-1">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-gray-500">{tag}</div>
                      <div className="text-xs text-gray-200">{articleTagCounts[tag]}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Link
              href="/resources"
              className="text-[11px] uppercase tracking-[0.22em] text-white/90 underline underline-offset-4 decoration-white/40 hover:text-white"
            >
              Open resources
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gray-400 mb-3">IELTS Video Resources</p>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 px-5 py-4">
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-gray-200">
                  Total: <span className="text-gray-100">{ieltsVideoItems.length}</span>
                  {' • '}Free: <span className="text-gray-100">{ieltsVideoCountsByPlan.free}</span>
                  {' • '}Premium: <span className="text-gray-100">{ieltsVideoCountsByPlan.premium}</span>
                </div>
                <div className="text-xs text-gray-400">
                  Media: <span className="text-gray-200">video {ieltsVideoCountsByMediaType.video}</span>
                  {' • '}file: <span className="text-gray-200">{ieltsVideoCountsByMediaType.file}</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Sections:
                {' '}
                <span className="text-gray-200">writing {ieltsVideoCountsBySection.writing}</span>
                {' • '}
                <span className="text-gray-200">listening {ieltsVideoCountsBySection.listening}</span>
                {' • '}
                <span className="text-gray-200">reading {ieltsVideoCountsBySection.reading}</span>
                {' • '}
                <span className="text-gray-200">speaking {ieltsVideoCountsBySection.speaking}</span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {sortedIeltsVideoEntries.map(([id, rule]) => (
                <div
                  key={id}
                  className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/80 px-5 py-4"
                >
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold text-slate-100">{rule.title}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      ID: <span className="font-mono text-slate-300">{id}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                      <span className="rounded-full border border-neutral-800 bg-black/30 px-3 py-1">
                        {rule.section}
                      </span>
                      <span className="rounded-full border border-neutral-800 bg-black/30 px-3 py-1">
                        {rule.mediaType}
                      </span>
                      <span className="rounded-full border border-neutral-800 bg-black/30 px-3 py-1">
                        {rule.requiredPlan}
                      </span>
                    </div>
                    {rule.teacher ? <div className="mt-2 text-xs text-slate-500">Teacher: {rule.teacher}</div> : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {rule.href ? (
                      <a
                        href={rule.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-full border border-neutral-700 bg-neutral-950 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-100 transition-colors hover:border-white/60 hover:bg-neutral-900"
                      >
                        Open
                      </a>
                    ) : null}
                    {rule.telegramHref ? (
                      <a
                        href={rule.telegramHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-full border border-neutral-700 bg-neutral-950 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-100 transition-colors hover:border-white/60 hover:bg-neutral-900"
                      >
                        Telegram
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-400 mb-3">SAT Video Resources</p>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 px-5 py-4">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-gray-200">
                    Total: <span className="text-gray-100">{satVideoItems.length}</span>
                    {' • '}Free: <span className="text-gray-100">{satVideoCountsByPlan.free}</span>
                    {' • '}Premium: <span className="text-gray-100">{satVideoCountsByPlan.premium}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Media: <span className="text-gray-200">video {satVideoCountsByMediaType.video}</span>
                    {' • '}file: <span className="text-gray-200">{satVideoCountsByMediaType.file}</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Sections:
                  {' '}
                  <span className="text-gray-200">math {satVideoCountsBySection.math}</span>
                  {' • '}
                  <span className="text-gray-200">english {satVideoCountsBySection.english}</span>
                  {' • '}
                  <span className="text-gray-200">general {satVideoCountsBySection.general}</span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {sortedSatVideoEntries.map(([id, rule]) => (
                  <div
                    key={id}
                    className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/80 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold text-slate-100">{rule.title}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        ID: <span className="font-mono text-slate-300">{id}</span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                        <span className="rounded-full border border-neutral-800 bg-black/30 px-3 py-1">
                          {Array.isArray(rule.section) ? rule.section.join(', ') : rule.section}
                        </span>
                        <span className="rounded-full border border-neutral-800 bg-black/30 px-3 py-1">
                          {rule.mediaType}
                        </span>
                        <span className="rounded-full border border-neutral-800 bg-black/30 px-3 py-1">
                          {rule.requiredPlan}
                        </span>
                      </div>

                      {rule.teacher ? <div className="mt-2 text-xs text-slate-500">Teacher: {rule.teacher}</div> : null}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {rule.href ? (
                        <a
                          href={rule.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full border border-neutral-700 bg-neutral-950 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-100 transition-colors hover:border-white/60 hover:bg-neutral-900"
                        >
                          Open
                        </a>
                      ) : null}
                      {rule.telegramHref ? (
                        <a
                          href={rule.telegramHref}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full border border-neutral-700 bg-neutral-950 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-100 transition-colors hover:border-white/60 hover:bg-neutral-900"
                        >
                          Telegram
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
