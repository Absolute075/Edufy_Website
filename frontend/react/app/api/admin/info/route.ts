import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const tokenRaw = cookieStore.get('admin_token')?.value;

  if (!tokenRaw) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let token = tokenRaw;
  if (token.includes('%')) {
    try {
      token = decodeURIComponent(token);
    } catch {}
  }

  const infoUrl = new URL('/admin-api/admin/info', request.url);

  let res: Response;
  try {
    res = await fetch(infoUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-edufy-middleware': '1',
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
  } catch {
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
