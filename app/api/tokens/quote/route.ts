import { NextRequest, NextResponse } from 'next/server';
import { getSwapQuote } from '@/lib/uniswap';

/**
 * GET /api/tokens/quote
 * Get swap quote for token pair
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenIn = searchParams.get('tokenIn');
    const tokenOut = searchParams.get('tokenOut');
    const amount = searchParams.get('amount');

    if (!tokenIn || !tokenOut || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing parameters: tokenIn, tokenOut, amount',
        },
        { status: 400 }
      );
    }

    const quote = await getSwapQuote(tokenIn, tokenOut, amount);

    if (!quote) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to get quote',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      quote,
    });
  } catch (error) {
    console.log('[v0] Quote API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get swap quote',
      },
      { status: 500 }
    );
  }
}
