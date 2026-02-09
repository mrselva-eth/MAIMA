import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://li.quest/v1';

function buildHeaders() {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (process.env.LIFI_API_KEY) {
    headers['x-lifi-api-key'] = process.env.LIFI_API_KEY;
  }
  return headers;
}

/**
 * POST /api/maima/tokens/step-transaction
 * Proxy to LI.FI stepTransaction for a selected Step.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const res = await fetch(`${BASE_URL}/advanced/stepTransaction`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[maima/tokens/step-transaction] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LI.FI step transaction' },
      { status: 500 }
    );
  }
}
