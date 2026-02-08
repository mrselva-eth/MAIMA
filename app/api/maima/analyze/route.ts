export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import {
  createConfig,
  getRoutes,
  type RoutesRequest,
} from '@lifi/sdk'

// ==================================================
// LI.FI CONFIG
// ==================================================
createConfig({
  integrator: 'terminal-intent-demo',
  apiKey: process.env.LIFI_API_KEY as string,
})

// ==================================================
// CONSTANTS
// ==================================================
const CHAINS = {
  BASE: 8453,
  ARBITRUM: 42161,
} as const

const TOKENS = {
  ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  BASE_USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
} as const

type AnalyzeReport = {
  topBridges: {
    name: string
    routeId: string
    score: number
  }[]
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.LIFI_API_KEY) {
      throw new Error('LIFI_API_KEY missing')
    }

    let body: any = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const intent: '1' | '2' | '3' | '4' | undefined = body?.intent

    if (!intent) {
      return NextResponse.json(
        { success: false, error: 'Intent missing' },
        { status: 400 }
      )
    }

    let routeParams: RoutesRequest

    switch (intent) {
      case '1': // ETH → USDC (Base)
        routeParams = {
          fromChainId: CHAINS.BASE,
          toChainId: CHAINS.BASE,
          fromTokenAddress: TOKENS.ETH,
          toTokenAddress: TOKENS.BASE_USDC,
          fromAmount: '100000000000000000',
        }
        break

      case '2': // USDC → ETH (Base)
        routeParams = {
          fromChainId: CHAINS.BASE,
          toChainId: CHAINS.BASE,
          fromTokenAddress: TOKENS.BASE_USDC,
          toTokenAddress: TOKENS.ETH,
          fromAmount: '1000000',
        }
        break

      case '3': // Base → Arbitrum
        routeParams = {
          fromChainId: CHAINS.BASE,
          toChainId: CHAINS.ARBITRUM,
          fromTokenAddress: TOKENS.ETH,
          toTokenAddress: TOKENS.ETH,
          fromAmount: '100000000000000000',
        }
        break

      case '4': // Arbitrum → Base
        routeParams = {
          fromChainId: CHAINS.ARBITRUM,
          toChainId: CHAINS.BASE,
          fromTokenAddress: TOKENS.ETH,
          toTokenAddress: TOKENS.ETH,
          fromAmount: '100000000000000000',
        }
        break

      default:
        throw new Error('Invalid intent')
    }

    const result = await getRoutes({
      ...routeParams,
      options: {
        slippage: 0.5,
        order: 'RECOMMENDED',
      },
    })

    const routes = result.routes.slice(0, 3)

    const topBridges = routes.map((route) => {
      const totalTime = route.steps.reduce(
        (sum, step) =>
          sum + (step.estimate.executionDuration ?? 0),
        0
      )

      const score = Math.max(
        1,
        Math.round(
          1000 / (totalTime + Number(route.gasCostUSD ?? 1))
        )
      )

      return {
        name: route.steps.map((s) => s.tool).join(' → '),
        routeId: route.id,
        score,
      }
    })

    return NextResponse.json({
      success: true,
      report: { topBridges },
    })
  } catch (err: any) {
    console.error('ANALYZE ERROR:', err.message)

    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}
