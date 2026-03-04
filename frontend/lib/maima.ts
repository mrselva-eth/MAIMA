/**
 * MAIMA: types + in-memory stores (queue, reports, pending swap/bridge).
 * Single module for all maima-related lib. Replace with DB in production.
 */

// --- Types ---
export type MaimaRequest = {
  id: string;
  prompt: string;
  fromAddress?: string;
  type: 'swap' | 'bridge' | 'both';
  createdAt: string;
  report?: unknown;
};

export type ReportToken = {
  address?: string;
  symbol?: string;
  decimals?: number;
  chainId?: number;
  name?: string;
};

export type ReportStep = {
  type?: string;
  tool?: string;
  action?: unknown;
  estimate?: unknown;
  transactionRequest?: unknown;
};

export type ReportRoute = {
  id?: string;
  type: 'swap' | 'bridge';
  mainTool: string;
  gasCostUSD?: string;
  fromAmount?: string;
  toAmount?: string;
  fromToken?: ReportToken;
  toToken?: ReportToken;
  steps?: ReportStep[];
  executionDuration?: number;
  liquidityScore?: string;
  reliabilityScore?: string;
  tags?: string[];
};

export type AnalyzeReport = {
  accuracy: string;
  chainlink?: {
    prices?: Array<{ symbol: string; price: string; updatedAt?: number }>;
    verifiedBy?: string;
  };
  gasFeeEstimate: string;
  optimisticEstimate: string;
  topBridges: Array<{ name: string; score: string }>;
  topSwaps: Array<{ name: string; score: string }>;
  summary?: string;
  timestamp?: number;
  routes?: ReportRoute[];
  bestRoute?: ReportRoute;
  rawRoute?: unknown;
  workflow?: Array<{ name: string; status: 'ok' | 'warn' | 'error'; details: string; timestamp?: number }>;
  ranking?: Array<{
    protocol: string;
    feeUSD?: number | null;
    executionDuration?: number;
    liquidityScore?: string;
    reliabilityScore?: string;
    rank: number;
    reason?: string;
    isSelected?: boolean;
  }>;
  selectionReason?: string;
  intentType?: 'swap' | 'bridge';
  simulationMode?: boolean;
  requestId?: string;
};

// --- Stores ---
// Wrap in globalThis for persistence across HMR reloads in development
const globalMaima = globalThis as unknown as {
  maimaRequests?: Map<string, MaimaRequest>;
  maimaReports?: Map<string, unknown>;
  pendingSwapQueue?: MaimaRequest[];
  pendingBridgeQueue?: MaimaRequest[];
};

export const maimaRequests = globalMaima.maimaRequests ||= new Map<string, MaimaRequest>();
export const maimaReports = globalMaima.maimaReports ||= new Map<string, unknown>();
export const pendingSwapQueue = globalMaima.pendingSwapQueue ||= [];
export const pendingBridgeQueue = globalMaima.pendingBridgeQueue ||= [];
