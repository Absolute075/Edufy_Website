import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  void request;
  return NextResponse.json({ error: 'disabled' }, { status: 410 });
}
