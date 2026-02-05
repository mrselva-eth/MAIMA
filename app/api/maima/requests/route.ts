/**
 * GET /api/maima/requests
 * Returns active requests for CRE workflows (maima, bridge, swap) to poll.
 */

import { NextResponse } from 'next/server';
import { maimaRequests } from '@/lib/maima-requests';

export async function GET() {
  try {
    const requests = Array.from(maimaRequests.values());
    return NextResponse.json({
      success: true,
      requests,
      count: requests.length,
    });
  } catch (error) {
    console.error('[maima/requests] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}
