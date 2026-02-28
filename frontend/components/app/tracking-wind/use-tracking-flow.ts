'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { ReportRoute } from '@/lib/maima';
import {
  CRE_STREAM_DELAY_MS,
  PROTOCOL_CHECK_DELAY_MS,
  STEP_DELAY_MS,
  DEFAULT_BRIDGES,
  DEFAULT_SWAPS,
  CHAIN_NAMES,
  SEPOLIA_CHAIN_ID,
  SWAP_PROTOCOL_WHITELIST,
  type TrackingPhase,
  type ProcessTrackingState,
  type ProcessTrackingPanelProps,
  type ProtocolStatus,
} from './tracking-types';
import {
  formatTime,
  formatPair,
  formatTokenAmount,
  getApprovalAddress,
  getTransactionHint,
  isNativeToken,
  normalizeProtocolName,
  parseGasFee,
  scoreForIndex,
} from './tracking-helpers';

/** Filter out CRE CLI warning about default private key; we use connected wallet for real execution. */
function filterCrePrivateKeyWarning(line: string): boolean {
  const lower = line.toLowerCase();
  return !(
    lower.includes('default private key') &&
    (lower.includes('chain write simulation') || lower.includes('cre_eth_private_key'))
  );
}

export function useTrackingFlow({
  open,
  prompt,
  report,
  isWaitingForReport = false,
  onComplete,
  onStepComplete,
  onExecuteStart,
}: ProcessTrackingPanelProps) {
  const chainId = SEPOLIA_CHAIN_ID;
  const [phase, setPhase] = useState<TrackingPhase>('steps');
  const [stepIndex, setStepIndex] = useState(0);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [protocolStatuses, setProtocolStatuses] = useState<Record<number, ProtocolStatus>>({});
  const [checkingIndex, setCheckingIndex] = useState(0);
  const [protocolsToCheckList, setProtocolsToCheckList] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [executeLogs, setExecuteLogs] = useState<string[]>([]);
  const [finalResult, setFinalResult] = useState<ProcessTrackingState['finalResult']>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const followTailRef = useRef(true);
  const creMaimaRunRef = useRef(false);
  const [isStreamingCreLog, setIsStreamingCreLog] = useState(false);
  const [isStreamingExecuteLog, setIsStreamingExecuteLog] = useState(false);

  const inferredType: 'swap' | 'bridge' =
    report?.intentType ?? report?.bestRoute?.type ?? (/bridge|cross-chain|transfer.*chain/i.test(prompt) ? 'bridge' : 'swap');
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
    return filteredRoutes;
  }, [filteredRoutes]);

  const fallbackTop = (inferredType === 'bridge' ? DEFAULT_BRIDGES : DEFAULT_SWAPS)
    .filter((name) =>
      inferredType === 'swap' && enforceSwapWhitelist
        ? swapWhitelistSet.has(normalizeProtocolName(name))
        : true
    )
    .slice(0, 4)
    .map((name, i) => ({
      name,
      metrics: {
        fee: '$0.00',
        duration: '30s',
        reliability: '99.9%',
        liquidity: 'High'
      }
    }));

  const topRoutes = sortedRoutes.length ? sortedRoutes.slice(0, 4) : [];

  const top4 = useMemo(() => {
    if (report?.ranking && report.ranking.length > 0) {
      return report.ranking.slice(0, 4).map((r) => ({
        name: r.protocol,
        metrics: {
          fee: r.feeUSD !== null && r.feeUSD !== undefined ? `$${r.feeUSD.toFixed(4)}` : 'N/A',
          duration: r.executionDuration ? `${Math.round(r.executionDuration)}s` : '?',
          reliability: r.reliabilityScore || 'N/A',
          liquidity: r.liquidityScore || 'N/A',
        }
      }));
    }

    // Fallback if no ranking array exists
    return topRoutes.length
      ? topRoutes.map((route) => ({
        name: route.mainTool,
        metrics: {
          fee: route.gasCostUSD ? `$${route.gasCostUSD}` : 'N/A',
          duration: route.executionDuration ? Math.round(route.executionDuration) + 's' : '?',
          reliability: route.reliabilityScore || 'N/A',
          liquidity: route.liquidityScore || 'N/A',
        }
      }))
      : (report ? [] : fallbackTop);
  }, [report, topRoutes, fallbackTop]);

  const protocolNames = useMemo(() => {
    if (report?.ranking && report.ranking.length > 0) {
      return Array.from(new Set(report.ranking.map((r) => r.protocol)));
    }
    if (sortedRoutes.length) {
      return Array.from(new Set(sortedRoutes.map((route) => route.mainTool)));
    }
    if (report) return [];
    const baseList = inferredType === 'bridge' ? DEFAULT_BRIDGES : DEFAULT_SWAPS;
    return baseList.filter((name) =>
      inferredType === 'swap' && enforceSwapWhitelist
        ? swapWhitelistSet.has(normalizeProtocolName(name))
        : true
    );
  }, [report?.ranking, sortedRoutes, inferredType, enforceSwapWhitelist, swapWhitelistSet]);

  const protocolsToCheck = useMemo(() => protocolNames.slice(0, 6), [protocolNames]);

  const protocolFeeMap = useMemo(() => {
    const map = new Map<string, string>();
    if (report?.ranking && report.ranking.length > 0) {
      report.ranking.forEach(r => {
        map.set(r.protocol, r.feeUSD !== null && r.feeUSD !== undefined ? `$${r.feeUSD.toFixed(4)}` : 'N/A');
      });
      return map;
    }
    if (filteredRoutes.length) {
      filteredRoutes.forEach(route => {
        map.set(route.mainTool, route.gasCostUSD ? `$${route.gasCostUSD}` : 'N/A');
      });
    }
    return map;
  }, [report?.ranking, filteredRoutes]);

  useEffect(() => {
    if (open) {
      creMaimaRunRef.current = false;
      setPhase('steps');
      setStepIndex(0);
      setLogLines([]);
      setProtocolStatuses({});
      setCheckingIndex(0);
      setProtocolsToCheckList([]);
      setSelectedIndex(null);
      setExecuteLogs([]);
      setFinalResult(null);
      setIsStreamingCreLog(false);
      setIsStreamingExecuteLog(false);
      followTailRef.current = true;
    }
  }, [open, prompt]);

  // Scroll to bottom when content changes; run after layout so new content is in the DOM
  useEffect(() => {
    if (!followTailRef.current) return;
    const runAfterLayout = () => {
      const endEl = logEndRef.current;
      if (endEl) {
        endEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
      } else {
        const container = scrollContainerRef.current;
        if (container) {
          container.scrollTo({
            top: container.scrollHeight - container.clientHeight,
            behavior: 'smooth',
          });
        }
      }
    };
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(runAfterLayout);
    });
    return () => cancelAnimationFrame(id);
  }, [logLines, executeLogs, protocolStatuses, phase, isStreamingCreLog, isStreamingExecuteLog]);

  // Simulation mode: run cre-maima when report (with simulationMode) is available
  useEffect(() => {
    if (!open || !report?.simulationMode || creMaimaRunRef.current) return;
    creMaimaRunRef.current = true;
    const intentType =
      report?.intentType ??
      report?.bestRoute?.type ??
      (/bridge|cross-chain|transfer.*chain/i.test(prompt ?? '') ? 'bridge' : 'swap');
    const pairStr = formatPair(report?.bestRoute);
    const selectionReason = (report?.selectionReason ?? '').trim() || '(none provided)';
    setLogLines([
      `[${formatTime()}] Input checked: ${intentType}.`,
      `[${formatTime()}] Input pair: ${pairStr}.`,
      `[${formatTime()}] Running cre-maima workflow.`,
    ]);
    setIsStreamingCreLog(true);
    (async () => {
      const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
      try {
        const res = await fetch('/api/cre', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'maima' }),
        });
        const data = await res.json();
        const output = typeof data.output === 'string' ? data.output : '';
        const lines = output
          .split(/\r?\n/)
          .map((l: string) => l.trim())
          .filter(Boolean)
          .filter(filterCrePrivateKeyWarning);
        if (lines.length) {
          await delay(CRE_STREAM_DELAY_MS);
          setLogLines((prev) => [...prev, lines[0]]);
          for (let i = 1; i < lines.length; i++) {
            await delay(CRE_STREAM_DELAY_MS);
            setLogLines((prev) => [...prev, lines[i]]);
          }
        }
        await delay(CRE_STREAM_DELAY_MS);

        const hasRoutes = Array.isArray(report?.routes) && report.routes.length > 0;
        if (!hasRoutes) {
          setLogLines((prev) => [
            ...prev,
            `[${formatTime()}] Selection error: ${report?.summary ?? 'No valid routes were found.'}`,
            `[${formatTime()}] No valid routes were found for this request.`,
          ]);
          setPhase('done');
          onStepComplete();
          return;
        }

        setLogLines((prev) => [
          ...prev,
          `[${formatTime()}] Checking protocols.`,
          `[${formatTime()}] Analysing best protocol for this ${intentType} pair.`,
          `[${formatTime()}] Found the best one. Reason: ${selectionReason}.`,
        ]);
        setPhase('choose');
      } catch {
        setLogLines((prev) => [...prev, `[${formatTime()}] CRE maima run failed (check CRE CLI and server).`]);
      } finally {
        setIsStreamingCreLog(false);
      }
      onStepComplete();
    })();
  }, [open, report?.simulationMode, report?.intentType, report?.bestRoute, report?.selectionReason, prompt, onStepComplete]);

  // When waiting for report, show CRE waiting message and tip after delay
  useEffect(() => {
    if (!open || !isWaitingForReport || report) return;
    const t1 = setTimeout(() => {
      setLogLines((prev) => {
        if (prev.some((l) => l.includes('Waiting for CRE backend'))) return prev;
        return [...prev, `[${formatTime()}] Waiting for CRE backend… (this may take 10–30s)`];
      });
    }, 2000);
    const t2 = setTimeout(() => {
      setLogLines((prev) => {
        if (prev.some((l) => l.includes('cre workflow simulate'))) return prev;
        return [...prev, `[${formatTime()}] Tip: Run CRE from repo root: cre workflow simulate cre/cre-maima --target staging-settings`];
      });
    }, 14000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [open, isWaitingForReport, report]);

  // Phase 1: Initial steps (skip when simulation mode)
  useEffect(() => {
    if (!open || phase !== 'steps' || report?.simulationMode) return;
    if (stepIndex === 0) {
      const t = setTimeout(() => {
        setLogLines((prev) => [...prev, `[${formatTime()}] Getting your input pair...`]);
        setStepIndex(1);
      }, STEP_DELAY_MS);
      return () => clearTimeout(t);
    }
    if (stepIndex === 1) {
      if (!report) {
        // Wait for report to populate routes.
        return;
      }

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
  }, [open, phase, stepIndex, inferredType, protocolNames, protocolsToCheck, report]);

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
      const route = filteredRoutes.find(r => r.mainTool === name);
      const fee = route?.gasCostUSD ? `$${route.gasCostUSD}` : 'N/A';
      const duration = route?.executionDuration ? `${Math.round(route.executionDuration)}s` : 'N/A';
      const reliability = route?.reliabilityScore ?? 'N/A';
      const liquidity = route?.liquidityScore ?? 'N/A';
      const isOracleVerified = report?.accuracy?.includes('Oracle');

      setLogLines((prev) => [
        ...prev,
        `[${formatTime()}]   Pair exists. Route available.`,
        isOracleVerified ? `[${formatTime()}]   Verified via Chainlink Oracle Network.` : null,
        `[${formatTime()}]   Fee: ${fee} | Time: ${duration} | Success: ${reliability} | Liq: ${liquidity}`,
      ].filter(Boolean) as string[]);
    }, PROTOCOL_CHECK_DELAY_MS * 0.5);

    const t2 = setTimeout(() => {
      const isOracleVerified = report?.accuracy?.includes('Oracle');
      setProtocolStatuses((prev) => ({ ...prev, [checkingIndex]: 'checked' }));
      setLogLines((prev) => [...prev, `[${formatTime()}]   ${name} ${isOracleVerified ? 'verified via Chainlink' : 'OK'}`]);
      setCheckingIndex((i) => i + 1);
    }, PROTOCOL_CHECK_DELAY_MS);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [open, phase, checkingIndex, protocolsToCheckList, protocolFeeMap]);

  // When checking done, show choose
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
    onExecuteStart?.();

    // Set one line immediately so the execution block is visible even if something throws later (e.g. CSP/eval in prod)
    setExecuteLogs((prev) => [...prev, `[${formatTime()}] Starting execution for selection #${index + 1}...`]);

    let selectedRoute = topRoutes[index] ?? null;
    if (report?.ranking && report.ranking.length > 0) {
      const selectedProtocolName = top4[index]?.name;
      selectedRoute = report.routes?.find((r) => r.mainTool === selectedProtocolName) ?? selectedRoute;
    }

    if (!selectedRoute && !top4[index]) {
      setExecuteLogs((prev) => [...prev, `[${formatTime()}] No live route available. Try again.`]);
      setPhase('choose');
      setSelectedIndex(null);
      return;
    }

    let protocol: string;
    let pair: string;
    let fee: string;
    let inputAmount: string;
    let outputAmount: string;
    try {
      protocol = selectedRoute?.mainTool ?? top4[index]?.name ?? `Protocol ${index + 1}`;
      pair = formatPair(selectedRoute);
      fee = selectedRoute?.gasCostUSD ? `$${selectedRoute.gasCostUSD}` : 'N/A';
      inputAmount = selectedRoute
        ? formatTokenAmount(selectedRoute.fromAmount, selectedRoute.fromToken?.decimals, selectedRoute.fromToken?.symbol)
        : `${prompt.match(/\d+/)?.[0] ?? '100'} ${inferredType === 'bridge' ? 'USDT' : 'USDC'}`;
      outputAmount = selectedRoute
        ? formatTokenAmount(selectedRoute.toAmount, selectedRoute.toToken?.decimals, selectedRoute.toToken?.symbol)
        : inferredType === 'bridge'
          ? inputAmount
          : (Number(prompt.match(/\d+/)?.[0] ?? '100') * 0.05).toFixed(4) + ' ETH';
    } catch (err) {
      setExecuteLogs((prev) => [
        ...prev,
        `[${formatTime()}] User chose protocol #${index + 1}.`,
        `[${formatTime()}] Execution error: ${err instanceof Error ? err.message : 'Unknown error'}.`,
      ]);
      setPhase('choose');
      setSelectedIndex(null);
      return;
    }

    let payloadLogs: string[] = [];
    if (selectedRoute) {
      const fromChainId = selectedRoute.fromToken?.chainId ?? 1;
      const toChainId = selectedRoute.toToken?.chainId ?? 1;
      const fromChain = CHAIN_NAMES[fromChainId] ?? String(fromChainId);
      const toChain = CHAIN_NAMES[toChainId] ?? String(toChainId);
      const fromAddress = selectedRoute.fromToken?.address ?? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
      const toAddress = selectedRoute.toToken?.address ?? '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

      payloadLogs = [
        `[${formatTime()}] --- LI.FI Routing Payload ---`,
        `[${formatTime()}] Source Chain: ${fromChain} (${fromChainId})`,
        `[${formatTime()}] Dest Chain: ${toChain} (${toChainId})`,
        `[${formatTime()}] Source Token: ${fromAddress}`,
        `[${formatTime()}] Dest Token: ${toAddress}`,
        `[${formatTime()}] Amount (wei): ${selectedRoute.fromAmount ?? '0'}`,
        `[${formatTime()}] ---------------------------`
      ];

      if (report?.chainlink?.prices && report.chainlink.prices.length > 0) {
        payloadLogs.push(`[${formatTime()}] --- Chainlink Oracle ---`);
        report.chainlink.prices.forEach((p: { symbol: string; price: string }) => {
          payloadLogs.push(`[${formatTime()}] Verified ${p.symbol}: ${p.price}`);
        });
        payloadLogs.push(`[${formatTime()}] ---------------------------`);
      }
    }

    setExecuteLogs((prev) => [
      ...prev,
      `[${formatTime()}] User chose ${protocol}. Execution process continues below.`,
      `[${formatTime()}] Chosen: ${protocol}`,
      `[${formatTime()}] Input pair: ${pair}.`,
      `[${formatTime()}] Fee: ${fee}`,
      `[${formatTime()}] Input: ${inputAmount}`,
      `[${formatTime()}] Output (estimated): ${outputAmount}`,
      ...payloadLogs
    ]);

    // Execution block replaces the previous wagmi dependencies and purely simulates
    setExecuteLogs((prev) => [
      ...prev,
      `[${formatTime()}] Simulation execution: running cre-${inferredType} workflow.`,
    ]);
    setIsStreamingExecuteLog(true);
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    try {
      const res = await fetch('/api/cre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: inferredType }),
      });
      const data = await res.json();
      const output = typeof data.output === 'string' ? data.output : '';
      const lines = output
        .split(/\r?\n/)
        .map((line: string) => line.trim())
        .filter(Boolean)
        .filter(filterCrePrivateKeyWarning);
      if (lines.length) {
        for (const line of lines) {
          await delay(CRE_STREAM_DELAY_MS);
          setExecuteLogs((prev) => [...prev, line]);
        }
      } else {
        setExecuteLogs((prev) => [...prev, '(no output from CRE workflow)']);
      }
    } catch {
      setExecuteLogs((prev) => [...prev, `[${formatTime()}] CRE run failed (check CRE CLI and server).`]);
    } finally {
      setIsStreamingExecuteLog(false);
    }
    const result = {
      protocol,
      pair,
      fee,
      inputAmount,
      outputAmount,
      txHash: '0xsimulation',
      approvalHash: 'N/A',
      accuracy: report?.accuracy ?? 'N/A'
    };
    setFinalResult(result);
    setPhase('done');
    onComplete(result);
  };

  return {
    scrollContainerRef,
    logEndRef,
    followTailRef,
    phase,
    inferredType,
    logLines,
    protocolsToCheckList,
    protocolsToCheck,
    protocolStatuses,
    top4,
    selectedIndex,
    executeLogs,
    finalResult,
    isStreamingCreLog,
    isStreamingExecuteLog,
    stepIndex,
    handleChoose,
  };
}
