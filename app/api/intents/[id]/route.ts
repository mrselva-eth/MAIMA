/**
 * Intent Detail API
 * GET    /api/intents/[id] - Get intent details
 * PATCH  /api/intents/[id] - Update intent status/conditions
 * DELETE /api/intents/[id] - Cancel intent
 * Uses shared intent storage (same as list/create).
 */

import { NextRequest, NextResponse } from 'next/server';
import { intentStorage } from '@/lib/intent-storage';

type RouteParams = { params: Promise<{ id: string }> };

function getIntent(id: string) {
  return intentStorage.get(id) ?? null;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const intent = getIntent(id);

    if (!intent) {
      return NextResponse.json(
        { success: false, error: 'Intent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: intent,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch intent' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const intent = getIntent(id);

    if (!intent) {
      return NextResponse.json(
        { success: false, error: 'Intent not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status, conditions, expiresAt } = body;

    if (status) intent.status = status;
    if (conditions) intent.constraints = [...(intent.constraints || []), ...(Array.isArray(conditions) ? conditions : [conditions])];
    if (expiresAt) intent.expiresAt = expiresAt;

    return NextResponse.json({
      success: true,
      data: intent,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update intent' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const intent = getIntent(id);

    if (!intent) {
      return NextResponse.json(
        { success: false, error: 'Intent not found' },
        { status: 404 }
      );
    }

    intent.status = 'revoked';
    (intent as Record<string, unknown>).revokedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      message: 'Intent cancelled',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to cancel intent' },
      { status: 500 }
    );
  }
}
