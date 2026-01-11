'use client';

import Link from 'next/link';
import { useAdminAuth } from './useAdminAuth';
import { resourcesRegistry } from '@/lib/resourcesRegistry';
import { articlesRegistry, type ArticleTag } from '@/lib/articlesRegistry';
import { videoResourcesRegistry } from '@/lib/videoResourcesRegistry';

export default function AdminDashboardPage() {
  const { info, loading, error } = useAdminAuth();

  const readingItems = Object.values(resourcesRegistry.reading);
  const listeningItems = Object.values(resourcesRegistry.listening);
  const articleItems = Object.values(articlesRegistry);
  const videoItems = Object.values(videoResourcesRegistry);
  const videoEntries = Object.entries(videoResourcesRegistry);

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

  const videoCountsByPlan = countPlans(videoItems);
  const videoCountsByMediaType = videoItems.reduce(
    (acc, item) => {
      acc[item.mediaType] += 1;
      return acc;
    },
    { video: 0, file: 0 },
  );

  const videoCountsBySection = videoItems.reduce(
    (acc, item) => {
      acc[item.section] += 1;
      return acc;
    },
    { writing: 0, listening: 0, reading: 0, speaking: 0 },
  );

  const sortedVideoEntries = [...videoEntries].sort((a, b) => {
    const aRule = a[1];
    const bRule = b[1];
    const sectionCompare = aRule.section.localeCompare(bRule.section);
    if (sectionCompare !== 0) return sectionCompare;
    return aRule.title.localeCompare(bRule.title);
  });

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
            <p className="text-xs uppercase tracking-[0.22em] text-gray-400 mb-3">Video resources</p>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 px-5 py-4">
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-gray-200">
                  Total: <span className="text-gray-100">{videoItems.length}</span>
                  {' • '}Free: <span className="text-gray-100">{videoCountsByPlan.free}</span>
                  {' • '}Premium: <span className="text-gray-100">{videoCountsByPlan.premium}</span>
                </div>
                <div className="text-xs text-gray-400">
                  Media: <span className="text-gray-200">video {videoCountsByMediaType.video}</span>
                  {' • '}file: <span className="text-gray-200">{videoCountsByMediaType.file}</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Sections:
                {' '}
                <span className="text-gray-200">writing {videoCountsBySection.writing}</span>
                {' • '}
                <span className="text-gray-200">listening {videoCountsBySection.listening}</span>
                {' • '}
                <span className="text-gray-200">reading {videoCountsBySection.reading}</span>
                {' • '}
                <span className="text-gray-200">speaking {videoCountsBySection.speaking}</span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {sortedVideoEntries.map(([id, rule]) => (
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
  );
}
