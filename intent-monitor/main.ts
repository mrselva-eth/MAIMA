/**
 * Intent Monitor – CRE workflow (Chainlink Runtime Environment)
 *
 * Trigger: Cron (every 30s staging / every 10min production)
 * Action: GET apiBaseUrl/api/intents/active, log count, return result
 *
 * For hackathon: compile with CRE CLI, simulate locally, then deploy to CRE.
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

type MonitorResult = {
  activeCount: number;
  timestamp: number;
};

const initWorkflow = (config: Config) => {
  const cron = new CronCapability();
  return [handler(cron.trigger({ schedule: config.schedule }), onCronTrigger)];
};

function fetchActiveIntentCount(nodeRuntime: NodeRuntime<Config>): number {
  const httpClient = new HTTPClient();
  const url = `${nodeRuntime.config.apiBaseUrl}/api/intents/active`;
  const resp = httpClient
    .sendRequest(nodeRuntime, { url, method: "GET" })
    .result();
  const bodyText = new TextDecoder().decode(resp.body);
  const data = JSON.parse(bodyText) as { success?: boolean; count?: number };
  const count = typeof data.count === "number" ? data.count : 0;
  return count;
}

function onCronTrigger(runtime: Runtime<Config>): MonitorResult {
  runtime.log("Intent Monitor: workflow triggered.");
  const activeCount = runtime
    .runInNodeMode(fetchActiveIntentCount, consensusMedianAggregation())
    ().result();
  runtime.log(`Active intents: ${activeCount}`);
  return {
    activeCount,
    timestamp: Date.now(),
  };
}

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
