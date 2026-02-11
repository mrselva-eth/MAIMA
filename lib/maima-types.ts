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
    rank: number;
    reason?: string;
    isSelected?: boolean;
  }>;
  selectionReason?: string;
  intentType?: 'swap' | 'bridge';
};
