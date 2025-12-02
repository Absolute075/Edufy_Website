'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AdminInfo {
  admin?: string;
  status?: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [info, setInfo] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      let token: string | null = null;
      try {
        token = localStorage.getItem('admin_token');
      } catch {
        token = null;
      }

      if (!token) {
        router.replace('/admin/login');
        return;
      }

      try {
        const res = await fetch('/admin-api/admin/info', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401 || res.status === 403) {
          try {
            localStorage.removeItem('admin_token');
          } catch {}
          if (!cancelled) {
            router.replace('/admin/login');
          }
          return;
        }

        if (!res.ok) {
          if (!cancelled) {
            setError('Failed to load admin info');
          }
          return;
        }

        const data: AdminInfo = await res.json();
        if (!cancelled) {
          setInfo(data);
        }
      } catch {
        if (!cancelled) {
          setError('Network error while loading data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [router]);

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
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-gray-400 mb-1">Users</p>
          <p className="text-sm text-gray-200">User management (list, search, block/unblock) will appear here.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-gray-400 mb-1">Subscriptions</p>
          <p className="text-sm text-gray-200">Active subscriptions and payments overview will be added here.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-gray-400 mb-1">Monitoring</p>
          <p className="text-sm text-gray-200">
            Service health (gateway, auth, user, file) and DockMon links will be displayed here.
          </p>
        </div>
      </div>
    </div>
  );
}
