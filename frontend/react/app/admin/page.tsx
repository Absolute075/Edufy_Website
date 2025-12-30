'use client';

import Link from 'next/link';
import { useAdminAuth } from './useAdminAuth';
import { resourcesRegistry } from '@/lib/resourcesRegistry';

export default function AdminDashboardPage() {
  const { info, loading, error } = useAdminAuth();

  const readingItems = Object.values(resourcesRegistry.reading);
  const listeningItems = Object.values(resourcesRegistry.listening);

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
