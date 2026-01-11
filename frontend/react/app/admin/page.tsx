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

  const readingCounts = countPlans(readingItems);
  const listeningCounts = countPlans(listeningItems);
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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gray-400 mb-1">Subscriptions</p>
            <p className="text-sm text-gray-200">Inspect and manage active subscriptions across users.</p>
          </div>
          <div className="mt-4 flex gap-4">
            <Link
              href="/admin/subscriptions"
              className="text-[11px] uppercase tracking-[0.22em] text-white/90 underline underline-offset-4 decoration-white/40 hover:text-white"
            >
              Open subscriptions
            </Link>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gray-400 mb-1">Monitoring</p>
            <p className="text-sm text-gray-200">
              Check services health and links to Docker monitor or dashboards.
            </p>
          </div>
          <div className="mt-4">
            <Link
              href="/admin/monitoring"
              className="text-[11px] uppercase tracking-[0.22em] text-white/90 underline underline-offset-4 decoration-white/40 hover:text-white"
            >
              Open monitoring
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gray-400 mb-3">Materials</p>

            <div className="space-y-3">
              <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                <div className="text-sm text-gray-200">Reading</div>
                <div className="mt-1 text-xs text-gray-400">
                  Total: <span className="text-gray-200">{readingCounts.total}</span>
                  {' • '}Free: <span className="text-gray-200">{readingCounts.free}</span>
                  {' • '}Premium: <span className="text-gray-200">{readingCounts.premium}</span>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                <div className="text-sm text-gray-200">Listening</div>
                <div className="mt-1 text-xs text-gray-400">
                  Total: <span className="text-gray-200">{listeningCounts.total}</span>
                  {' • '}Free: <span className="text-gray-200">{listeningCounts.free}</span>
                  {' • '}Premium: <span className="text-gray-200">{listeningCounts.premium}</span>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
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

              <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                <div className="text-sm text-gray-200">Video resources</div>
                <div className="mt-1 text-xs text-gray-400">
                  Total: <span className="text-gray-200">{videoItems.length}</span>
                  {' • '}Free: <span className="text-gray-200">{videoCountsByPlan.free}</span>
                  {' • '}Premium: <span className="text-gray-200">{videoCountsByPlan.premium}</span>
                </div>

                <div className="mt-2 text-xs text-gray-400">
                  Media: <span className="text-gray-200">Video {videoCountsByMediaType.video}</span>
                  {' • '}File: <span className="text-gray-200">{videoCountsByMediaType.file}</span>
                </div>

                <div className="mt-2 text-xs text-gray-400">
                  Sections:
                  {' '}
                  <span className="text-gray-200">Writing {videoCountsBySection.writing}</span>
                  {' • '}
                  <span className="text-gray-200">Listening {videoCountsBySection.listening}</span>
                  {' • '}
                  <span className="text-gray-200">Reading {videoCountsBySection.reading}</span>
                  {' • '}
                  <span className="text-gray-200">Speaking {videoCountsBySection.speaking}</span>
                </div>

                <div className="mt-3 space-y-2">
                  {sortedVideoEntries.map(([id, rule]) => (
                    <div key={id} className="rounded border border-white/10 bg-black/20 px-2 py-2">
                      <div className="text-xs text-gray-200">{rule.title}</div>
                      <div className="mt-1 text-[11px] text-gray-400">
                        ID: <span className="font-mono text-gray-200">{id}</span>
                        {' • '}Section: <span className="text-gray-200">{rule.section}</span>
                        {' • '}Type: <span className="text-gray-200">{rule.mediaType}</span>
                        {' • '}Plan: <span className="text-gray-200">{rule.requiredPlan}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-gray-400 break-all">
                        Href:{' '}
                        <span className="text-gray-200">{rule.href ?? '-'}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-gray-400 break-all">
                        Telegram:{' '}
                        <span className="text-gray-200">{rule.telegramHref ?? '-'}</span>
                      </div>
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
      </div>
    </div>
  );
}
