'use client';

import { useAdminAuth } from '../useAdminAuth';

export default function AdminPaymentsPage() {
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
        <h1 className="text-2xl font-semibold">Payments</h1>
        <p className="text-sm text-slate-400">
          Monitor user payments and subscription renewals. This section will show manual payments and
          subscription extensions recorded by the team.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold tracking-[0.18em] uppercase text-gray-200">
            Payments table
          </h2>
          <span className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Coming soon</span>
        </div>
        <div className="rounded-lg border border-white/5 bg-black/40 px-4 py-6 text-sm text-gray-400">
          Here you will see payment history with username, amount, plan, status, and links to invoices.
          We will connect this page to user_service and gateway_service.
        </div>
      </div>
    </div>
  );
}
