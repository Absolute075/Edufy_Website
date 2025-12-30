import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface AdminInfo {
  admin?: string;
  status?: string;
}

export function useAdminAuth() {
  const router = useRouter();
  const [info, setInfo] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function getLoginHref(): string {
    try {
      if (typeof window !== 'undefined' && window.location.hostname.startsWith('admin.')) {
        return '/login';
      }
    } catch {}
    return '/admin/login';
  }

  function clearAdminToken() {
    try {
      localStorage.removeItem('admin_token');
    } catch {}
    try {
      const isProd = window.location.hostname.endsWith('edufyuzbekistan.com');
      const secure = window.location.protocol === 'https:';
      const domain = isProd ? '; Domain=.edufyuzbekistan.com' : '';
      const sameSite = '; SameSite=Lax';
      const securePart = secure ? '; Secure' : '';
      document.cookie = `admin_token=; Path=/; Max-Age=0${domain}${sameSite}${securePart}`;
      document.cookie = `admin_token=; Path=/; Max-Age=0${sameSite}${securePart}`;
    } catch {}
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/admin/info', { cache: 'no-store', credentials: 'include' });

        if (res.status === 401 || res.status === 403) {
          clearAdminToken();
          if (!cancelled) {
            setError('Admin auth required');
            setLoading(false);
            const redirect = window.location.pathname + window.location.search;
            router.replace(`${getLoginHref()}?redirect=${encodeURIComponent(redirect)}`);
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
  }, []);

  return { info, loading, error };
}
