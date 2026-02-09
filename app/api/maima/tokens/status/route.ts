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
 * GET /api/maima/tokens/status?txHash=...&fromChain=...&toChain=...&bridge=...
 * Proxy to LI.FI status endpoint to retrieve final amounts.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const txHash = searchParams.get('txHash');

    if (!txHash) {
      return NextResponse.json({ error: 'txHash is required' }, { status: 400 });
    }

    const params = new URLSearchParams({ txHash });
    const fromChain = searchParams.get('fromChain');
    const toChain = searchParams.get('toChain');
    const bridge = searchParams.get('bridge');

    if (fromChain) params.set('fromChain', fromChain);
    if (toChain) params.set('toChain', toChain);
    if (bridge) params.set('bridge', bridge);

    const res = await fetch(`${BASE_URL}/status?${params.toString()}`, {
      method: 'GET',
      headers: buildHeaders(),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[maima/tokens/status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LI.FI status' },
      { status: 500 }
    );
  }
}
