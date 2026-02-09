/**
 * Multisig Management API
 * 
 * GET    /api/multisig/[id]/status  - Get approval status
 * POST   /api/multisig/[id]/approve - Sign transaction
 * POST   /api/multisig/[id]/reject  - Reject transaction
 */

import { NextRequest, NextResponse } from 'next/server'

// Mock multisig data
const multisigDB: Record<string, any> = {
  'intent_001': {
    intentId: 'intent_001',
    status: 'pending',
    threshold: 2,
    signers: [
      { address: '0x1111111111111111111111111111111111111111', approved: true, timestamp: Date.now() - 300000 },
      { address: '0x2222222222222222222222222222222222222222', approved: false, timestamp: null },
      { address: '0x3333333333333333333333333333333333333333', approved: false, timestamp: null }
    ],
    createdAt: Date.now() - 600000,
    expiresAt: Date.now() + 3600000
  }
}

/**
 * GET /api/multisig/[id]/status
 */
export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url)
  const intentId = pathname.split('/')[3]

  try {
    const multisig = multisigDB[intentId]

    if (!multisig) {
      return NextResponse.json(
        { success: false, error: 'Multisig not found' },
        { status: 404 }
      )
    }

    const approved = multisig.signers.filter((s: any) => s.approved).length
    const remaining = multisig.threshold - approved

    return NextResponse.json({
      success: true,
      data: {
        intentId: multisig.intentId,
        threshold: multisig.threshold,
        approved,
        remaining,
        isApproved: approved >= multisig.threshold,
        signers: multisig.signers.map((s: any) => ({
          address: s.address,
          approved: s.approved,
          timestamp: s.timestamp
        })),
        createdAt: multisig.createdAt,
        expiresAt: multisig.expiresAt
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch multisig status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/multisig/[id]/approve
 */
export async function POST(request: NextRequest) {
  const { pathname } = new URL(request.url)
  const intentId = pathname.split('/')[3]
  const action = pathname.split('/')[4]

  try {
    const multisig = multisigDB[intentId]

    if (!multisig) {
      return NextResponse.json(
        { success: false, error: 'Multisig not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { signer } = body

    if (!signer) {
      return NextResponse.json(
        { success: false, error: 'Signer address required' },
        { status: 400 }
      )
    }

    // Find signer
    const signerObj = multisig.signers.find((s: any) => s.address.toLowerCase() === signer.toLowerCase())

    if (!signerObj) {
      return NextResponse.json(
        { success: false, error: 'Signer not found' },
        { status: 404 }
      )
    }

    if (action === 'approve') {
      if (signerObj.approved) {
        return NextResponse.json(
          { success: false, error: 'Already approved' },
          { status: 400 }
        )
      }

      signerObj.approved = true
      signerObj.timestamp = Date.now()

      // Check if threshold met
      const approvedCount = multisig.signers.filter((s: any) => s.approved).length
      if (approvedCount >= multisig.threshold) {
        multisig.status = 'approved'

        // Trigger executor workflow
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/workflows/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intentId, type: 'multisig_approved' })
        }).catch(err => console.error('Executor trigger failed:', err))
      }

      return NextResponse.json({
        success: true,
        message: 'Intent approved',
        data: {
          intentId: multisig.intentId,
          approved: approvedCount,
          threshold: multisig.threshold,
          isReady: approvedCount >= multisig.threshold
        }
      })
    }

    // Reject
    if (action === 'reject') {
      multisig.status = 'rejected'
      return NextResponse.json({
        success: true,
        message: 'Intent rejected'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process multisig action' },
      { status: 500 }
    )
  }
}
