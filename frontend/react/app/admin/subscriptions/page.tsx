'use client';

import { useAdminAuth } from '../useAdminAuth';

export default function AdminSubscriptionsPage() {
  const { loading, error } = useAdminAuth();

  if (loading) {
    return <p className="text-sm text-gray-300">Loading admin data...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[0.2em] uppercase">Subscriptions</h1>
        <p className="mt-2 text-sm text-gray-400">
          Overview of active and expired subscriptions, plans, and auto-renewal.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
        <p className="text-sm text-gray-300">
          A subscriptions overview with filters by plan, status, and renewal period will appear
          here. It will use data from the Subscription entity in the user_service.
        </p>
      </div>
    </div>
  );
}
