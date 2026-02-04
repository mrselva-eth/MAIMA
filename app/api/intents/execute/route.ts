/**
 * POST /api/intents/execute
 * Executes a single intent (swap / stake / bridge).
 * Called by CRE workflow when an active intent is ready.
 * - Swap: uses Uniswap quote + build tx (simulation; in prod relayer would submit).
 * - Stake / Bridge: stubbed for your features; wire to real protocols when ready.
 */

import { NextRequest, NextResponse } from 'next/server';
import { intentStorage, type StoredIntent } from '@/lib/intent-storage';
import { getSwapQuote, buildSwapTransaction } from '@/lib/uniswap';

function isExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const intentId = body?.intentId ?? body?.id;

    if (!intentId || typeof intentId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing intentId' },
        { status: 400 }
      );
    }

    const raw = intentStorage.get(intentId);
    if (!raw) {
      return NextResponse.json(
        { success: false, error: 'Intent not found' },
        { status: 404 }
      );
    }

    const intent = raw;

    if (intent.status === 'executed') {
      return NextResponse.json({
        success: true,
        alreadyExecuted: true,
        intentId,
        type: intent.type,
      });
    }

    if (intent.status !== 'active' && intent.status !== 'validated') {
      return NextResponse.json(
        { success: false, error: `Intent not executable (status: ${intent.status})` },
        { status: 400 }
      );
    }

    if (isExpired(intent.expiresAt)) {
      intent.status = 'expired';
      return NextResponse.json(
        { success: false, error: 'Intent expired', intentId },
        { status: 400 }
      );
    }

    let result: { type: string; txData?: unknown; quote?: unknown; message: string };

    switch (intent.type) {
      case 'swap': {
        const tokenIn = (intent.tokenIn as string) || 'USDC';
        const tokenOut = (intent.tokenOut as string) || 'ETH';
        const amount = (intent.amount as string) || '0';
        const slippage = typeof intent.slippage === 'number' ? intent.slippage : 0.5;
        const wallet = (intent.walletAddress as string) || '';

        const quote = await getSwapQuote(tokenIn, tokenOut, amount);
        const txData = await buildSwapTransaction(
          tokenIn,
          tokenOut,
          amount,
          wallet,
          slippage
        );

        result = {
          type: 'swap',
          quote: quote
            ? {
                tokenIn: quote.tokenIn.symbol,
                tokenOut: quote.tokenOut.symbol,
                amountIn: quote.amountIn,
                amountOut: quote.amountOut,
              }
            : null,
          txData: txData ?? null,
          message: quote
            ? `Swap ${amount} ${tokenIn} → ${tokenOut} (best rate). In production, relayer submits tx.`
            : 'Quote/build placeholder; wire Uniswap SmartOrderRouter for live execution.',
        };
        break;
      }

      case 'stake': {
        const token = (intent.token as string) || 'SOL';
        const amount = (intent.amount as string) || '0';
        const protocol = (intent.protocol as string) || '';

        result = {
          type: 'stake',
          message: `Stake ${amount} ${token}${protocol ? ` via ${protocol}` : ''} (monthly if balance > $1000). Wire to staking protocol.`,
        };
        break;
      }

      case 'bridge': {
        const token = (intent.token as string) || 'USDT';
        const amount = (intent.amount as string) || '0';
        const fromChain = (intent.fromChain as string) || 'Ethereum';
        const toChain = (intent.toChain as string) || 'Arbitrum';

        result = {
          type: 'bridge',
          message: `Bridge ${amount} ${token} from ${fromChain} to ${toChain}. Wire to bridge API (e.g. LI.FI, Socket).`,
        };
        break;
      }

      default: {
        const intentType = (intent as StoredIntent).type;
        return NextResponse.json(
          { success: false, error: `Unsupported intent type: ${intentType}` },
          { status: 400 }
        );
      }
    }

    intent.status = 'executed';
    intent.executedAt = new Date().toISOString();
    intent.executionResult = result;
    intentStorage.set(intentId, intent);

    return NextResponse.json({
      success: true,
      intentId,
      ...result,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[intents/execute] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Execution failed' },
      { status: 500 }
    );
  }
}
