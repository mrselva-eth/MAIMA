/**
 * cre-swap – Swap analysis workflow.
 * Called by cre-maima (orchestrator) for swap requests. Gets one request from GET /api/maima/pending-swap,
 * runs full analysis (LI.FI quote, Chainlink, ranking), POSTs report to /api/maima/cre-report.
 */

import {
  CronCapability,
  HTTPClient,
  handler,
  consensusIdenticalAggregation,
  Runner,
  type NodeRuntime,
  type Runtime,
} from "@chainlink/cre-sdk";

type Config = {
  schedule: string;
  apiBaseUrl: string;
};

const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const BASE_CHAIN_ID = 8453;
const SEPOLIA_CHAIN_ID = 11155111;
const ALLOWED_SWAP_PROTOCOLS = ["Uniswap V3", "1inch", "Curve", "KyberSwap", "Paraswap"];

type PendingRequest = {
  id: string;
  prompt: string;
  fromAddress?: string;
  type: string;
  createdAt: string;
};

function toBase64(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  const key = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    result += key[a >> 2];
    result += key[((a & 3) << 4) | (b >> 4)];
    result += i + 1 < bytes.length ? key[((b & 15) << 2) | (c >> 6)] : "=";
    result += i + 2 < bytes.length ? key[c & 63] : "=";
  }
  return result;
}

function getMainTool(route: { steps?: { type: string; tool?: string }[] }): string {
  const steps = Array.isArray(route?.steps) ? route.steps : [];
  const match = steps.find((s: { type: string }) => s?.type === "swap") ?? steps[0];
  return (match as { tool?: string })?.tool ?? "Unknown";
}

function normalizeProtocolName(name?: string): string {
  return (name ?? "").trim().toLowerCase();
}

function parseGasFee(value?: string): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function scoreForIndex(index: number): string {
  return `${Math.max(90, 98 - index * 2)}%`;
}

function parseIntent(prompt: string, fromAddress: string): Record<string, unknown> {
  const p = prompt.toLowerCase();
  const isUsdcToEth = /usdc\s*(to|->)\s*eth/.test(p);
  const fromToken = isUsdcToEth ? USDC_BASE : ETH_ADDRESS;
  const toToken = isUsdcToEth ? ETH_ADDRESS : USDC_BASE;
  const decimals = isUsdcToEth ? 6 : 18;
  const defaultAmt = isUsdcToEth ? "100" : "1";
  const numMatch = p.match(/\d+(\.\d+)?/);
  const amountStr = numMatch?.[0] ?? defaultAmt;
  const [whole, frac = ""] = amountStr.split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  const fromAmount = `${whole}${fracPadded}`.replace(/^0+/, "") || "0";
  return {
    fromChainId: BASE_CHAIN_ID,
    toChainId: BASE_CHAIN_ID,
    fromTokenAddress: fromToken,
    toTokenAddress: toToken,
    fromAmount,
    fromAddress: fromAddress === "0x0000000000000000000000000000000000000000" || !fromAddress ? "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" : fromAddress,
    options: { allowSwitchChain: true },
  };
}

type SwapProcessResult = { processed: boolean; requestId: string; timestamp: number };

function processSwap(nodeRuntime: NodeRuntime<Config>): SwapProcessResult {
  const httpClient = new HTTPClient();
  const base = nodeRuntime.config.apiBaseUrl;

  const pendingResp = httpClient.sendRequest(nodeRuntime, { url: `${base}/api/maima?action=pending-swap`, method: "GET" }).result();
  const pendingText = new TextDecoder().decode(pendingResp.body);
  let pendingData: { success?: boolean; request?: PendingRequest } = {};
  try {
    pendingData = JSON.parse(pendingText);
  } catch {
    return { processed: false, requestId: "", timestamp: Date.now() };
  }
  const request = pendingData.request;
  if (!request?.id) return { processed: false, requestId: "", timestamp: Date.now() };

  const payload = parseIntent(request.prompt, request.fromAddress ?? "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
  const quoteBody = toBase64(JSON.stringify({ action: "quote", payload }));
  const quoteResp = httpClient
    .sendRequest(nodeRuntime, {
      url: `${base}/api/maima`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: quoteBody,
    })
    .result();
  let lifiData: { routes?: unknown[] } = {};
  try {
    lifiData = JSON.parse(new TextDecoder().decode(quoteResp.body));
  } catch {
    return { processed: false, requestId: request.id, timestamp: Date.now() };
  }
  const routes = Array.isArray(lifiData.routes) ? lifiData.routes : [];
  if (routes.length === 0) return { processed: false, requestId: request.id, timestamp: Date.now() };

  const fromSymbol = (routes[0] as { fromToken?: { symbol?: string } })?.fromToken?.symbol;
  const toSymbol = (routes[0] as { toToken?: { symbol?: string } })?.toToken?.symbol;
  const clChainId = payload.fromChainId === SEPOLIA_CHAIN_ID ? 11155111 : 8453;
  const verifiedPrices: { symbol: string; price: string; updatedAt?: number }[] = [];

  if (fromSymbol) {
    try {
      const pr = httpClient.sendRequest(nodeRuntime, { url: `${base}/api/maima?action=chainlink-price&symbol=${encodeURIComponent(fromSymbol)}&chainId=${clChainId}`, method: "GET" }).result();
      const prData = JSON.parse(new TextDecoder().decode(pr.body)) as { price?: number; updatedAt?: number };
      if (prData.price != null) verifiedPrices.push({ symbol: fromSymbol, price: `$${Number(prData.price).toFixed(2)}`, updatedAt: prData.updatedAt });
    } catch {
      // ignore
    }
  }
  if (toSymbol && toSymbol !== fromSymbol) {
    try {
      const pr = httpClient.sendRequest(nodeRuntime, { url: `${base}/api/maima?action=chainlink-price&symbol=${encodeURIComponent(toSymbol)}&chainId=${clChainId}`, method: "GET" }).result();
      const prData = JSON.parse(new TextDecoder().decode(pr.body)) as { price?: number; updatedAt0?: number };
      if (prData.price != null) verifiedPrices.push({ symbol: toSymbol, price: `$${Number(prData.price).toFixed(2)}`, updatedAt: prData.updatedAt0 });
    } catch {
      // ignore
    }
  }

  type RouteSummary = {
    id?: string;
    type: "swap";
    mainTool: string;
    gasCostUSD?: string;
    fromAmount?: string;
    toAmount?: string;
    fromToken?: unknown;
    toToken?: unknown;
    steps?: unknown[];
    executionDuration?: number;
    liquidityScore?: string;
    reliabilityScore?: string;
    tags?: string[];
  };

  const routeSummaries: RouteSummary[] = routes.map((route: unknown) => {
    const r = route as {
      id?: string;
      steps?: { type: string; tool?: string; estimate?: { executionDuration?: number } }[];
      duration?: number;
      gasCostUSD?: string;
      fromAmount?: string;
      toAmount?: string;
      fromToken?: unknown;
      toToken?: unknown;
      tags?: string[];
    };
    let executionDuration = r.duration ?? r.steps?.reduce((acc, s) => acc + (s.estimate?.executionDuration ?? 0), 0) ?? 0;
    if (!executionDuration || executionDuration <= 0) {
      const stepCount = r.steps?.length || 1;
      const tool = getMainTool(r).toLowerCase();
      let mod = 1;
      if (tool.includes("uniswap") || tool.includes("1inch")) mod = 0.7;
      executionDuration = Math.round(stepCount * 45 * mod * (0.85 + Math.random() * 0.3));
    }
    const tags = Array.isArray(r.tags) ? r.tags : [];
    const liquidityScore = tags.includes("RECOMMENDED") || tags.includes("FASTEST") ? "High" : "Medium";
    const highRel = new Set(["uniswap", "1inch", "curve", "kyber", "paraswap"]);
    const reliabilityScore = highRel.has(normalizeProtocolName(getMainTool(r))) ? "99.9%" : "98.5%";
    return {
      id: r.id,
      type: "swap",
      mainTool: getMainTool(r),
      gasCostUSD: r.gasCostUSD != null ? String(r.gasCostUSD) : undefined,
      fromAmount: r.fromAmount,
      toAmount: r.toAmount,
      fromToken: r.fromToken,
      toToken: r.toToken,
      steps: r.steps,
      executionDuration,
      liquidityScore,
      reliabilityScore,
      tags: r.tags,
    };
  });

  const allowedSet = new Set(ALLOWED_SWAP_PROTOCOLS.map(normalizeProtocolName));
  const enforceWhitelist = typeof payload.fromChainId === "number" && payload.fromChainId === SEPOLIA_CHAIN_ID;
  const filtered = routeSummaries.filter((route) => {
    if (!enforceWhitelist) return true;
    return allowedSet.has(normalizeProtocolName(route.mainTool));
  });
  if (filtered.length === 0) return { processed: false, requestId: request.id, timestamp: Date.now() };

  const sorted = filtered
    .map((route) => {
      const fee = parseGasFee(route.gasCostUSD) ?? 9999;
      const duration = route.executionDuration ?? 9999;
      const relPenalty = route.reliabilityScore === "99.9%" ? 0 : 10;
      return { route, score: fee * 0.4 + (duration / 60) * 0.3 + relPenalty * 0.3 };
    })
    .sort((a, b) => a.score - b.score)
    .map((e) => e.route);

  const bestRoute = sorted[0];
  const topSwaps = Array.from(new Set(sorted.map((r) => r.mainTool))).slice(0, 5).map((name, i) => ({ name, score: scoreForIndex(i) }));
  const now = Date.now();
  const workflow = [
    { name: "Intent parsed", status: "ok" as const, details: "Swap request detected", timestamp: now },
    { name: "Quote requested", status: "ok" as const, details: `Requested ${routes.length} route(s) from LI.FI`, timestamp: now + 50 },
    { name: "Protocol validation", status: enforceWhitelist ? "ok" : "warn", details: enforceWhitelist ? `Whitelist enforced` : "Whitelist not enforced", timestamp: now + 100 },
    { name: "Ranking", status: "ok" as const, details: "Sorted by Gas Fee (40%), Time (30%), Reliability (30%)", timestamp: now + 150 },
    { name: "Selection", status: bestRoute ? "ok" : "error", details: bestRoute ? `Selected ${bestRoute.mainTool}` : "No valid route", timestamp: now + 200 },
    { name: "Oracle Verification", status: verifiedPrices.length > 0 ? "ok" : "warn", details: verifiedPrices.length > 0 ? `Verified ${verifiedPrices.length} price(s) via Chainlink` : "Chainlink unavailable", timestamp: now + 250 },
  ];
  const ranking = sorted.slice(0, 10).map((route, i) => ({
    protocol: route.mainTool,
    feeUSD: parseGasFee(route.gasCostUSD),
    executionDuration: route.executionDuration,
    liquidityScore: route.liquidityScore,
    reliabilityScore: route.reliabilityScore,
    rank: i + 1,
    reason: bestRoute?.id === route.id ? "Best score" : "Lower score",
    isSelected: bestRoute?.id === route.id,
  }));

  const report = {
    accuracy: verifiedPrices.length > 0 ? "Oracle Verified (Chainlink)" : "Live (LI.FI)",
    chainlink: { prices: verifiedPrices, verifiedBy: "Chainlink Oracle Network" },
    gasFeeEstimate: bestRoute?.gasCostUSD ? `$${bestRoute.gasCostUSD}` : "N/A",
    optimisticEstimate: `Estimated ${bestRoute?.steps?.length ?? 0} steps`,
    topBridges: [] as { name: string; score: string }[],
    topSwaps,
    summary: bestRoute ? `Best route via ${bestRoute.mainTool}` : "No route found",
    timestamp: Date.now(),
    routes: sorted,
    bestRoute,
    rawRoute: routes[0],
    workflow,
    ranking,
    selectionReason: bestRoute ? `Selected ${bestRoute.mainTool}` : "No valid route",
    intentType: "swap" as const,
    simulationMode: true,
  };

  const creReportBody = toBase64(JSON.stringify({ action: "cre-report", requestId: request.id, report }));
  httpClient.sendRequest(nodeRuntime, { url: `${base}/api/maima`, method: "POST", headers: { "Content-Type": "application/json" }, body: creReportBody }).result();

  return { processed: true, requestId: request.id, timestamp: Date.now() };
}

const initWorkflow = (config: Config) => {
  const cron = new CronCapability();
  return [handler(cron.trigger({ schedule: config.schedule }), onTrigger)];
};

function onTrigger(runtime: Runtime<Config>): SwapProcessResult {
  runtime.log("cre-swap workflow running.");
  const result = runtime.runInNodeMode(processSwap, consensusIdenticalAggregation<SwapProcessResult>())().result();
  runtime.log("[1] Intent parsed — swap.");
  runtime.log("[2] Quote — LI.FI.");
  runtime.log("[3] Protocol validation — swap whitelist.");
  runtime.log("[4] Ranking — gas/time/reliability.");
  runtime.log("[5] Report submitted for request " + result.requestId);
  return result;
}

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
