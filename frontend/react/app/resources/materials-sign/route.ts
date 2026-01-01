import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rel = url.searchParams.get('rel') || '';

  if (!rel.trim()) {
    return NextResponse.json({ error: 'missing_rel' }, { status: 400 });
  }

  const requestOrigin = (() => {
    try {
      return new URL(request.url).origin;
    } catch {
      return '';
    }
  })();

  const candidates = [
    'http://127.0.0.1:8084',
    'http://127.0.0.1:8082',
    process.env.MATERIALS_API_ORIGIN,
    process.env.API_ORIGIN,
    process.env.NEXT_PUBLIC_API_ORIGIN,
    requestOrigin,
  ].filter((v): v is string => Boolean(v));

  const cookie = request.headers.get('cookie') || '';
  let lastError = '';

  for (const base of candidates) {
    try {
      const upstream = new URL('/materials/sign', base);
      upstream.searchParams.set('rel', rel);

      const res = await fetch(upstream, {
        method: 'GET',
        headers: {
          Cookie: cookie,
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (res.status === 401 || res.status === 403) {
        const isLocal = base.startsWith('http://127.0.0.1') || base.startsWith('http://localhost');
        if (isLocal) {
          return NextResponse.json(
            { error: res.status === 401 ? 'unauthorized' : 'forbidden' },
            {
              status: res.status,
              headers: {
                'Cache-Control': 'no-store',
              },
            },
          );
        }
        lastError = `upstream_${res.status}`;
        continue;
      }

      const contentType = res.headers.get('content-type') || '';
      const text = await res.text().catch(() => '');

      if (!contentType.includes('application/json')) {
        lastError = `invalid_upstream_response:${res.status}`;
        continue;
      }

      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        lastError = `invalid_upstream_json:${res.status}`;
        continue;
      }

      return NextResponse.json(data, {
        status: res.status,
        headers: {
          'Cache-Control': 'no-store',
        },
      });
    } catch (err: any) {
      lastError = String(err?.message ?? err ?? 'fetch_failed').slice(0, 200);
    }
  }

  return NextResponse.json({ error: 'upstream_unreachable', details: lastError }, { status: 502 });
}
