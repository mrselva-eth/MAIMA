import { NextRequest, NextResponse } from 'next/server';
import { Intent } from '@/lib/types';
import { intentStorage } from '@/lib/intent-storage';

/**
 * GET /api/intents - Retrieve user's intents
 * Requires address parameter
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const status = searchParams.get('status');

    if (!address) {
      return NextResponse.json(
        { error: 'Missing address parameter' },
        { status: 400 }
      );
    }

    // Filter intents for this address
    let userIntents = Array.from(intentStorage.values()).filter(
      (intent) => intent.walletAddress === address
    );

    // Filter by status if provided
    if (status) {
      userIntents = userIntents.filter((intent) => intent.status === status);
    }

    return NextResponse.json({
      success: true,
      intents: userIntents,
      count: userIntents.length,
    });
  } catch (error) {
    console.log('[v0] GET intents error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch intents' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/intents - Create new intent
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as any;
    const {
      type,
      description,
      walletAddress,
      constraints,
      tokenIn,
      tokenOut,
      amount,
    } = body;

    if (!type || !description || !walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const intentId = `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newIntent: any = {
      id: intentId,
      type,
      description,
      walletAddress,
      status: 'validated',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      constraints: constraints || [],
    };

    if (type === 'swap') {
      newIntent.tokenIn = tokenIn;
      newIntent.tokenOut = tokenOut;
      newIntent.amount = amount;
    }

    // Store intent in memory
    intentStorage.set(intentId, newIntent);

    console.log('[v0] Intent created:', intentId, 'for', walletAddress);

    // Notify CRE workflow (monitor) that a new intent exists
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/workflows/trigger`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflowType: 'monitor',
            intentId,
            data: { type, walletAddress },
          }),
        }
      );
    } catch (err) {
      console.log('[intents] Workflow trigger failed:', err);
    }

    return NextResponse.json(
      {
        success: true,
        intent: newIntent,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log('[v0] POST intents error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create intent' },
      { status: 500 }
    );
  }
}
