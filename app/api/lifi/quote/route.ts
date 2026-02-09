import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://li.quest/v1';

function buildHeaders() {
  const headers: Record<string, string> = {};
  if (process.env.LIFI_API_KEY) {
    headers['x-lifi-api-key'] = process.env.LIFI_API_KEY;
  }
  return headers;
}

export async function GET(req: NextRequest) {
  try {
    const incomingUrl = new URL(req.url);
    const targetUrl = new URL(`${BASE_URL}/quote`);

    incomingUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value);
    });

    const res = await fetch(targetUrl.toString(), {
      headers: buildHeaders(),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[lifi/quote] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LI.FI quote' },
      { status: 500 }
    );
  }
}
