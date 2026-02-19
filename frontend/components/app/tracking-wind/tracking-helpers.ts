import type { ReportRoute } from '@/lib/maima';
import { CHAIN_NAMES, ZERO_ADDRESS, NATIVE_TOKEN_ADDRESS } from './tracking-types';

export function formatTime() {
  return new Date().toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatChainName(chainId?: number) {
  if (!chainId && chainId !== 0) return 'Unknown';
  return CHAIN_NAMES[chainId] ?? `Chain ${chainId}`;
}

export function formatTokenAmount(amount?: string, decimals?: number, symbol?: string) {
  if (!amount) return symbol ? `0 ${symbol}` : '0';
  if (decimals === undefined || decimals === null || Number.isNaN(decimals)) {
    return symbol ? `${amount} ${symbol}` : amount;
  }
  try {
    const raw = BigInt(amount);
    const divisor = BigInt(10) ** BigInt(decimals);
    const whole = raw / divisor;
    const fraction = raw % divisor;
    let fractionStr = fraction.toString().padStart(decimals, '0');
    fractionStr = fractionStr.replace(/0+$/, '');
    const formatted = fractionStr ? `${whole.toString()}.${fractionStr}` : whole.toString();
    return symbol ? `${formatted} ${symbol}` : formatted;
  } catch {
    return symbol ? `${amount} ${symbol}` : amount;
  }
}

export function shortenHash(value: string, head = 6, tail = 4) {
  if (value.length <= head + tail + 2) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

export function getApprovalAddress(route?: ReportRoute | null) {
  if (!route?.steps?.length) return 'Not required';
  for (const step of route.steps) {
    const approval = (step as { estimate?: { approvalAddress?: string } })?.estimate?.approvalAddress as string | undefined;
    if (approval && approval.toLowerCase() !== ZERO_ADDRESS) return approval;
  }
  return 'Not required';
}

export function isNativeToken(address?: string) {
  if (!address) return false;
  const normalized = address.toLowerCase();
  return normalized === ZERO_ADDRESS || normalized === NATIVE_TOKEN_ADDRESS.toLowerCase();
}

export function normalizeProtocolName(name?: string) {
  return (name ?? '').trim().toLowerCase();
}

export function parseGasFee(value?: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getTransactionHint(route?: ReportRoute | null) {
  if (!route?.steps?.length) return 'Not submitted (requires wallet)';
  const stepWithTx = route.steps.find((step) => (step as { transactionRequest?: unknown })?.transactionRequest);
  const tx = (stepWithTx as { transactionRequest?: { to?: string } })?.transactionRequest;
  if (!tx) return 'Not submitted (requires wallet)';
  if (tx.to) return `TransactionRequest to ${shortenHash(tx.to)}`;
  return 'TransactionRequest ready';
}

export function formatPair(route?: ReportRoute | null) {
  if (!route) return 'USDC -> ETH';
  const fromSymbol = route.fromToken?.symbol ?? 'Token';
  const toSymbol = route.toToken?.symbol ?? 'Token';
  const fromChain = formatChainName(route.fromToken?.chainId);
  const toChain = formatChainName(route.toToken?.chainId);
  return `${fromSymbol} (${fromChain}) -> ${toSymbol} (${toChain})`;
}

export function scoreForIndex(index: number): string {
  const base = 98 - index * 2;
  return `${Math.max(90, base)}%`;
}
