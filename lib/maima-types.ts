/**
 * Shared types for MAIMA analyze report
 */

export type AnalyzeReport = {
  accuracy: string;
  gasFeeEstimate: string;
  optimisticEstimate: string;
  topBridges: Array<{ name: string; score: string; note: string }>;
  topSwaps: Array<{ name: string; score: string; note: string }>;
  summary: string;
  timestamp: number;
};
