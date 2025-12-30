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

  function readCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length < 2) return null;
    return parts.pop()?.split(';').shift() ?? null;
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
      let token: string | null = null;
      try {
        const cookieVal = readCookie('admin_token');
        if (!cookieVal) {
          token = null;
        } else if (cookieVal.includes('%')) {
          token = decodeURIComponent(cookieVal);
        } else {
          token = cookieVal;
        }
      } catch {
        token = null;
      }

      if (!token) {
        if (!cancelled) {
          setError('Admin auth token is missing');
          setLoading(false);
          const redirect = window.location.pathname + window.location.search;
          router.replace(`${getLoginHref()}?redirect=${encodeURIComponent(redirect)}`);
        }
        return;
      }

      try {
        const res = await fetch('/admin-api/admin/info', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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
