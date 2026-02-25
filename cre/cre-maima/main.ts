/**
 * MAIMA – Main CRE workflow
 * Consolidates Orchestrator and Network Congestion Monitoring.
 */

import {
  CronCapability,
  HTTPClient,
  handler,
  consensusIdenticalAggregation,
  ConsensusAggregationByFields,
  median,
  ignore,
  Runner,
  type NodeRuntime,
  type Runtime,
} from "@chainlink/cre-sdk";

type Config = {
  schedule: string;
  apiBaseUrl: string;
  chainId: string;
  rpcUrls: string[];
};

/** --- TYPES: Orchestrator --- */
type QueueRequest = {
  id: string;
  prompt: string;
  fromAddress?: string;
  type: string;
  createdAt: string;
};

type OrchestrateResult = {
  delegatedCount: number;
  timestamp: number;
};

/** --- TYPES: Congestion --- */
type CongestionMetrics = {
  blockNumber: number;
  utilization: number;
  baseFeeGwei: number;
  timestamp: number;
};

type CongestionData = {
  chainId: string;
  blockNumber: number;
  baseFee: string;
  utilization: number;
  status: string;
  color: string;
  timestamp: number;
};

/** --- UTILS --- */
function toBase64(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  const key = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    result += key[a >> 2];
    result += key[((a & 3) << 4) | (b >> 4)];
    result += (i + 1 < bytes.length) ? key[((b & 15) << 2) | (c >> 6)] : "=";
    result += (i + 2 < bytes.length) ? key[c & 63] : "=";
  }
  return result;
}

/** --- LOGIC: Orchestrator --- */
function orchestrate(nodeRuntime: NodeRuntime<Config>): OrchestrateResult {
  const httpClient = new HTTPClient();
  const base = nodeRuntime.config.apiBaseUrl;

  const queueResp = httpClient.sendRequest(nodeRuntime, { url: `${base}/api/maima?action=queue`, method: "GET" }).result();
  const queueText = new TextDecoder().decode(queueResp.body);
  const queueData = JSON.parse(queueText) as { success?: boolean; requests?: QueueRequest[] };
  const requests: QueueRequest[] = Array.isArray(queueData.requests) ? queueData.requests : [];
  let delegated = 0;

  for (const req of requests) {
    const reportResp = httpClient.sendRequest(nodeRuntime, { url: `${base}/api/maima?action=report&requestId=${encodeURIComponent(req.id)}`, method: "GET" }).result();
    let reportData: { success?: boolean; report?: unknown } = {};
    try {
      reportData = JSON.parse(new TextDecoder().decode(reportResp.body));
    } catch {
      // ignore
    }
    if (reportData.success && reportData.report != null) continue;

    const type = (req.type || "swap").toLowerCase();
    const isBridge = type === "bridge";
    const body = toBase64(JSON.stringify(isBridge ? { action: "run-bridge", request: req } : { action: "run-swap", request: req }));

    httpClient
      .sendRequest(nodeRuntime, {
        url: `${base}/api/maima`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      })
      .result();
    delegated++;
  }

  return { delegatedCount: delegated, timestamp: Date.now() };
}

/** --- LOGIC: Congestion --- */
function fetchCongestionMetrics(nodeRuntime: NodeRuntime<Config>): CongestionMetrics {
  const httpClient = new HTTPClient();
  const urls = nodeRuntime.config.rpcUrls;
  const startIndex = Math.floor(Math.random() * urls.length);

  let metrics: CongestionMetrics | null = null;
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getBlockByNumber",
    params: ["latest", false]
  };

  for (let i = 0; i < urls.length; i++) {
    const rpcUrl = urls[(startIndex + i) % urls.length];
    try {
      const resp = httpClient.sendRequest(nodeRuntime, {
        url: rpcUrl,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: toBase64(JSON.stringify(payload))
      }).result();

      const resultText = new TextDecoder().decode(resp.body);
      const json = JSON.parse(resultText);
      const block = json.result;

      if (block) {
        const blockNumber = parseInt(block.number, 16);
        const baseFeeGwei = block.baseFeePerGas ? (parseInt(block.baseFeePerGas, 16) / 1e9) : 0;
        const gasUsed = BigInt(block.gasUsed);
        const gasLimit = BigInt(block.gasLimit);
        const utilization = Number((gasUsed * 100n) / gasLimit);

        metrics = { blockNumber, utilization, baseFeeGwei, timestamp: Date.now() };
        break;
      }
    } catch (e) {
      // fallback to next RPC
    }
  }

  if (!metrics) throw new Error("All RPCs failed for congestion metrics");
  return metrics;
}

/** --- MAIN TRACE RESULT --- */
type CombinedResult = {
  orchestrator: OrchestrateResult;
  congestion: CongestionData | null;
};

/** --- ORCHESTRATION HANDLER --- */
const initWorkflow = (config: Config) => {
  const cron = new CronCapability();
  return [handler(cron.trigger({ schedule: config.schedule }), onCronTrigger)];
};

function onCronTrigger(runtime: Runtime<Config>): CombinedResult {
  runtime.log("MAIMA main workflow tick.");

  let congestionData: CongestionData | null = null;

  // 1. Congestion Monitoring (Oracle Consensus)
  try {
    const metrics = runtime.runInNodeMode(
      fetchCongestionMetrics,
      ConsensusAggregationByFields<CongestionMetrics>({
        blockNumber: median,
        utilization: median,
        baseFeeGwei: median,
        timestamp: ignore
      })
    )().result();

    let status = "Low Congestion (Green Zone)";
    let color = "Green";
    if (metrics.utilization > 85) {
      status = "High Congestion (Red Zone)";
      color = "Red";
    } else if (metrics.utilization > 50) {
      status = "Moderate Congestion (Yellow Zone)";
      color = "Yellow";
    }

    congestionData = {
      chainId: runtime.config.chainId,
      blockNumber: Math.round(metrics.blockNumber),
      baseFee: metrics.baseFeeGwei.toFixed(4) + " Gwei",
      utilization: Math.round(metrics.utilization),
      status,
      color,
      timestamp: Date.now()
    };

    const httpClient = new HTTPClient();
    httpClient.sendRequest(runtime, {
      url: `${runtime.config.apiBaseUrl}/api/maima`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: toBase64(JSON.stringify({ action: "congestion-report", data: congestionData }))
    }).result();

    runtime.log(`[Congestion] Status: ${status} (${congestionData.utilization}%)`);
  } catch (err) {
    runtime.log(`[Congestion] Error: ${err}`);
  }

  // 2. Queue Orchestrator
  let orchResult: OrchestrateResult = { delegatedCount: 0, timestamp: Date.now() };
  try {
    orchResult = runtime
      .runInNodeMode(orchestrate, consensusIdenticalAggregation<OrchestrateResult>())()
      .result();

    runtime.log(`[Orchestrator] Queue polled. Delegated ${orchResult.delegatedCount} requests.`);
  } catch (err) {
    runtime.log(`[Orchestrator] Error: ${err}`);
  }

  return { orchestrator: orchResult, congestion: congestionData };
}

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
