/**
 * GET /api/intents/active
 * Returns all active/validated intents for CRE Monitor workflow to poll.
 * No address required (used by CRE).
 */

import { NextResponse } from 'next/server';
import { intentStorage } from '@/lib/intent-storage';

export async function GET() {
  try {
    const intents = Array.from(intentStorage.values()).filter(
      (i) => i.status === 'validated' || i.status === 'active'
    );
    return NextResponse.json({
      success: true,
      intents,
      count: intents.length,
    });
  } catch (error) {
    console.log('[intents/active] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch active intents' },
      { status: 500 }
    );
  }
}
