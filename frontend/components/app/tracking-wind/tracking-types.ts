import type { AnalyzeReport } from '@/lib/maima';

/** Theme blue used across the tracking panel */
export const THEME_COLOR = '#1e40af';

export const STEP_DELAY_MS = 1400;
export const PROTOCOL_CHECK_DELAY_MS = 1600;
/** Simulation mode: delay between each CRE log line for typing/streaming effect */
export const CRE_STREAM_DELAY_MS = 320;

export const DEFAULT_BRIDGES = ['Stargate', 'Across', 'Hop', 'Synapse', 'Celer cBridge'];
export const DEFAULT_SWAPS = ['Uniswap V3', '1inch', 'Curve', 'KyberSwap', 'Paraswap', 'SushiSwap'];

export const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  10: 'Optimism',
  56: 'BSC',
  137: 'Polygon',
  8453: 'Base',
  42161: 'Arbitrum',
  43114: 'Avalanche',
  11155111: 'Sepolia',
};

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
export const SEPOLIA_CHAIN_ID = 11155111;
export const SWAP_PROTOCOL_WHITELIST = ['Uniswap V3', '1inch', 'Curve', 'KyberSwap', 'Paraswap'];

export type ProtocolStatus = 'pending' | 'checking' | 'checked';

export type TrackingPhase = 'steps' | 'checking' | 'choose' | 'execute' | 'done';

export type ProcessTrackingState = {
  phase: TrackingPhase;
  type: 'swap' | 'bridge';
  stepIndex: number;
  logLines: string[];
  report: AnalyzeReport | null;
  selectedIndex: number | null;
  executeLogs: string[];
  finalResult: {
    protocol: string;
    pair: string;
    fee: string;
    inputAmount: string;
    outputAmount: string;
    txHash: string;
    approvalHash: string;
    accuracy?: string;
  } | null;
};

export interface ProcessTrackingPanelProps {
  open: boolean;
  onClose: () => void;
  prompt: string;
  report: AnalyzeReport | null;
  /** True while the app is polling for the report (CRE backend may still be processing). */
  isWaitingForReport?: boolean;
  onComplete: (result: ProcessTrackingState['finalResult']) => void;
  onStepComplete: () => void;
  onExecuteStart?: () => void;
}
