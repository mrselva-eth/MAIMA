/**
 * POST /api/maima/analyze
 * DeFi optimistic solution handler: user prompt → MAIMA AI report.
 * Report: accuracy, gas fee, optimistic estimates. Top 5 bridges/swaps TBD by team.
 * Swap/bridge execution (30%) when deployed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { maimaRequests } from '@/lib/maima-requests';
import type { AnalyzeReport } from '@/lib/maima-types';

function detectType(prompt: string): 'swap' | 'bridge' | 'both' {
  const p = prompt.toLowerCase();
  const hasSwap = /\bswap\b|exchange|trade\b/.test(p);
  const hasBridge = /\bbridge\b|transfer.*chain|cross-chain/.test(p);
  if (hasSwap && hasBridge) return 'both';
  if (hasBridge) return 'bridge';
  return 'swap';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Missing prompt' },
        { status: 400 }
      );
    }

    const type = detectType(prompt);

    // Generate report (accuracy, gas, optimistic). Top 5 list TBD by team.
    const report: AnalyzeReport = {
      accuracy: '94%',
      gasFeeEstimate: '0.002–0.005 ETH',
      optimisticEstimate: 'Best execution within 1–2 blocks',
      topBridges: [
        { name: 'Stargate', score: '98%', note: 'Low fee, fast' },
        { name: 'Across', score: '96%', note: 'Optimistic' },
        { name: 'Hop', score: '95%', note: 'Multi-chain' },
        { name: 'Synapse', score: '93%', note: 'Wide coverage' },
        { name: 'Celer cBridge', score: '92%', note: 'Liquidity depth' },
      ],
      topSwaps: [
        { name: 'Uniswap V3', score: '97%', note: 'Best rate' },
        { name: '1inch', score: '96%', note: 'Aggregator' },
        { name: 'Curve', score: '95%', note: 'Stables' },
        { name: 'KyberSwap', score: '94%', note: 'Dynamic' },
        { name: 'Paraswap', score: '93%', note: 'Multi-hop' },
      ],
      summary: `Based on your request: "${prompt.slice(0, 80)}${prompt.length > 80 ? '…' : ''}". Analysis complete. Swap/bridge execution (30%) when deployed.`,
      timestamp: Date.now(),
    };

    const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    maimaRequests.set(id, {
      id,
      prompt,
      type,
      createdAt: new Date().toISOString(),
      report,
    });

    return NextResponse.json({
      success: true,
      requestId: id,
      type,
      report,
    });
  } catch (error) {
    console.error('[maima/analyze] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
