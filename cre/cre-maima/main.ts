/**
 * MAIMA – Main CRE workflow (DeFi optimistic solution handler)
 *
 * Trigger: Cron. Based on user request, workflow gets active; AI gives report.
 * GET /api/maima/requests → active requests; log and return.
 * Report (accuracy, gas, optimistic) is generated when user sends message in app chat.
 */

import {
  CronCapability,
  HTTPClient,
  handler,
  consensusMedianAggregation,
  Runner,
  type NodeRuntime,
  type Runtime,
} from "@chainlink/cre-sdk";

type Config = {
  schedule: string;
  apiBaseUrl: string;
};

type MaimaResult = {
  activeRequests: number;
  reportGenerated: boolean;
  timestamp: number;
};

const initWorkflow = (config: Config) => {
  const cron = new CronCapability();
  return [handler(cron.trigger({ schedule: config.schedule }), onCronTrigger)];
};

function fetchRequests(nodeRuntime: NodeRuntime<Config>): Omit<MaimaResult, "timestamp"> {
  const httpClient = new HTTPClient();
  const url = `${nodeRuntime.config.apiBaseUrl}/api/maima/requests`;
  const resp = httpClient.sendRequest(nodeRuntime, { url, method: "GET" }).result();
  const text = new TextDecoder().decode(resp.body);
  const data = JSON.parse(text) as { success?: boolean; count?: number; requests?: unknown[] };
  const activeRequests = typeof data.count === "number" ? data.count : (data.requests?.length ?? 0);
  return {
    activeRequests,
    reportGenerated: activeRequests > 0,
  };
}

function onCronTrigger(runtime: Runtime<Config>): MaimaResult {
  runtime.log("MAIMA workflow triggered.");
  const out = runtime
    .runInNodeMode(fetchRequests, consensusMedianAggregation())
    ().result();
  runtime.log(`Active requests: ${out.activeRequests}`);
  return {
    ...out,
    timestamp: Date.now(),
  };
}

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
