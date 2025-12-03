'use client';

import { FormEvent, useState } from 'react';
import { useAdminAuth } from '../useAdminAuth';

type PlanOption = 'Plus' | 'Pro';
type PeriodOption = 'monthly' | 'sixMonths' | 'yearly';

export default function AdminSubscriptionsPage() {
  const { loading, error } = useAdminAuth();
  const [username, setUsername] = useState('');
  const [plan, setPlan] = useState<PlanOption>('Plus');
  const [period, setPeriod] = useState<PeriodOption>('monthly');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
    </div>
  );
}
