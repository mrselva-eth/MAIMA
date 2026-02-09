/**
 * Swap Workflow – CRE (separate folder).
 * Based on user request (swap/bridge), workflow gets active.
 * Top 5 swaps list TBD by team.
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

type SwapResult = {
  route: string;
  slippage: string;
  priceImpact: string;
  timestamp: number;
};

const initWorkflow = (config: Config) => {
  const cron = new CronCapability();
  return [handler(cron.trigger({ schedule: config.schedule }), onTrigger)];
};

function runSwap(nodeRuntime: NodeRuntime<Config>): SwapResult {
  const httpClient = new HTTPClient();
  const url = `${nodeRuntime.config.apiBaseUrl}/api/maima/requests`;
  try {
    httpClient.sendRequest(nodeRuntime, { url, method: "GET" }).result();
  } catch {
    // ignore
  }
  return {
    route: "USDC → ETH",
    slippage: "0.5%",
    priceImpact: "0.1%",
    timestamp: Date.now(),
  };
}

function onTrigger(runtime: Runtime<Config>): SwapResult {
  runtime.log("Swap workflow running.");
  const result = runtime.runInNodeMode(runSwap, consensusMedianAggregation)().result();
  runtime.log(JSON.stringify(result));
  return result;
}

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
