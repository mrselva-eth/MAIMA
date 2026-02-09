/**
 * Bridge Workflow – CRE (separate folder).
 * Based on user request (swap/bridge), workflow gets active.
 * Top 5 bridges list TBD by team.
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

type Config = { schedule: string; apiBaseUrl: string };

type BridgeResult = {
  bridge: string;
  estimatedTime: string;
  gasEstimate: string;
  successRate: string;
  timestamp: number;
};

const initWorkflow = (config: Config) => {
  const cron = new CronCapability();
  return [handler(cron.trigger({ schedule: config.schedule }), onTrigger)];
};

function runBridge(nodeRuntime: NodeRuntime<Config>): BridgeResult {
  const httpClient = new HTTPClient();
  const url = `${nodeRuntime.config.apiBaseUrl}/api/maima/requests`;
  try {
    httpClient.sendRequest(nodeRuntime, { url, method: "GET" }).result();
  } catch {
    // ignore
  }
  return {
    bridge: "Stargate",
    estimatedTime: "~5 min",
    gasEstimate: "0.001 ETH",
    successRate: "99%",
    timestamp: Date.now(),
  };
}

function onTrigger(runtime: Runtime<Config>): BridgeResult {
  runtime.log("Bridge workflow running.");
  const result = runtime.runInNodeMode(runBridge).result();
  runtime.log(JSON.stringify(result));
  return result;

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
