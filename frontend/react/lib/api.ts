export async function api(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const opts: RequestInit = { credentials: 'include', ...init };
  if (init && init.headers) {
    opts.headers = init.headers;
  }

  let res = await fetch(input, opts);

  if (res && res.status === 401) {
    try {
      const r = await fetch('/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      if (r.ok) {
        res = await fetch(input, opts);
        if (res.status !== 401) {
          return res;
        }
      }
    } catch {}

    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('postLoginRedirect', window.location.href);
        const w = window as any;
        if (typeof w.__onSessionExpired === 'function') {
          w.__onSessionExpired();
        }
      }
    } catch {}

    throw new Error('Unauthorized');
  }

  return res;
}
