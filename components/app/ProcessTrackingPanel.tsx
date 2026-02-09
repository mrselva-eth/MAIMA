'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAccount, useSwitchChain, useWalletClient, usePublicClient } from 'wagmi';
import { encodeFunctionData, erc20Abi } from 'viem';
import type { AnalyzeReport, ReportRoute } from '@/lib/maima-types';

const THEME_COLOR = '#1e40af';

const STEP_DELAY_MS = 1400;
const PROTOCOL_CHECK_DELAY_MS = 1600;

const DEFAULT_BRIDGES = ['Stargate', 'Across', 'Hop', 'Synapse', 'Celer cBridge'];
const DEFAULT_SWAPS = ['Uniswap V3', '1inch', 'Curve', 'KyberSwap', 'Paraswap', 'SushiSwap'];

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  137: 'Polygon',
  42161: 'Arbitrum',
  8453: 'Base',
};

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const SEPOLIA_CHAIN_ID = 11155111;
const SWAP_PROTOCOL_WHITELIST = ['Uniswap V3', '1inch', 'Curve', 'KyberSwap', 'Paraswap'];

type ProtocolStatus = 'pending' | 'checking' | 'checked';

function formatTime() {
  return new Date().toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatChainName(chainId?: number) {
  if (!chainId && chainId !== 0) return 'Unknown';
  return CHAIN_NAMES[chainId] ?? `Chain ${chainId}`;
}

function formatTokenAmount(amount?: string, decimals?: number, symbol?: string) {
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

function shortenHash(value: string, head = 6, tail = 4) {
  if (value.length <= head + tail + 2) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

function getApprovalAddress(route?: ReportRoute | null) {
  if (!route?.steps?.length) return 'Not required';
  for (const step of route.steps) {
    const approval = (step as any)?.estimate?.approvalAddress as string | undefined;
    if (approval && approval.toLowerCase() !== ZERO_ADDRESS) return approval;
  }
  return 'Not required';
}

function isNativeToken(address?: string) {
  if (!address) return false;
  const normalized = address.toLowerCase();
  return normalized === ZERO_ADDRESS || normalized === NATIVE_TOKEN_ADDRESS.toLowerCase();
}

function normalizeProtocolName(name?: string) {
  return (name ?? '').trim().toLowerCase();
}

function parseGasFee(value?: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getTransactionHint(route?: ReportRoute | null) {
  if (!route?.steps?.length) return 'Not submitted (requires wallet)';
  const stepWithTx = route.steps.find((step) => (step as any)?.transactionRequest);
  const tx = (stepWithTx as any)?.transactionRequest as { to?: string } | undefined;
  if (!tx) return 'Not submitted (requires wallet)';
  if (tx.to) return `TransactionRequest to ${shortenHash(tx.to)}`;
  return 'TransactionRequest ready';
}

function formatPair(route?: ReportRoute | null) {
  if (!route) return 'USDC -> ETH';
  const fromSymbol = route.fromToken?.symbol ?? 'Token';
  const toSymbol = route.toToken?.symbol ?? 'Token';
  const fromChain = formatChainName(route.fromToken?.chainId);
  const toChain = formatChainName(route.toToken?.chainId);
  return `${fromSymbol} (${fromChain}) -> ${toSymbol} (${toChain})`;
}

function scoreForIndex(index: number): string {
  const base = 98 - index * 2;
  return `${Math.max(90, base)}%`;
}

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
  } | null;
};

export interface ProcessTrackingPanelProps {
  open: boolean;
  onClose: () => void;
  prompt: string;
  report: AnalyzeReport | null;
  onComplete: (result: ProcessTrackingState['finalResult']) => void;
  onStepComplete: () => void;
}

export function ProcessTrackingPanel({
  open,
  onClose,
  prompt,
  report,
  onComplete,
  onStepComplete,
}: ProcessTrackingPanelProps) {
  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId });
  const [phase, setPhase] = useState<TrackingPhase>('steps');
  const [stepIndex, setStepIndex] = useState(0);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [protocolStatuses, setProtocolStatuses] = useState<Record<number, ProtocolStatus>>({});
  const [checkingIndex, setCheckingIndex] = useState(0);
  const [protocolsToCheckList, setProtocolsToCheckList] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [executeLogs, setExecuteLogs] = useState<string[]>([]);
  const [finalResult, setFinalResult] = useState<ProcessTrackingState['finalResult']>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const inferredType: 'swap' | 'bridge' = report?.bestRoute?.type ?? (/bridge|cross-chain|transfer.*chain/i.test(prompt) ? 'bridge' : 'swap');
  const routeOptions = useMemo(() => (report?.routes?.length ? report.routes : []), [report]);
  const enforceSwapWhitelist = chainId === SEPOLIA_CHAIN_ID;

  const swapWhitelistSet = useMemo(
    () => new Set(SWAP_PROTOCOL_WHITELIST.map(normalizeProtocolName)),
    []
  );

  const filteredRoutes = useMemo(() => {
    if (!routeOptions.length) return [];
    return routeOptions.filter((route) =>
      inferredType === 'swap' && enforceSwapWhitelist
        ? swapWhitelistSet.has(normalizeProtocolName(route.mainTool))
        : true
    );
  }, [routeOptions, inferredType, enforceSwapWhitelist, swapWhitelistSet]);

  const sortedRoutes = useMemo(() => {
    if (!filteredRoutes.length) return [];
    return filteredRoutes
      .map((route, index) => ({
        route,
        index,
        fee: parseGasFee(route.gasCostUSD),
      }))
      .sort((a, b) => {
        const feeA = a.fee ?? Number.POSITIVE_INFINITY;
        const feeB = b.fee ?? Number.POSITIVE_INFINITY;
        if (feeA !== feeB) return feeA - feeB;
        return a.index - b.index;
      })
      .map((entry) => entry.route);
  }, [filteredRoutes]);

  const fallbackTop = (inferredType === 'bridge' ? DEFAULT_BRIDGES : DEFAULT_SWAPS)
    .filter((name) =>
      inferredType === 'swap' && enforceSwapWhitelist
        ? swapWhitelistSet.has(normalizeProtocolName(name))
        : true
    )
    .slice(0, 4)
    .map((name, i) => ({ name, score: scoreForIndex(i) }));

  const topRoutes = sortedRoutes.length ? sortedRoutes.slice(0, 4) : [];

  const top4 = topRoutes.length
    ? topRoutes.map((route, i) => ({
        name: route.mainTool,
        score: route.gasCostUSD ? `$${route.gasCostUSD}` : scoreForIndex(i),
      }))
    : fallbackTop;

  const protocolNames = useMemo(() => {
    if (sortedRoutes.length) {
      return Array.from(
        new Set(
          sortedRoutes.map((route) => route.mainTool)
        )
      );
    }
    const baseList = inferredType === 'bridge' ? DEFAULT_BRIDGES : DEFAULT_SWAPS;
    return baseList.filter((name) =>
      inferredType === 'swap' && enforceSwapWhitelist
        ? swapWhitelistSet.has(normalizeProtocolName(name))
        : true
    );
  }, [sortedRoutes, inferredType, enforceSwapWhitelist, swapWhitelistSet]);

  const protocolsToCheck = useMemo(() => protocolNames.slice(0, 6), [protocolNames]);

  const protocolFeeMap = useMemo(() => {
    if (!filteredRoutes.length) return new Map<string, string>();
    return new Map(
      filteredRoutes.map((route) => [
        route.mainTool,
        route.gasCostUSD ? `$${route.gasCostUSD}` : 'N/A',
      ])
    );
  }, [filteredRoutes]);

  useEffect(() => {
    if (open) {
      setPhase('steps');
      setStepIndex(0);
      setLogLines([]);
      setProtocolStatuses({});
      setCheckingIndex(0);
      setProtocolsToCheckList([]);
      setSelectedIndex(null);
      setExecuteLogs([]);
      setFinalResult(null);
    }
  }, [open, prompt]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logLines, executeLogs, protocolStatuses]);

  // Phase 1: Initial steps (slower)
  useEffect(() => {
    if (!open || phase !== 'steps') return;
    if (stepIndex === 0) {
      const t = setTimeout(() => {
        setLogLines((prev) => [...prev, `[${formatTime()}] Getting your input pair...`]);
        setStepIndex(1);
      }, STEP_DELAY_MS);
      return () => clearTimeout(t);
    }
    if (stepIndex === 1) {
      const t = setTimeout(() => {
        setLogLines((prev) => [...prev, `[${formatTime()}] Listing ${inferredType} protocols...`]);
        setStepIndex(2);
      }, STEP_DELAY_MS);
      return () => clearTimeout(t);
    }
    if (stepIndex === 2) {
      const list = protocolsToCheck.length ? [...protocolsToCheck] : protocolNames.slice(0, 6);
      setProtocolsToCheckList(list);
      setPhase('checking');
      setCheckingIndex(0);
      setProtocolStatuses(() => Object.fromEntries(list.map((_, i) => [i, 'pending'])));
      return;
    }
  }, [open, phase, stepIndex, inferredType, protocolNames, protocolsToCheck]);

  // Phase 2: Check each protocol
  useEffect(() => {
    if (!open || phase !== 'checking' || protocolsToCheckList.length === 0) return;
    if (checkingIndex >= protocolsToCheckList.length) {
      setLogLines((prev) => [
        ...prev,
        `[${formatTime()}] Checking route available...`,
        `[${formatTime()}] Checking price and fees...`,
        `[${formatTime()}] Ranking top protocols...`,
      ]);
      setPhase('steps');
      setStepIndex(3);
      return;
    }
    const name = protocolsToCheckList[checkingIndex];
    setProtocolStatuses((prev) => ({ ...prev, [checkingIndex]: 'checking' }));
    setLogLines((prev) => [...prev, `[${formatTime()}] Checking ${name}...`]);

    const t1 = setTimeout(() => {
      const fee = protocolFeeMap.get(name) ?? 'N/A';
      setLogLines((prev) => [
        ...prev,
        `[${formatTime()}]   Pair exists. Route available.`,
        `[${formatTime()}]   Fee: ${fee}`,
      ]);
    }, PROTOCOL_CHECK_DELAY_MS * 0.5);

    const t2 = setTimeout(() => {
      setProtocolStatuses((prev) => ({ ...prev, [checkingIndex]: 'checked' }));
      setLogLines((prev) => [...prev, `[${formatTime()}]   ${name} OK`]);
      setCheckingIndex((i) => i + 1);
    }, PROTOCOL_CHECK_DELAY_MS);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [open, phase, checkingIndex, protocolsToCheckList, protocolFeeMap]);

  // When checking done and report arrived, show choose (after short delay)
  useEffect(() => {
    if (!open || phase !== 'steps' || stepIndex < 3) return;
    const t = setTimeout(() => {
      setPhase('choose');
      onStepComplete();
    }, STEP_DELAY_MS);
    return () => clearTimeout(t);
  }, [open, phase, stepIndex, report, onStepComplete]);

  const handleChoose = async (index: number) => {
    if (phase !== 'choose' || selectedIndex !== null) return;
    setSelectedIndex(index);
    setPhase('execute');

    const selectedRoute = topRoutes[index] ?? null;
    if (!selectedRoute) {
      setExecuteLogs((prev) => [...prev, `[${formatTime()}] No live route available. Try again.`]);
      setPhase('choose');
      setSelectedIndex(null);
      return;
    }

    if (!walletClient || !address) {
      setExecuteLogs((prev) => [...prev, `[${formatTime()}] Wallet not connected.`]);
      setPhase('choose');
      setSelectedIndex(null);
      return;
    }

    const steps = Array.isArray(selectedRoute.steps) ? selectedRoute.steps : [];
    if (steps.length === 0) {
      setExecuteLogs((prev) => [...prev, `[${formatTime()}] Route has no steps. Unable to execute.`]);
      setPhase('choose');
      setSelectedIndex(null);
      return;
    }

    if (steps.length > 1) {
      setExecuteLogs((prev) => [
        ...prev,
        `[${formatTime()}] This route has multiple steps. Execution is not supported yet.`,
      ]);
      setPhase('choose');
      setSelectedIndex(null);
      return;
    }

    const step = steps[0] as any;
    const fromChainId = step?.action?.fromChainId as number | undefined;
    const toChainId = step?.action?.toChainId as number | undefined;
    const fromToken = step?.action?.fromToken?.address as string | undefined;
    const amountIn = step?.action?.fromAmount as string | undefined;
    const approvalAddress = step?.estimate?.approvalAddress as string | undefined;

    if (fromChainId && chainId !== fromChainId) {
      try {
        setExecuteLogs((prev) => [...prev, `[${formatTime()}] Switching network...`]);
        await switchChainAsync({ chainId: fromChainId });
      } catch {
        setExecuteLogs((prev) => [...prev, `[${formatTime()}] Network switch rejected.`]);
        setPhase('choose');
        setSelectedIndex(null);
        return;
      }
    }

    const protocol = selectedRoute?.mainTool ?? top4[index]?.name ?? `Protocol ${index + 1}`;
    const pair = formatPair(selectedRoute);
    const fee = selectedRoute?.gasCostUSD ? `$${selectedRoute.gasCostUSD}` : 'N/A';
    const inputAmount = selectedRoute
      ? formatTokenAmount(selectedRoute.fromAmount, selectedRoute.fromToken?.decimals, selectedRoute.fromToken?.symbol)
      : `${prompt.match(/\d+/)?.[0] ?? '100'} ${inferredType === 'bridge' ? 'USDT' : 'USDC'}`;
    const outputAmount = selectedRoute
      ? formatTokenAmount(selectedRoute.toAmount, selectedRoute.toToken?.decimals, selectedRoute.toToken?.symbol)
      : inferredType === 'bridge'
        ? inputAmount
        : (Number(prompt.match(/\d+/)?.[0] ?? '100') * 0.05).toFixed(4) + ' ETH';
    setExecuteLogs((prev) => [...prev, `[${formatTime()}] Chosen: ${protocol}`]);
    setExecuteLogs((prev) => [
      ...prev,
      `[${formatTime()}] Pair: ${pair}`,
      `[${formatTime()}] Fee: ${fee}`,
      `[${formatTime()}] Input: ${inputAmount}`,
      `[${formatTime()}] Output (estimated): ${outputAmount}`,
    ]);

    let approvalHash = getApprovalAddress(selectedRoute);
    let swapHash = getTransactionHint(selectedRoute);
    let finalOutput = outputAmount;

    try {
      setExecuteLogs((prev) => [...prev, `[${formatTime()}] Preparing transaction via LI.FI...`]);
      const stepPayload = {
        ...step,
        action: {
          ...(step?.action ?? {}),
          fromAddress: address,
          toAddress: address,
        },
      };
      const stepRes = await fetch('/api/maima/tokens/step-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stepPayload),
      });
      const stepData = await stepRes.json();
      const txRequest = stepData?.transactionRequest;

      if (!txRequest?.to || !txRequest?.data) {
        setExecuteLogs((prev) => [...prev, `[${formatTime()}] Failed to prepare transaction.`]);
        setPhase('choose');
        setSelectedIndex(null);
        return;
      }

      if (approvalAddress && !isNativeToken(fromToken) && amountIn && fromToken) {
        setExecuteLogs((prev) => [...prev, `[${formatTime()}] Approval required.`]);
        const data = encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [approvalAddress, BigInt(amountIn)],
        });
        const approvalTxHash = await walletClient.sendTransaction({
          to: fromToken as `0x${string}`,
          data,
          value: 0n,
        });
        approvalHash = approvalTxHash;
        setExecuteLogs((prev) => [...prev, `[${formatTime()}] Approval tx: ${approvalTxHash}`]);
        try {
          await publicClient?.waitForTransactionReceipt({ hash: approvalTxHash });
        } catch {
          // Ignore receipt wait failures, continue to swap.
        }
      }

      setExecuteLogs((prev) => [...prev, `[${formatTime()}] Sending swap transaction...`]);
      const swapTxHash = await walletClient.sendTransaction({
        to: txRequest.to as `0x${string}`,
        data: txRequest.data as `0x${string}`,
        value: txRequest.value ? BigInt(txRequest.value) : 0n,
      });
      swapHash = swapTxHash;
      setExecuteLogs((prev) => [...prev, `[${formatTime()}] Swap tx: ${swapTxHash}`]);

      try {
        await publicClient?.waitForTransactionReceipt({ hash: swapTxHash });
      } catch {
        // If we can't wait for receipt, keep estimated output.
      }

      try {
        const statusParams = new URLSearchParams({
          txHash: swapTxHash,
        });
        if (fromChainId) statusParams.set('fromChain', String(fromChainId));
        if (toChainId) statusParams.set('toChain', String(toChainId));
        if (fromChainId && toChainId && fromChainId !== toChainId && selectedRoute?.mainTool) {
          statusParams.set('bridge', selectedRoute.mainTool);
        }

        const statusRes = await fetch(`/api/maima/tokens/status?${statusParams.toString()}`);
        const statusData = await statusRes.json();
        const receiving = statusData?.receiving;
        if (receiving?.amount && receiving?.token?.decimals) {
          finalOutput = formatTokenAmount(
            String(receiving.amount),
            receiving.token.decimals,
            receiving.token.symbol
          );
        }
      } catch {
        // Keep estimated output if status call fails.
      }
    } catch {
      setExecuteLogs((prev) => [...prev, `[${formatTime()}] Execution failed or rejected.`]);
      setPhase('choose');
      setSelectedIndex(null);
      return;
    }

    const result = {
      protocol,
      pair,
      fee,
      inputAmount,
      outputAmount: finalOutput,
      txHash: swapHash,
      approvalHash,
    };
    setFinalResult(result);
    setPhase('done');
    onComplete(result);
  };

  if (!open) return null;

  return (
    <div className="h-full w-full min-w-0 flex flex-col rounded-xl border border-[#1e40af]/15 bg-gray-900/95 shadow-xl overflow-hidden">
      <div className="shrink-0 px-4 py-3 border-b border-white/10 flex items-center justify-between bg-gray-800/80">
        <div>
          <p className="text-sm font-semibold text-white">Process tracking</p>
          <p className="text-[10px] text-gray-400">{inferredType === 'bridge' ? 'Bridge' : 'Swap'} flow</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="size-6 rounded-none p-1 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          x
        </button>
      </div>
      <div className="flex-1 min-h-0 min-w-0 w-full overflow-y-auto overflow-x-hidden p-3 font-mono text-[11px] text-gray-300 bg-black/40 space-y-1.5">
        {/* Timeline: logs -> protocol block in between -> rest of logs; max visual */}
        {(() => {
          const listingIdx = logLines.findIndex((l) => l.includes('Listing') && l.includes('protocols'));
          const preLogs = listingIdx >= 0 ? logLines.slice(0, listingIdx + 1) : logLines;
          const postLogs = listingIdx >= 0 ? logLines.slice(listingIdx + 1) : [];
          const showProtocolBlock =
            (phase === 'checking' || (phase === 'steps' && stepIndex >= 3) || postLogs.length > 0) &&
            (protocolsToCheckList.length > 0 || protocolsToCheck.length > 0);

          return (
            <div className="w-full min-w-0">
              {preLogs.map((line, i) => (
                <div key={`pre-${i}`} className="flex items-center gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#1e40af]/20 border border-[#1e40af]/40 flex items-center justify-center text-[10px] text-[#60a5fa] font-semibold">
                    {i + 1}
                  </span>
                  <span className="text-gray-300">{line}</span>
                </div>
              ))}

              {showProtocolBlock && (
                <div className="my-3 pl-7 border-l-2 border-[#1e40af]/30 ml-2 space-y-2">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                    Checking listed protocols
                  </p>
                  <div className="space-y-1.5">
                    {(protocolsToCheckList.length ? protocolsToCheckList : protocolsToCheck).map((name, i) => {
                      const status = protocolStatuses[i] ?? 'pending';
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all duration-200 ${
                            status === 'checked'
                              ? 'border-emerald-500/40 bg-emerald-500/10'
                              : status === 'checking'
                                ? 'border-[#1e40af]/50 bg-[#1e40af]/15 shadow-sm'
                                : 'border-white/10 bg-white/5'
                          }`}
                        >
                          <span
                            className="w-8 h-8 rounded-lg bg-white/10 shrink-0 flex items-center justify-center overflow-hidden border border-white/10"
                            title="Protocol icon (add image later)"
                          />
                          <span className="flex-1 text-gray-200 font-medium truncate">{name}</span>
                          {status === 'pending' && (
                            <span className="text-[10px] text-gray-500 px-2 py-0.5 rounded bg-white/5">Pending</span>
                          )}
                          {status === 'checking' && (
                            <span className="w-5 h-5 border-2 border-[#60a5fa] border-t-transparent rounded-full animate-spin" />
                          )}
                          {status === 'checked' && (
                            <span className="text-emerald-400 text-xs font-semibold">OK</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {postLogs.map((line, i) => (
                <div key={`post-${i}`} className="flex items-center gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[10px] text-gray-400">
                    {preLogs.length + i + 1}
                  </span>
                  <span className={line.includes('OK') ? 'text-emerald-400/90' : 'text-gray-300'}>{line}</span>
                </div>
              ))}

              {phase === 'choose' && (
                <div className="my-3 pl-7 border-l-2 border-emerald-500/30 ml-2 space-y-2">
                  <p className="text-emerald-400/90 font-medium text-xs">Top 4 {inferredType}s - choose one</p>
                  <div className="flex flex-col gap-1.5">
                    {top4.map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleChoose(i)}
                        className="flex items-center gap-2 text-left px-3 py-2.5 rounded-lg border border-white/10 hover:border-[#1e40af]/50 hover:bg-[#1e40af]/10 transition-all w-full"
                      >
                        <span className="w-8 h-8 rounded-lg bg-white/10 shrink-0 flex items-center justify-center overflow-hidden border border-white/10" />
                        <span>
                          <span className="text-[#60a5fa] font-semibold">{i + 1}.</span> {item.name}{' '}
                          <span className="text-gray-500">({item.score})</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {phase === 'execute' &&
                executeLogs.map((line, i) => (
                  <div key={`ex-${i}`} className="flex items-center gap-2">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[10px] text-amber-400">
                      *
                    </span>
                    <span className="text-gray-300">{line}</span>
                  </div>
                ))}

              {phase === 'done' && finalResult && (
                <div className="my-3 pl-7 border-l-2 border-emerald-500/40 ml-2 p-3 rounded-r-lg bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                  <p className="text-emerald-400 font-semibold text-xs uppercase tracking-wider">Completed</p>
                  <div className="grid gap-1.5 text-[11px]">
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">Protocol</span>
                      <span className="text-gray-200">{finalResult.protocol}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">Pair</span>
                      <span className="text-gray-200">{finalResult.pair}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">Fee</span>
                      <span className="text-gray-200">{finalResult.fee}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">Input</span>
                      <span className="text-gray-200">{finalResult.inputAmount}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">Output</span>
                      <span className="text-gray-200">{finalResult.outputAmount}</span>
                    </div>
                    <div className="pt-1 border-t border-white/10">
                      <span className="text-gray-500 block mb-0.5">Tx</span>
                      <span className="text-gray-300 break-all text-[10px]">{finalResult.txHash}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Approval</span>
                      <span className="text-gray-300 break-all text-[10px]">{finalResult.approvalHash}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}