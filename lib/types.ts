/**
 * MAIMA Type Definitions
 */

export type IntentType = 'swap' | 'stake' | 'bridge' | 'yield' | 'rebalance' | 'custom';

export type IntentStatus = 'created' | 'validated' | 'active' | 'executed' | 'expired' | 'revoked';

export interface IntentConstraint {
  type: 'minAmount' | 'maxAmount' | 'priceLimit' | 'timeWindow' | 'slippage';
  value: string | number;
  unit?: string;
}

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

export interface IntentBase {
  id?: string;
  description: string;
  status?: IntentStatus;
  createdAt?: string;
  expiresAt?: string;
  fallback?: string;
  constraints: IntentConstraint[];
}

export type Intent = (IntentSwap | IntentStake | IntentBridge) & IntentBase;

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
