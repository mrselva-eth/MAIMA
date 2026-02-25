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
};

// --- Congestion ---
export type CongestionData = {
  chainId: string;
  blockNumber: number;
  baseFee: string;
  utilization: number;
  status: string;
  color: string;
  timestamp: number;
};

// --- Stores ---
export const maimaRequests = new Map<string, MaimaRequest>();
export const maimaReports = new Map<string, unknown>();
export const pendingSwapQueue: MaimaRequest[] = [];
export const pendingBridgeQueue: MaimaRequest[] = [];
export const congestionStore = new Map<string, CongestionData>();
