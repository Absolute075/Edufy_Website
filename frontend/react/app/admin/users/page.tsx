'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../useAdminAuth';

type UserRow = {
  username: string;
  email: string;
  plan: string;
  grantedAt?: string | null;
  activeUntil?: string | null;
};

export default function AdminUsersPage() {
  const { loading, error } = useAdminAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<UserRow[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  if (loading) {
    return <p className="text-sm text-gray-300">Loading admin data...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    setSearchError(null);
    const q = searchQuery.trim();
    if (!q) {
      setResults([]);
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
        setSearchError('Failed to load users');
        setResults([]);
        return;
      }

      const data = await res.json().catch(() => []);
      if (Array.isArray(data)) {
        setResults(
          data.map((item: any) => ({
            username: String(item.username ?? ''),
            email: String(item.email ?? ''),
            plan: String(item.plan ?? ''),
            grantedAt: item.grantedAt ?? null,
            activeUntil: item.activeUntil ?? null,
          }))
        );
      } else {
        setResults([]);
      }
    } catch {
      setSearchError('Network error while loading users');
      setResults([]);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[0.2em] uppercase">Users</h1>
        <p className="mt-2 text-sm text-gray-400">
          Manage Edufy users: search, see their current subscription, and jump into subscription control.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
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
              {results.length === 0 ? (
                searchPerformed && !searchLoading ? (
                  <tr>
                    <td colSpan={6} className="py-3 text-gray-500">
                      No users found.
                    </td>
                  </tr>
                ) : null
              ) : (
                results.map((row) => (
                  <tr key={row.username} className="border-b border-white/5 last:border-0">
                    <td className="py-2 pr-4 font-mono text-[11px] text-gray-100">{row.username}</td>
                    <td className="py-2 pr-4 text-gray-200">{row.email}</td>
                    <td className="py-2 pr-4 text-gray-200 uppercase">{row.plan || 'free'}</td>
                    <td className="py-2 pr-4 text-gray-300">{formatDateTime(row.grantedAt)}</td>
                    <td className="py-2 pr-4 text-gray-300">{formatDateTime(row.activeUntil)}</td>
                    <td className="py-2 pl-4 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center rounded-full border border-white/30 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/90 hover:bg-white hover:text-black transition-colors"
                        onClick={() => router.push(`/admin/subscriptions?username=${encodeURIComponent(row.username)}`)}
                      >
                        Manage subscription
                      </button>
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
