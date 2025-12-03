'use client';

import Link from 'next/link';
import { useAdminAuth } from './useAdminAuth';

export default function AdminDashboardPage() {
  const { info, loading, error } = useAdminAuth();

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
            <p className="text-xs uppercase tracking-[0.22em] text-gray-400 mb-1">Users</p>
            <p className="text-sm text-gray-200">
              View and manage users, search, and block or unblock accounts.
            </p>
          </div>
          <div className="mt-4">
            <Link
              href="/admin/users"
              className="text-[11px] uppercase tracking-[0.22em] text-white/90 underline underline-offset-4 decoration-white/40 hover:text-white"
            >
              Open users
            </Link>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gray-400 mb-1">Billing</p>
            <p className="text-sm text-gray-200">
              Inspect payments, invoices, and active subscriptions across users.
            </p>
          </div>
          <div className="mt-4 flex gap-4">
            <Link
              href="/admin/payments"
              className="text-[11px] uppercase tracking-[0.22em] text-white/90 underline underline-offset-4 decoration-white/40 hover:text-white"
            >
              Payments
            </Link>
            <Link
              href="/admin/subscriptions"
              className="text-[11px] uppercase tracking-[0.22em] text-white/70 underline underline-offset-4 decoration-white/20 hover:text-white"
            >
              Subscriptions
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
      </div>
    </div>
  );
}
