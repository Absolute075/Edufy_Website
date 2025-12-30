'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/admin-api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (!res.ok) {
        const rawText = await res.text().catch(() => '');
        const maybeJson = (() => {
          try {
            return JSON.parse(rawText);
          } catch {
            return null;
          }
        })();
        const apiError =
          maybeJson && typeof (maybeJson as any).error === 'string'
            ? String((maybeJson as any).error)
            : '';
        const fallback = rawText
          ? rawText.replace(/\s+/g, ' ').trim().slice(0, 180)
          : `HTTP ${res.status}`;
        setError(apiError || `Login failed (${res.status}): ${fallback}`);
        setLoading(false);
        return;
      }

      const rawOkBody = await res.text().catch(() => '');
      const data = (() => {
        try {
          return rawOkBody ? JSON.parse(rawOkBody) : null;
        } catch {
          return null;
        }
      })();

      if (data && typeof (data as any).token === 'string' && (data as any).token) {
        const token = String((data as any).token);
        try {
          const secure = window.location.protocol === 'https:';
          const sameSite = '; SameSite=Lax';
          const securePart = secure ? '; Secure' : '';

          // Host-only session cookie (no Domain, no Max-Age).
          document.cookie = `admin_token=${encodeURIComponent(token)}; Path=/${sameSite}${securePart}`;
        } catch {
          // ignore cookie errors
        }
      }

      const verifyRes = await fetch('/api/admin/info', { cache: 'no-store', credentials: 'include' });
      if (verifyRes.status === 401 || verifyRes.status === 403) {
        setError('Login succeeded, but admin session cookie was not set. Check /admin-api/admin/login Set-Cookie / CORS.');
        setLoading(false);
        return;
      }

      const redirect = (() => {
        try {
          const url = new URL(window.location.href);
          const raw = url.searchParams.get('redirect');
          return raw && raw.startsWith('/') ? raw : null;
        } catch {
          return null;
        }
      })();

      router.push(redirect ?? '/admin');
    } catch (err) {
      setError('Network error, please try again');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-sm bg-zinc-900/80 border border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="mb-6 text-center">
          <p className="font-ptserif tracking-[0.35em] text-xs text-white/60">EDUFY</p>
          <h1 className="mt-2 text-xl font-semibold text-white tracking-[0.15em] uppercase">Admin Login</h1>
          <p className="mt-2 text-xs text-gray-400">Restricted area. Authorized staff only.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-300 tracking-wide">Username</label>
            <input
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md bg-black/40 border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/50"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-300 tracking-wide">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md bg-black/40 border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/50"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/40 border border-red-500/40 rounded-md px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center rounded-md bg-white text-black text-xs font-semibold tracking-[0.2em] uppercase py-2.5 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
