/**
 * MAIMA Type Definitions
 */

/* =========================
   INTENT CORE
========================= */

export type IntentType =
  | 'swap'
  | 'stake'
  | 'bridge'
  | 'yield'
  | 'rebalance'
  | 'custom';

export type IntentStatus =
  | 'created'
  | 'validated'
  | 'active'
  | 'executed'
  | 'expired'
  | 'revoked';

export interface IntentConstraint {
  type: 'minAmount' | 'maxAmount' | 'priceLimit' | 'timeWindow' | 'slippage';
  value: string | number;
  unit?: string;
}

export interface IntentBase {
  id?: string;
  description: string;
  status?: IntentStatus;
  createdAt?: string;
  expiresAt?: string;
  fallback?: string;
  constraints: IntentConstraint[];
}

/* =========================
   INTENT VARIANTS
========================= */

export interface IntentSwap {
  type: 'swap';
  tokenIn: string;
  tokenOut: string;
  amount: string;
  slippage: number;
  constraints: IntentConstraint[];
}

export interface IntentStake {
  type: 'stake';
  token: string;
  amount: string;
  protocol: string;
  constraints: IntentConstraint[];
}

export interface IntentBridge {
  type: 'bridge';
  token: string;
  amount: string;
  fromChain: string;
  toChain: string;
  constraints: IntentConstraint[];
}

export type Intent = (IntentSwap | IntentStake | IntentBridge) & IntentBase;

/* =========================
   AI PARSING
========================= */

export interface AIIntentParseRequest {
  userInput: string;
  walletAddress: string;
}

export interface AIIntentParseResponse {
  success: boolean;
  intent?: Intent;
  error?: string;
  confidence?: number;
}

/* =========================
   TOKEN / QUOTES
========================= */

export interface TokenData {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
  chainId: number;
}

export interface SwapQuote {
  tokenIn: TokenData;
  tokenOut: TokenData;
  amountIn: string;
  amountOut: string;
  price: string;
  priceImpact: number;
  route: string[];
  gasEstimate: string;
}

/* =========================
   LI.FI ANALYZE (NEW)
========================= */

export interface BridgeOption {
  /** Bridge / protocol name (from LI.FI toolDetails.name) */
  name: string;

  /** Logo from LI.FI */
  logo?: string;

  /** Estimated gas cost in USD */
  gasUSD?: string;

  /** Estimated execution time in seconds */
  duration?: number | null;

  /** LI.FI tags: CHEAPEST, FASTEST, RECOMMENDED */
  tags?: string[];
}

export interface SwapOption {
  name: string;
  gasUSD?: string;
  priceImpact?: number;
  route?: string[];
}

/**
 * Response returned by /api/maima/analyze
 * Used directly by ProcessTrackingPanel
 */
export interface AnalyzeReport {
  topBridges: BridgeOption[];
  topSwaps?: SwapOption[];

  /**
   * Full LI.FI routes (kept for execution phase)
   * Used when user selects a bridge
   */
  rawRoutes: any[];
}

/* =========================
   EXECUTION / GOVERNANCE
========================= */

export interface MultisigApproval {
  signer: string;
  signature: string;
  timestamp: number;
}

export interface ExecutionProof {
  intentId: string;
  txHash: string;
  blockNumber: number;
  timestamp: number;
  status: 'success' | 'failed';
}
