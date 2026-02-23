/**
 * MAIMA – Main CRE workflow (orchestrator only)
 *
 * cre-maima is the main orchestrator. It does NOT do analysis.
 * - GET /api/maima?action=queue → for each request, if report not done yet:
 *   - If swap  → POST /api/maima { action: 'run-swap', request }
 *   - If bridge → POST /api/maima { action: 'run-bridge', request }
 * cre-swap and cre-bridge do the actual analysis (LI.FI, Chainlink, ranking, report).
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

type QueueRequest = {
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

type OrchestrateResult = {
  delegatedCount: number;
  timestamp: number;
};

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

const initWorkflow = (config: Config) => {
  const cron = new CronCapability();
  return [handler(cron.trigger({ schedule: config.schedule }), onCronTrigger)];
};

function onCronTrigger(runtime: Runtime<Config>): OrchestrateResult {
  runtime.log("MAIMA orchestrator triggered.");
  const out = runtime
    .runInNodeMode(orchestrate, consensusIdenticalAggregation<OrchestrateResult>())()
    .result();
  runtime.log("[1] Queue polled.");
  runtime.log("[2] Delegated " + out.delegatedCount + " request(s) to cre-swap / cre-bridge.");
  return out;
}

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
