import { NextRequest, NextResponse } from 'next/server';
import { maimaRequests } from '@/lib/maima-requests';
import { triggerCreWorkflows } from '@/lib/cre-trigger';

function getRouteType(route: any): 'swap' | 'bridge' {
  const steps = Array.isArray(route?.steps) ? route.steps : [];
  const hasBridge = steps.some((step: any) => step?.type === 'cross');
  return hasBridge ? 'bridge' : 'swap';
}

function getMainTool(route: any, type: 'swap' | 'bridge'): string {
  const steps = Array.isArray(route?.steps) ? route.steps : [];
  const preferredType = type === 'bridge' ? 'cross' : 'swap';
  const match = steps.find((step: any) => step?.type === preferredType) ?? steps[0];
  return match?.tool ?? 'Unknown';
}

function scoreForIndex(index: number): string {
  const base = 98 - index * 2;
  return `${Math.max(90, base)}%`;
}

const ALLOWED_SWAP_PROTOCOLS = ['Uniswap V3', '1inch', 'Curve', 'KyberSwap', 'Paraswap'];
const SEPOLIA_CHAIN_ID = 11155111;

function normalizeProtocolName(name?: string) {
  return (name ?? '').trim().toLowerCase();
}

function parseGasFee(value?: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

type RouteSummary = {
  id?: string;
  type: 'swap' | 'bridge';
  mainTool: string;
  gasCostUSD?: string;
  fromAmount?: string;
  toAmount?: string;
  fromToken?: unknown;
  toToken?: unknown;
  steps?: unknown[];
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
    const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
    const BASE_CHAIN_ID = 8453;

    const providedFromAddress =
      body && typeof body === 'object' && 'fromAddress' in body && typeof body.fromAddress === 'string'
        ? body.fromAddress
        : '0x0000000000000000000000000000000000000000';

    const promptText =
      body && typeof body === 'object' && 'prompt' in body && typeof body.prompt === 'string'
        ? body.prompt.toLowerCase()
        : '';

    const isUsdcToEth = /usdc\s*(to|->)\s*eth/.test(promptText);
    const isEthToUsdc = /eth\s*(to|->)\s*usdc/.test(promptText);
    const isBridgeRequest = /bridge|cross[-\s]?chain|base\s*to\s*arbitrum|arbitrum\s*to\s*base/.test(
      promptText
    );

    const bridgeFromChainId = 8453;
    const bridgeToChainId = 42161;
    const swapChainId = BASE_CHAIN_ID;

    const fromTokenAddress = isUsdcToEth ? USDC_BASE : ETH_ADDRESS;
    const toTokenAddress = isUsdcToEth ? ETH_ADDRESS : USDC_BASE;
    const fromDecimals = isUsdcToEth ? 6 : 18;
    const defaultAmount = isUsdcToEth ? '100' : '1';

    const numberMatch = promptText.match(/\d+(\.\d+)?/);
    const amountInput = numberMatch?.[0] ?? defaultAmount;

    const scaleAmount = (amount: string, decimals: number) => {
      const [whole, frac = ''] = amount.split('.');
      const fracPadded = (frac + '0'.repeat(decimals)).slice(0, decimals);
      const normalized = `${whole}${fracPadded}`.replace(/^0+/, '') || '0';
      return normalized;
    };

    const fromAmount = scaleAmount(amountInput, fromDecimals);

    // Step 1: extract intent (temporary hardcoded fallback)
    // Later you can use AI parsing here.
    const fallbackPayload = {
      fromChainId: isBridgeRequest ? bridgeFromChainId : swapChainId,
      toChainId: isBridgeRequest ? bridgeToChainId : swapChainId,
      fromTokenAddress: isBridgeRequest ? ETH_ADDRESS : fromTokenAddress,
      toTokenAddress: isBridgeRequest ? ETH_ADDRESS : toTokenAddress,
      fromAmount,
      fromAddress: providedFromAddress,
      options: {
        allowSwitchChain: !isBridgeRequest,
      },
    };

    const payload =
      body &&
      typeof body === 'object' &&
      'fromChainId' in body &&
      'toChainId' in body &&
      'fromTokenAddress' in body &&
      'toTokenAddress' in body &&
      'fromAmount' in body &&
      'fromAddress' in body
        ? body
        : fallbackPayload;

    // Step 2: call LI.FI backend
    const origin = new URL(req.url).origin;
    const lifiRes = await fetch(`${origin}/api/maima/routing?action=quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const lifiData = await lifiRes.json();

    if (!lifiData.routes?.length) {
      return NextResponse.json({ error: 'No routes found' }, { status: 400 });
    }

    const routes = Array.isArray(lifiData.routes) ? lifiData.routes : [];
    const routeSummaries = routes.map((route: any) => {
      const type = getRouteType(route);
      return {
        id: route?.id,
        type,
        mainTool: getMainTool(route, type),
        gasCostUSD: route?.gasCostUSD ? String(route.gasCostUSD) : undefined,
        fromAmount: route?.fromAmount,
        toAmount: route?.toAmount,
        fromToken: route?.fromToken,
        toToken: route?.toToken,
        steps: route?.steps,
      };
    });

    const allowedSwapSet = new Set(ALLOWED_SWAP_PROTOCOLS.map(normalizeProtocolName));
    const enforceSwapWhitelist =
      typeof payload?.fromChainId === 'number' && payload.fromChainId === SEPOLIA_CHAIN_ID;
    const filteredRoutes = routeSummaries.filter((route: RouteSummary) => {
      if (route.type !== 'swap') return true;
      if (!enforceSwapWhitelist) return true;
      return allowedSwapSet.has(normalizeProtocolName(route.mainTool));
    });

    if (!filteredRoutes.length) {
      return NextResponse.json(
        { error: 'No allowed swap routes found for selected protocols.' },
        { status: 400 }
      );
    }

    const sortedRoutes = filteredRoutes
      .map((route: RouteSummary, index: number) => ({
        route,
        index,
        fee: parseGasFee(route.gasCostUSD),
      }))
      .sort(
        (
          a: { route: RouteSummary; index: number; fee: number | null },
          b: { route: RouteSummary; index: number; fee: number | null }
        ) => {
          const feeA = a.fee ?? Number.POSITIVE_INFINITY;
          const feeB = b.fee ?? Number.POSITIVE_INFINITY;
          if (feeA !== feeB) return feeA - feeB;
          return a.index - b.index;
        }
      )
      .map((entry: { route: RouteSummary; index: number; fee: number | null }) => entry.route);

    const bestRoute = sortedRoutes[0];

    const topSwaps = Array.from(
      new Set(sortedRoutes.filter((r: RouteSummary) => r.type === 'swap').map((r: RouteSummary) => r.mainTool))
    )
      .slice(0, 5)
      .map((name, i) => ({ name, score: scoreForIndex(i) }));

    const topBridges = Array.from(
      new Set(sortedRoutes.filter((r: RouteSummary) => r.type === 'bridge').map((r: RouteSummary) => r.mainTool))
    )
      .slice(0, 5)
      .map((name, i) => ({ name, score: scoreForIndex(i) }));

    const inferredTypeForReport = isBridgeRequest ? 'bridge' : 'swap';
    const fallbackTop = Array.from(new Set(sortedRoutes.map((r: RouteSummary) => r.mainTool)))
      .slice(0, 5)
      .map((name, i) => ({ name, score: scoreForIndex(i) }));

    const finalTopSwaps =
      inferredTypeForReport === 'swap' && topSwaps.length === 0 ? fallbackTop : topSwaps;
    const finalTopBridges =
      inferredTypeForReport === 'bridge' && topBridges.length === 0 ? fallbackTop : topBridges;

    const now = Date.now();
    const workflow = [
      {
        name: 'Intent parsed',
        status: 'ok' as const,
        details: isBridgeRequest ? 'Bridge request detected' : 'Swap request detected',
        timestamp: now,
      },
      {
        name: 'Quote requested',
        status: 'ok' as const,
        details: `Requested ${routes.length} route(s) from LI.FI`,
        timestamp: now + 50,
      },
      {
        name: 'Protocol validation',
        status: enforceSwapWhitelist ? 'ok' as const : 'warn' as const,
        details: enforceSwapWhitelist
          ? `Whitelist enforced (${ALLOWED_SWAP_PROTOCOLS.length} allowed)`
          : 'Whitelist not enforced on this chain',
        timestamp: now + 100,
      },
      {
        name: 'Ranking',
        status: 'ok' as const,
        details: 'Sorted by lowest gas fee (USD) first',
        timestamp: now + 150,
      },
      {
        name: 'Selection',
        status: bestRoute ? ('ok' as const) : ('error' as const),
        details: bestRoute ? `Selected ${bestRoute.mainTool}` : 'No valid route selected',
        timestamp: now + 200,
      },
    ];

    const ranking = sortedRoutes.slice(0, 10).map((route: RouteSummary, i: number) => {
      const feeUSD = parseGasFee(route.gasCostUSD);
      const isSelected = bestRoute?.id === route.id && bestRoute?.mainTool === route.mainTool;
      const reason = isSelected
        ? feeUSD !== null
          ? `Lowest gas fee ($${route.gasCostUSD})`
          : 'Best available route by lowest fee'
        : feeUSD !== null
          ? `Higher gas fee than ranked protocols ($${route.gasCostUSD})`
          : 'Fee not available';
      return {
        protocol: route.mainTool,
        feeUSD,
        rank: i + 1,
        reason,
        isSelected,
      };
    });

    const selectionReason = bestRoute?.gasCostUSD
      ? `Lowest gas fee: $${bestRoute.gasCostUSD}`
      : 'Lowest available fee among valid routes';

    // Step 3: build report for frontend
    const report = {
      accuracy: 'Live (LI.FI)',
      gasFeeEstimate: bestRoute?.gasCostUSD ? `$${bestRoute.gasCostUSD}` : 'N/A',
      optimisticEstimate: `Estimated ${bestRoute?.steps?.length ?? 0} steps`,
      topBridges: finalTopBridges,
      topSwaps: finalTopSwaps,
      summary: bestRoute ? `Best route via ${bestRoute.mainTool}` : 'No route found',
      timestamp: Date.now(),
      routes: sortedRoutes,
      bestRoute,
      rawRoute: routes[0],
      workflow,
      ranking,
      selectionReason,
      intentType: inferredTypeForReport,
      ...(process.env.CRE_SIMULATION_MODE === 'on' ? { simulationMode: true } : {}),
    };

    // When CRE simulation mode is on: register request and trigger CRE workflows (cre-maima + cre-swap or cre-bridge)
    const creSimulationMode = process.env.CRE_SIMULATION_MODE === 'on';
    if (creSimulationMode) {
      const requestId = `maima_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      maimaRequests.set(requestId, {
        id: requestId,
        prompt: body?.prompt ?? '',
        type: inferredTypeForReport === 'bridge' ? 'bridge' : 'swap',
        createdAt: new Date().toISOString(),
        report,
      });
      triggerCreWorkflows(inferredTypeForReport);
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Analyze failed' }, { status: 500 });
  }
}
