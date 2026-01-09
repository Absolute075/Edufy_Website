import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const tokenRaw = cookieStore.get('admin_token')?.value;

  const cookieHeader = request.headers.get('cookie') || '';

  // Preferred: role-based admin session via auth_service accessToken cookie.
  if (!tokenRaw) {
    if (!cookieHeader) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const requestOrigin = (() => {
      try {
        return new URL(request.url).origin;
      } catch {
        return '';
      }
    })();

    const candidates = [
      process.env.API_ORIGIN,
      process.env.NEXT_PUBLIC_API_ORIGIN,
      'http://127.0.0.1:8082',
      requestOrigin,
    ].filter((v): v is string => Boolean(v));

    for (const base of candidates) {
      try {
        const meUrl = new URL('/auth/me', base);
        const res = await fetch(meUrl, {
          headers: {
            cookie: cookieHeader,
            'x-edufy-middleware': '1',
            Accept: 'application/json',
          },
          cache: 'no-store',
        });

        if (res.status === 401) {
          return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }
        if (!res.ok) {
          continue;
        }

        const data: any = await res.json().catch(() => null);
        const role = String(data?.role ?? '').toUpperCase();
        if (role !== 'ADMIN') {
          return NextResponse.json({ error: 'forbidden' }, { status: 403 });
        }

        const admin = String(data?.username ?? data?.email ?? 'admin');
        return NextResponse.json({ admin, role: 'ADMIN', status: 'ok' }, { status: 200 });
      } catch {
        // try next candidate
      }
    }

    return NextResponse.json({ error: 'upstream_unreachable' }, { status: 502 });
  }

  if (!tokenRaw) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let token = tokenRaw;
  if (token.includes('%')) {
    try {
      token = decodeURIComponent(token);
    } catch {}
  }

  const requestOrigin = (() => {
    try {
      return new URL(request.url).origin;
    } catch {
      return '';
    }
  })();

  const candidates = [
    process.env.ADMIN_API_ORIGIN,
    'http://127.0.0.1:8090',
    requestOrigin,
  ].filter((v): v is string => Boolean(v));

  let res: Response | null = null;
  for (const base of candidates) {
    try {
      const infoUrl = new URL('/admin-api/admin/info', base);
      res = await fetch(infoUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-edufy-middleware': '1',
          Accept: 'application/json',
        },
        cache: 'no-store',
      });
      break;
    } catch {
      res = null;
    }
  }

  if (!res) {
    return NextResponse.json({ error: 'upstream_unreachable' }, { status: 502 });
  }

  if (res.status === 401 || res.status === 403) {
    return NextResponse.json({ error: 'unauthorized' }, { status: res.status });
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    return NextResponse.json({ error: 'invalid_upstream_response', details: text.slice(0, 500) }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
