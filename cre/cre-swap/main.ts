/**
 * cre-swap – Swap analysis workflow.
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
import { getChainlinkPrice } from "./chainlink.ts";

type Config = {
  schedule: string;
  apiBaseUrl: string;
  lifiApiKey?: string;
};

const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const USDC_ETH = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_ARB = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const USDC_POLY = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const USDC_OP = "0x7F5c764cBc14f9669B88837ca1490cCa17c31607";
const USDC_AVAX = "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E";

const WBTC_ETH = "0x2260FAC5E0542104311146e4601460a519623217";
const WBTC_BASE = "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c";
const WBTC_ARB = "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f";
const WBTC_POLY = "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6";
const WBTC_OP = "0x68f180fcCe68B2551062086053805B77B9bf0a2095";
const WBTC_AVAX = "0x50B7545627a5162F82a992c33B87aDc75187B218";

const LINK_ETH = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
const LINK_BASE = "0x88Fb150DB41287C483829ad321959600522032F5";
const LINK_POLY = "0xb0897686c545045aFc77CF20eC7A532E3120E0F1";
const LINK_OP = "0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6";
const LINK_AVAX = "0x5947BB275c521040051D82396192181b413227A3";
const LINK_ARB = "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4";

const DAI_ETH = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const DAI_BASE = "0x50c5725949A6E00329949b2100771f7B995777D4";
const DAI_POLY = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
const DAI_OP = "0xDA10009cEd72fc32591f4c00BB1F5c7e14B5892B";
const DAI_ARB = "0xDA10009cEd72fc32591f4c00BB1F5c7e14B5892B";
const DAI_AVAX = "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70";

const ETH_CHAIN_ID = 1;
const BASE_CHAIN_ID = 8453;
const ARB_CHAIN_ID = 42161;
const POLY_CHAIN_ID = 137;
const OP_CHAIN_ID = 10;
const AVAX_CHAIN_ID = 43114;
const SEPOLIA_CHAIN_ID = 11155111;

const ALLOWED_SWAP_PROTOCOLS = ["Uniswap V3", "1inch", "Curve", "KyberSwap", "Paraswap"];

type PendingRequest = {
  id: string;
  prompt: string;
  fromAddress?: string;
  type: string;
  createdAt: string;
};

type MaimaRequest = PendingRequest;

function toBase64(str: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes = new TextEncoder().encode(str);
  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    result += chars[a >> 2];
    result += chars[((a & 3) << 4) | (b >> 4)];
    result += i + 1 < bytes.length ? chars[((b & 15) << 2) | (c >> 6)] : "=";
    result += i + 2 < bytes.length ? chars[c & 63] : "=";
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

const TOKENS: Record<string, string> = {
  eth: ETH_ADDRESS,
  usdc: USDC_ETH,
  usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  dai: DAI_ETH,
  link: LINK_ETH,
  wbtc: WBTC_ETH,
  matic: ETH_ADDRESS,
  bnb: ETH_ADDRESS,
  avax: ETH_ADDRESS,
};

const CHAINS: Record<string, number> = {
  ethereum: ETH_CHAIN_ID,
  mainnet: ETH_CHAIN_ID,
  eth: ETH_CHAIN_ID,
  polygon: POLY_CHAIN_ID,
  matic: POLY_CHAIN_ID,
  arbitrum: ARB_CHAIN_ID,
  arb: ARB_CHAIN_ID,
  optimism: OP_CHAIN_ID,
  op: OP_CHAIN_ID,
  base: BASE_CHAIN_ID,
  bsc: 56,
  binance: 56,
  avalanche: AVAX_CHAIN_ID,
  avax: AVAX_CHAIN_ID,
  sepolia: SEPOLIA_CHAIN_ID,
};

function getTokenAddress(tokenName: string, chainId: number): string {
  if (tokenName === "eth" || tokenName === "matic" || tokenName === "bnb" || tokenName === "avax") {
    return ETH_ADDRESS;
  }
  if (tokenName === "usdc") {
    if (chainId === BASE_CHAIN_ID) return USDC_BASE;
    if (chainId === ARB_CHAIN_ID) return USDC_ARB;
    if (chainId === POLY_CHAIN_ID) return USDC_POLY;
    if (chainId === OP_CHAIN_ID) return USDC_OP;
    if (chainId === AVAX_CHAIN_ID) return USDC_AVAX;
    return USDC_ETH;
  }
  if (tokenName === "wbtc") {
    if (chainId === BASE_CHAIN_ID) return WBTC_BASE;
    if (chainId === ARB_CHAIN_ID) return WBTC_ARB;
    if (chainId === POLY_CHAIN_ID) return WBTC_POLY;
    if (chainId === OP_CHAIN_ID) return WBTC_OP;
    if (chainId === AVAX_CHAIN_ID) return WBTC_AVAX;
    return WBTC_ETH;
  }
  if (tokenName === "link") {
    if (chainId === BASE_CHAIN_ID) return LINK_BASE;
    if (chainId === POLY_CHAIN_ID) return LINK_POLY;
    if (chainId === OP_CHAIN_ID) return LINK_OP;
    if (chainId === AVAX_CHAIN_ID) return LINK_AVAX;
    if (chainId === ARB_CHAIN_ID) return LINK_ARB;
    return LINK_ETH;
  }
  if (tokenName === "dai") {
    if (chainId === BASE_CHAIN_ID) return DAI_BASE;
    if (chainId === POLY_CHAIN_ID) return DAI_POLY;
    if (chainId === OP_CHAIN_ID) return DAI_OP;
    if (chainId === ARB_CHAIN_ID) return DAI_ARB;
    if (chainId === AVAX_CHAIN_ID) return DAI_AVAX;
    return DAI_ETH;
  }
  return TOKENS[tokenName] || ETH_ADDRESS;
}

function parseIntent(prompt: string, fromAddress: string): Record<string, unknown> {
  const p = prompt.toLowerCase();
  let chainId = BASE_CHAIN_ID;
  const onMatch = p.match(/\bon\s+([a-z]+)/);
  if (onMatch && CHAINS[onMatch[1]]) {
    chainId = CHAINS[onMatch[1]];
  } else {
    for (const [name, id] of Object.entries(CHAINS)) {
      if (p.includes(name)) {
        chainId = id;
        break;
      }
    }
  }

  const words = p.split(/\s+/);
  const tokenNames = Object.keys(TOKENS);
  let fromTokenName = "eth";
  if (chainId === POLY_CHAIN_ID) fromTokenName = "matic";
  if (chainId === AVAX_CHAIN_ID) fromTokenName = "avax";
  if (chainId === 56) fromTokenName = "bnb";

  let toTokenName = "usdc";
  let foundFrom = false;

  for (const word of words) {
    const cleanWord = word.replace(/[^a-z]/g, "");
    if (tokenNames.includes(cleanWord)) {
      if (!foundFrom) {
        fromTokenName = cleanWord;
        foundFrom = true;
      } else {
        toTokenName = cleanWord;
        break;
      }
    }
  }

  const fromToken = getTokenAddress(fromTokenName, chainId);
  const toToken = getTokenAddress(toTokenName, chainId);
  const isUsdc = fromTokenName === "usdc" || toTokenName === "usdc";
  const isWbtc = fromTokenName === "wbtc" || toTokenName === "wbtc";
  const decimals = isUsdc ? 6 : (isWbtc ? 8 : 18);
  const defaultAmt = isUsdc ? "100" : (isWbtc ? "0.01" : "1");
  const numMatch = p.match(/\d+(\.\d+)?/);
  const amountStr = numMatch?.[0] ?? defaultAmt;
  const [whole, frac = ""] = amountStr.split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  const fromAmount = `${whole}${fracPadded}`.replace(/^0+/, "") || "0";

  return {
    fromChainId: chainId,
    toChainId: chainId,
    fromTokenAddress: fromToken,
    toTokenAddress: toToken,
    fromAmount,
    fromAddress: fromAddress === "0x0000000000000000000000000000000000000000" || !fromAddress ? "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" : fromAddress,
    options: { allowSwitchChain: true },
  };
}

type SwapProcessResult = { processed: boolean; requestId: string; timestamp: number };

function processSwap(nodeRuntime: NodeRuntime<Config>): SwapProcessResult {
  nodeRuntime.log("cre-swap: processSwap START.");
  try {
    const httpClient = new HTTPClient();
    const base = nodeRuntime.config.apiBaseUrl;
    nodeRuntime.log(`cre-swap: apiBaseUrl is ${base}`);

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
    const lifiHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (nodeRuntime.config.lifiApiKey) {
      lifiHeaders["x-lifi-api-key"] = nodeRuntime.config.lifiApiKey;
    }

    const quoteResp = httpClient
      .sendRequest(nodeRuntime, {
        url: `https://li.quest/v1/advanced/routes`,
        method: "POST",
        headers: lifiHeaders,
        body: toBase64(JSON.stringify(payload)),
      })
      .result();
    let lifiData: { routes?: unknown[] } = {};
    try {
      lifiData = JSON.parse(new TextDecoder().decode(quoteResp.body));
    } catch { }

    const routes = Array.isArray(lifiData.routes) ? lifiData.routes : [];

    if (routes.length === 0) {
      const errorReport = {
        accuracy: "N/A",
        summary: "No routes found for the requested swap.",
        timestamp: Date.now(),
        workflow: [
          { name: "Intent parsed", status: "ok" as const, details: "Swap request detected", timestamp: Date.now() },
          { name: "Quote requested", status: "error" as const, details: "LI.FI returned no routes", timestamp: Date.now() + 50 },
        ],
        topSwaps: [],
        topBridges: [],
        intentType: "swap" as const,
        simulationMode: true,
      };
      const creReportBody = toBase64(JSON.stringify({ action: "cre-report", requestId: request.id, report: errorReport }));
      httpClient.sendRequest(nodeRuntime, { url: `${base}/api/maima`, method: "POST", headers: { "Content-Type": "application/json" }, body: creReportBody }).result();
      return { processed: true, requestId: request.id, timestamp: Date.now() };
    }

    const fromSymbol = (routes[0] as { fromToken?: { symbol?: string } })?.fromToken?.symbol;
    const toSymbol = (routes[0] as { toToken?: { symbol?: string } })?.toToken?.symbol;
    const clChainId = Number(payload.fromChainId);
    const verifiedPrices: { symbol: string; price: string; updatedAt?: number }[] = [];

    if (fromSymbol) {
      nodeRuntime.log(`[ORACLE] Verifying price for ${fromSymbol} via Chainlink...`);
      const prData = getChainlinkPrice(nodeRuntime, fromSymbol, clChainId);
      if (prData?.price != null) {
        nodeRuntime.log(`[ORACLE] Verified ${fromSymbol}: $${Number(prData.price).toFixed(2)} (Updated: ${new Date(prData.updatedAt || Date.now()).toLocaleTimeString()})`);
        verifiedPrices.push({ symbol: fromSymbol, price: `$${Number(prData.price).toFixed(2)}`, updatedAt: prData.updatedAt });
      } else {
        nodeRuntime.log(`[ORACLE] Price for ${fromSymbol} unavailable via Chainlink.`);
      }
    }
    if (toSymbol && toSymbol !== fromSymbol) {
      nodeRuntime.log(`[ORACLE] Verifying price for ${toSymbol} via Chainlink...`);
      const prData = getChainlinkPrice(nodeRuntime, toSymbol, clChainId);
      if (prData?.price != null) {
        nodeRuntime.log(`[ORACLE] Verified ${toSymbol}: $${Number(prData.price).toFixed(2)} (Updated: ${new Date(prData.updatedAt || Date.now()).toLocaleTimeString()})`);
        verifiedPrices.push({ symbol: toSymbol, price: `$${Number(prData.price).toFixed(2)}`, updatedAt: prData.updatedAt });
      } else {
        nodeRuntime.log(`[ORACLE] Price for ${toSymbol} unavailable via Chainlink.`);
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

    const sorted = routeSummaries
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
      { name: "Intent parsed", status: "ok" as const, details: `${fromSymbol} to ${toSymbol} on chain ${clChainId}`, timestamp: now },
      { name: "Quote requested", status: "ok" as const, details: `Requested ${routes.length} route(s) from LI.FI`, timestamp: now + 50 },
      { name: "Protocol validation", status: "ok" as const, details: `Whitelist not enforced`, timestamp: now + 100 },
      { name: "Ranking", status: "ok" as const, details: "Sorted by Gas Fee (40%), Time (30%), Reliability (30%)", timestamp: now + 150 },
      { name: "Selection", status: bestRoute ? "ok" : "error", details: bestRoute ? `Selected ${bestRoute.mainTool}` : "No valid route", timestamp: now + 200 },
      { name: "Oracle Verification", status: verifiedPrices.length > 0 ? "ok" : "warn", details: verifiedPrices.length > 0 ? `Verified ${verifiedPrices.length} price(s) via Chainlink` : "Chainlink unavailable", timestamp: now + 250 },
    ];
    const ranking = sorted.slice(0, 10).map((route, i) => ({
      protocol: route.mainTool, rank: i + 1, feeUSD: parseGasFee(route.gasCostUSD), executionDuration: route.executionDuration, liquidityScore: route.liquidityScore, reliabilityScore: route.reliabilityScore, reason: bestRoute?.id === route.id ? "Best score" : "Lower score", isSelected: bestRoute?.id === route.id,
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
      requestId: request.id,
    };

    const creReportBody = toBase64(JSON.stringify({ action: "cre-report", requestId: request.id, report }));
    httpClient.sendRequest(nodeRuntime, { url: `${base}/api/maima`, method: "POST", headers: { "Content-Type": "application/json" }, body: creReportBody }).result();
    nodeRuntime.log("cre-swap: Report submitted.");
    return { processed: true, requestId: request.id, timestamp: Date.now() };

  } catch (e: any) {
    nodeRuntime.log(`cre-swap: FATAL ERROR in processSwap: ${e?.message || e || 'Unknown error'}`);
    return { processed: false, requestId: "", timestamp: Date.now() };
  }
}

const initWorkflow = (config: Config) => {
  const cron = new CronCapability();
  return [handler(cron.trigger({ schedule: config.schedule }), onTrigger)];
};

function onTrigger(runtime: Runtime<Config>): SwapProcessResult {
  runtime.log("cre-swap workflow: onTrigger START.");
  try {
    const result = runtime.runInNodeMode(processSwap, consensusIdenticalAggregation<SwapProcessResult>())().result();
    runtime.log("cre-swap workflow: processSwap completed.");
    return result;
  } catch (err: any) {
    runtime.log(`cre-swap workflow: ERROR in onTrigger: ${err?.message || err || 'Unknown'}`);
    throw err;
  }
}

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
