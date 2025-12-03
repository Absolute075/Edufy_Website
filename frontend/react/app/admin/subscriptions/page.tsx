'use client';

import { FormEvent, useState } from 'react';
import { useAdminAuth } from '../useAdminAuth';

type PlanOption = 'Plus' | 'Pro';
type PeriodOption = 'monthly' | 'sixMonths' | 'yearly';

type PlanFilter = 'all' | 'plus' | 'premium';

type SubscriptionRow = {
  username: string;
  email: string;
  plan: string;
  grantedAt?: string | null;
  activeUntil?: string | null;
};

export default function AdminSubscriptionsPage() {
  const { loading, error } = useAdminAuth();
  const [username, setUsername] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('username') ?? '';
    } catch {
      return '';
    }
  });
  const [plan, setPlan] = useState<PlanOption>('Plus');
  const [period, setPeriod] = useState<PeriodOption>('monthly');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SubscriptionRow[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all');

  if (loading) {
    return <p className="text-sm text-gray-300">Loading admin data...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccess(null);
    setActionError(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setActionError('Username is required');
      return;
    }

    setSubmitting(true);
    try {
      let token: string | null = null;
      if (typeof window !== 'undefined') {
        try {
          token = localStorage.getItem('admin_token');
        } catch {
          token = null;
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/admin-api/admin/subscriptions/grant', {
        method: 'POST',
        headers,
        body: JSON.stringify({ username: trimmedUsername, plan, period }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(typeof data.message === 'string' ? data.message : 'Failed to grant subscription');
        return;
      }

      const activeUntil = typeof data.activeUntil === 'string' ? data.activeUntil : undefined;
      setSuccess(
        `Subscription updated: ${trimmedUsername} → ${plan === 'Pro' ? 'Premium' : plan} (${period})` +
          (activeUntil ? `, active until ${activeUntil}` : '')
      );
    } catch {
      setActionError('Network error while granting subscription');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    setSearchError(null);
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearchPerformed(false);
      return;
    }

    setSearchLoading(true);
    setSearchPerformed(true);
    try {
      let token: string | null = null;
      if (typeof window !== 'undefined') {
        try {
          token = localStorage.getItem('admin_token');
        } catch {
          token = null;
        }
      }

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/admin-api/admin/subscriptions/search?q=${encodeURIComponent(q)}`, {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        setSearchError('Failed to load subscriptions');
        setSearchResults([]);
        return;
      }

      const data = await res.json().catch(() => []);
      if (Array.isArray(data)) {
        setSearchResults(
          data.map((item: any) => ({
            username: String(item.username ?? ''),
            email: String(item.email ?? ''),
            plan: String(item.plan ?? ''),
            grantedAt: item.grantedAt ?? null,
            activeUntil: item.activeUntil ?? null,
          }))
        );
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchError('Network error while loading subscriptions');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  function formatDateTime(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const filteredResults = searchResults.filter((row) => {
    const planLower = (row.plan || 'free').toLowerCase();
    if (planFilter === 'all') return true;
    if (planFilter === 'plus') return planLower === 'plus';
    // Treat both "pro" and "premium" plans as Premium tier
    if (planFilter === 'premium') return planLower === 'pro' || planLower === 'premium';
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[0.2em] uppercase">Subscriptions</h1>
        <p className="mt-2 text-sm text-gray-400">
          Manually activate or extend user subscriptions after verifying payment.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
        <h2 className="text-sm font-semibold tracking-[0.18em] uppercase text-gray-200 mb-3">
          Grant or extend subscription
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5 md:col-span-1">
              <label className="block text-[11px] uppercase tracking-[0.18em] text-gray-400">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="student_username"
                className="w-full rounded-md bg-black/40 border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/50"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] uppercase tracking-[0.18em] text-gray-400">Plan</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as PlanOption)}
                className="w-full rounded-md bg-black/40 border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/50"
              >
                <option value="Plus">Plus</option>
                <option value="Pro">Premium</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] uppercase tracking-[0.18em] text-gray-400">Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodOption)}
                className="w-full rounded-md bg-black/40 border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/50"
              >
                <option value="monthly">Monthly</option>
                <option value="sixMonths">6 months</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-gray-500 max-w-md">
              The new period will be added on top of any existing active subscription (if active). If there is no
              active subscription, the period starts from now.
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full border border-white/25 bg-white text-gray-900 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] shadow-[0_0_14px_rgba(255,255,255,0.4)] hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : 'Activate / Extend'}
            </button>
          </div>

          {actionError && <p className="text-xs text-red-400 mt-2">{actionError}</p>}
          {success && <p className="text-xs text-emerald-400 mt-2">{success}</p>}
        </form>
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
        <h2 className="text-sm font-semibold tracking-[0.18em] uppercase text-gray-200 mb-3">Subscriptions database</h2>
        <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row md:items-center text-sm">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username or email"
              className="w-full rounded-md bg-black/40 border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/50"
            />
          </div>
          <div className="w-full md:w-40">
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as PlanFilter)}
              className="w-full rounded-md bg-black/40 border border-white/15 px-3 py-2 text-xs text-white uppercase tracking-[0.16em] focus:outline-none focus:ring-1 focus:ring-white/50"
            >
              <option value="all">All plans</option>
              <option value="plus">Plus only</option>
              <option value="premium">Premium only</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={searchLoading}
            className="rounded-full border border-white/25 bg-white text-gray-900 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {searchLoading ? 'Searching...' : 'Search'}
          </button>
        </form>
        {searchError && <p className="text-xs text-red-400 mt-2">{searchError}</p>}
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.18em] text-gray-500 border-b border-white/10">
                <th className="py-2 pr-4">Username</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Plan</th>
                <th className="py-2 pr-4">Granted</th>
                <th className="py-2 pr-4">Expires</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.length === 0 ? (
                searchPerformed && !searchLoading ? (
                  <tr>
                    <td colSpan={5} className="py-3 text-gray-500">
                      No users found.
                    </td>
                  </tr>
                ) : null
              ) : (
                filteredResults.map((row) => (
                  <tr key={row.username} className="border-b border-white/5 last:border-0">
                    <td className="py-2 pr-4 font-mono text-[11px] text-gray-100">{row.username}</td>
                    <td className="py-2 pr-4 text-gray-200">{row.email}</td>
                    <td className="py-2 pr-4 text-gray-200 uppercase">{row.plan || 'free'}</td>
                    <td className="py-2 pr-4 text-gray-300">{formatDateTime(row.grantedAt)}</td>
                    <td className="py-2 pr-4 text-gray-300">{formatDateTime(row.activeUntil)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
