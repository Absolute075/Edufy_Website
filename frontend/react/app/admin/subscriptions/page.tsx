'use client';

import { FormEvent, useState } from 'react';
import { useAdminAuth } from '../useAdminAuth';

type PeriodOption = 'monthly' | 'sixMonths' | 'yearly';

type SubscriptionRow = {
  username: string;
  email: string;
  plan: string;
  grantedAt?: string | null;
  activeUntil?: string | null;
};

export default function AdminSubscriptionsPage() {
  const { loading, error } = useAdminAuth();
  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('email') ?? '';
    } catch {
      return '';
    }
  });
  const [period, setPeriod] = useState<PeriodOption>('monthly');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SubscriptionRow[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState<string | null>(null);

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

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setActionError('Email is required');
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
        body: JSON.stringify({ email: trimmedEmail, period }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof (data as any).message === 'string'
            ? (data as any).message
            : typeof (data as any).error === 'string'
              ? (data as any).error
              : 'Failed to grant subscription';
        setActionError(msg);
        return;
      }

      const activeUntil = typeof data.activeUntil === 'string' ? data.activeUntil : undefined;
      setSuccess(
        `Subscription updated: ${trimmedEmail} → Premium (${period})` +
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
          data.map((item: any) => {
            const rawPlan = String(item.plan ?? '').toLowerCase();
            const normalizedPlan = !rawPlan || rawPlan === 'free' ? 'free' : 'premium';
            return {
              username: String(item.username ?? ''),
              email: String(item.email ?? ''),
              plan: normalizedPlan,
              grantedAt: item.grantedAt ?? null,
              activeUntil: item.activeUntil ?? null,
            };
          })
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

  function handleUseInForm(row: SubscriptionRow) {
    setEmail(row.email);
    if (typeof window !== 'undefined') {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        // ignore scroll errors
      }
    }
  }

  async function handleRevoke(row: SubscriptionRow) {
    const trimmedEmail = String(row.email ?? '').trim();
    if (!trimmedEmail) {
      setSearchError('Email is required to revoke subscription');
      return;
    }

    setSearchError(null);
    setRevokeLoading(trimmedEmail);
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

      const res = await fetch('/admin-api/admin/subscriptions/revoke', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof (data as any).message === 'string'
            ? (data as any).message
            : typeof (data as any).error === 'string'
              ? (data as any).error
              : 'Failed to revoke subscription';
        setSearchError(msg);
        return;
      }

      const activeUntil = (data as any).activeUntil ?? null;
      setSearchResults((prev) =>
        prev.map((item) =>
          item.username === row.username
            ? {
                ...item,
                plan: 'free',
                activeUntil: typeof activeUntil === 'string' ? activeUntil : item.activeUntil,
              }
            : item
        )
      );
    } catch {
      setSearchError('Network error while revoking subscription');
    } finally {
      setRevokeLoading(null);
    }
  }

  const totalCount = searchResults.length;
  const premiumCount = searchResults.filter((row) => (row.plan || 'free').toLowerCase() === 'premium').length;
  const freeCount = totalCount - premiumCount;

  const filteredResults = premiumOnly
    ? searchResults.filter((row) => (row.plan || 'free').toLowerCase() === 'premium')
    : searchResults;

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
              <label className="block text-[11px] uppercase tracking-[0.18em] text-gray-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@email.com"
                className="w-full rounded-md bg-black/40 border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/50"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] uppercase tracking-[0.18em] text-gray-400">Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodOption)}
                className="w-full rounded-md bg-black/40 border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/50"
              >
                <option value="monthly">1 month</option>
                <option value="sixMonths">6 months</option>
                <option value="yearly">1 year</option>
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
          <button
            type="submit"
            disabled={searchLoading}
            className="rounded-full border border-white/25 bg-white text-gray-900 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {searchLoading ? 'Searching...' : 'Search'}
          </button>
        </form>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[11px] text-gray-400">
          <div>
            {searchPerformed ? (
              <>
                Found: <span className="text-gray-200">{totalCount}</span> | Premium:{' '}
                <span className="text-gray-200">{premiumCount}</span> | Free:{' '}
                <span className="text-gray-200">{freeCount}</span>
              </>
            ) : (
              <span>Search to see subscriptions.</span>
            )}
          </div>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={premiumOnly}
              onChange={(e) => setPremiumOnly(e.target.checked)}
              className="h-4 w-4 rounded border border-white/20 bg-black/40"
            />
            <span className="uppercase tracking-[0.18em]">Premium only</span>
          </label>
        </div>
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
                <th className="py-2 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.length === 0 ? (
                searchPerformed && !searchLoading ? (
                  <tr>
                    <td colSpan={6} className="py-3 text-gray-500">
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
                    <td className="py-2 pl-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleUseInForm(row)}
                          disabled={!row.email}
                          className="inline-flex items-center rounded-full border border-white/30 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/90 hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Use
                        </button>
                        {(row.plan || 'free').toLowerCase() === 'premium' && (
                          <button
                            type="button"
                            onClick={() => handleRevoke(row)}
                            disabled={!row.email || revokeLoading === row.email}
                            className="inline-flex items-center rounded-full border border-red-400/40 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-red-200 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {revokeLoading === row.email ? 'Revoking...' : 'Revoke'}
                          </button>
                        )}
                      </div>
                    </td>
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
