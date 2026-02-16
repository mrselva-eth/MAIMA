/**
 * Shared types for MAIMA analyze report
 */

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
  executionDuration?: number; // seconds
  liquidityScore?: string;    // e.g. "High", "Medium", "Low"
  reliabilityScore?: string;  // e.g. "99.9%"
  tags?: string[];
};

export type AnalyzeReport = {
  accuracy: string;
  gasFeeEstimate: string;
  optimisticEstimate: string;
  topBridges: Array<{ name: string; score: string }>;
  topSwaps: Array<{ name: string; score: string }>;
  summary?: string;
  timestamp?: number;
  routes?: ReportRoute[];
  bestRoute?: ReportRoute;
  rawRoute?: unknown;
  workflow?: Array<{
    name: string;
    status: 'ok' | 'warn' | 'error';
    details: string;
    timestamp?: number;
  }>;
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
  /** When true, CRE simulation mode is on: real execution is disabled; CRE workflows are triggered. */
  simulationMode?: boolean;
};
