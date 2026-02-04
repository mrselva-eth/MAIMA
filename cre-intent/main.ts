/**
 * Intent Monitor + Executor – CRE workflow (Chainlink Runtime Environment)
 *
 * Trigger: Cron (every 30s staging / every 10min production)
 * Actions (in order):
 *   1. GET apiBaseUrl/api/intents/active → list of active intents (swap / stake / bridge)
 *   2. For each active intent: POST apiBaseUrl/api/intents/execute { intentId }
 *      - Swap: app uses Uniswap to build tx (simulation; relayer submits in prod)
 *      - Stake / Bridge: app stubs; wire to protocols when ready
 *   3. Return activeCount, executed count, and per-intent results.
 *
 * Features: "Swap 100 USDC to ETH at best rate", "Stake 50 SOL monthly if balance > $1000",
 *           "Bridge 500 USDT from Ethereum to Arbitrum"
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

type IntentItem = { id: string; type?: string; status?: string };

type MonitorResult = {
  activeCount: number;
  executed: number;
  results: Array<{ intentId: string; success: boolean; type?: string; message?: string }>;
  timestamp: number;
};

const initWorkflow = (config: Config) => {
  const cron = new CronCapability();
  return [handler(cron.trigger({ schedule: config.schedule }), onCronTrigger)];
};

function fetchActiveIntentsAndExecute(nodeRuntime: NodeRuntime<Config>): Omit<MonitorResult, "timestamp"> {
  const httpClient = new HTTPClient();
  const baseUrl = nodeRuntime.config.apiBaseUrl;

  const activeUrl = `${baseUrl}/api/intents/active`;
  const activeResp = httpClient
    .sendRequest(nodeRuntime, { url: activeUrl, method: "GET" })
    .result();
  const activeText = new TextDecoder().decode(activeResp.body);
  const activeData = JSON.parse(activeText) as {
    success?: boolean;
    count?: number;
    intents?: IntentItem[];
  };

  const intents: IntentItem[] = Array.isArray(activeData.intents) ? activeData.intents : [];
  const activeCount = typeof activeData.count === "number" ? activeData.count : intents.length;

  const results: MonitorResult["results"] = [];

  for (const intent of intents) {
    if (!intent?.id) continue;
    try {
      const executeUrl = `${baseUrl}/api/intents/execute`;
      const body = new TextEncoder().encode(JSON.stringify({ intentId: intent.id }));
      const executeResp = httpClient
        .sendRequest(nodeRuntime, {
          url: executeUrl,
          method: "POST",
          body,
          headers: { "Content-Type": "application/json" },
        })
        .result();
      const executeText = new TextDecoder().decode(executeResp.body);
      const executeData = JSON.parse(executeText) as {
        success?: boolean;
        intentId?: string;
        type?: string;
        message?: string;
      };
      results.push({
        intentId: intent.id,
        success: Boolean(executeData.success),
        type: executeData.type,
        message: executeData.message,
      });
    } catch (err) {
      results.push({
        intentId: intent.id,
        success: false,
        type: intent.type,
        message: err instanceof Error ? err.message : "Execute request failed",
      });
    }
  }

  const executed = results.filter((r) => r.success).length;

  return {
    activeCount,
    executed,
    results,
  };
}

function onCronTrigger(runtime: Runtime<Config>): MonitorResult {
  runtime.log("Intent Monitor: workflow triggered.");
  const out = runtime
    .runInNodeMode(fetchActiveIntentsAndExecute, consensusMedianAggregation())
    ().result();
  runtime.log(`Active intents: ${out.activeCount}`);
  runtime.log(`Executed: ${out.executed}`);
  return {
    ...out,
    timestamp: Date.now(),
  };
}

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
