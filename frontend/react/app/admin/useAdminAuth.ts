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
        if (!cancelled) {
          setError('Admin auth token is missing');
          setLoading(false);
          router.replace('/admin/login');
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
          try {
            localStorage.removeItem('admin_token');
          } catch {}
          if (!cancelled) {
            setError('Admin auth required');
            setLoading(false);
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
  }, []);

  return { info, loading, error };
}
