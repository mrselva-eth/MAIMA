/**
 * /api/maima/routing
 * Single route for LI.FI proxy actions:
 *   POST ?action=quote  -> LI.FI advanced/routes
 *   POST ?action=step  -> LI.FI advanced/stepTransaction
 *   GET  ?action=status -> LI.FI status (query: txHash, fromChain?, toChain?, bridge?)
 */

import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://li.quest/v1';

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (process.env.LIFI_API_KEY) {
    headers['x-lifi-api-key'] = process.env.LIFI_API_KEY;
  }
  return headers;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action !== 'status') {
    return NextResponse.json(
      { error: 'Missing or invalid action. Use ?action=status' },
      { status: 400 }
    );
  }

  const txHash = searchParams.get('txHash');
  if (!txHash) {
    return NextResponse.json({ error: 'txHash is required' }, { status: 400 });
  }

  try {
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
    console.error('[maima/routing] GET status Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LI.FI status' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action !== 'quote' && action !== 'step') {
    return NextResponse.json(
      { error: 'Missing or invalid action. Use ?action=quote or ?action=step' },
      { status: 400 }
    );
  }

  try {
    const payload = await req.json();
    const path = action === 'quote' ? 'advanced/routes' : 'advanced/stepTransaction';
    const res = await fetch(`${BASE_URL}/${path}`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error(`[maima/routing] POST ${action} Error:`, error);
    return NextResponse.json(
      { error: action === 'quote' ? 'Failed to fetch LI.FI routes' : 'Failed to fetch LI.FI step transaction' },
      { status: 500 }
    );
  }
}
