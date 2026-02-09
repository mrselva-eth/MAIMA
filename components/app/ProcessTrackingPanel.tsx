'use client';

import { useState, useEffect, useRef } from 'react';
import type { AnalyzeReport } from '@/lib/maima-types';

const THEME_COLOR = '#1e40af';

const STEP_DELAY_MS = 1400;
const PROTOCOL_CHECK_DELAY_MS = 1600;

const DEFAULT_BRIDGES = ['Stargate', 'Across', 'Hop', 'Synapse', 'Celer cBridge'];
const DEFAULT_SWAPS = ['Uniswap V3', '1inch', 'Curve', 'KyberSwap', 'Paraswap'];

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

type ProtocolStatus = 'pending' | 'checking' | 'checked';

function formatTime() {
  return new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

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
  const [phase, setPhase] = useState<TrackingPhase>('steps');
  const [stepIndex, setStepIndex] = useState(0);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [protocolStatuses, setProtocolStatuses] = useState<Record<number, ProtocolStatus>>({});
  const [checkingIndex, setCheckingIndex] = useState(0);
  /** Stable list of protocol names for the current checking run (avoids effect re-run loops) */
  const [protocolsToCheckList, setProtocolsToCheckList] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [executeLogs, setExecuteLogs] = useState<string[]>([]);
  const [finalResult, setFinalResult] = useState<ProcessTrackingState['finalResult']>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const type: 'swap' | 'bridge' = /bridge|cross-chain|transfer.*chain/i.test(prompt) ? 'bridge' : 'swap';
  const topList = type === 'bridge' ? (report?.topBridges ?? []) : (report?.topSwaps ?? []);
  const top4 = topList.slice(0, 4);
  const protocolNames = type === 'bridge'
    ? (report ? report.topBridges.map((b) => b.name) : DEFAULT_BRIDGES)
    : (report ? report.topSwaps.map((s) => s.name) : DEFAULT_SWAPS);
  const protocolsToCheck = protocolNames.slice(0, 5);

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
        setLogLines((prev) => [...prev, `[${formatTime()}] Getting your input pair…`]);
        setStepIndex(1);
      }, STEP_DELAY_MS);
      return () => clearTimeout(t);
    }
    if (stepIndex === 1) {
      const t = setTimeout(() => {
        setLogLines((prev) => [...prev, `[${formatTime()}] Listing ${type} protocols…`]);
        setStepIndex(2);
      }, STEP_DELAY_MS);
      return () => clearTimeout(t);
    }
    if (stepIndex === 2) {
      const list = protocolsToCheck.length ? [...protocolsToCheck] : protocolNames.slice(0, 5);
      setProtocolsToCheckList(list);
      setPhase('checking');
      setCheckingIndex(0);
      setProtocolStatuses(() => Object.fromEntries(list.map((_, i) => [i, 'pending'])));
      return;
    }
  }, [open, phase, stepIndex, type, protocolsToCheck.length]);

  // Phase 2: Check each protocol (with icon placeholder and status)
  // Depends only on stable protocolsToCheckList (set once when entering checking) and checkingIndex
  useEffect(() => {
    if (!open || phase !== 'checking' || protocolsToCheckList.length === 0) return;
    if (checkingIndex >= protocolsToCheckList.length) {
      setLogLines((prev) => [
        ...prev,
        `[${formatTime()}] Checking route available…`,
        `[${formatTime()}] Checking price and fees…`,
        `[${formatTime()}] Ranking top protocols…`,
      ]);
      setPhase('steps');
      setStepIndex(3);
      return;
    }
    const name = protocolsToCheckList[checkingIndex];
    setProtocolStatuses((prev) => ({ ...prev, [checkingIndex]: 'checking' }));
    setLogLines((prev) => [...prev, `[${formatTime()}] Checking ${name}…`]);

    const t1 = setTimeout(() => {
      setLogLines((prev) => [
        ...prev,
        `[${formatTime()}]   Pair exists. Route available.`,
        `[${formatTime()}]   Fee: ${(0.0008 + Math.random() * 0.0004).toFixed(4)} ETH`,
      ]);
    }, PROTOCOL_CHECK_DELAY_MS * 0.5);

    const t2 = setTimeout(() => {
      setProtocolStatuses((prev) => ({ ...prev, [checkingIndex]: 'checked' }));
      setLogLines((prev) => [...prev, `[${formatTime()}]   ${name} ✓`]);
      setCheckingIndex((i) => i + 1);
    }, PROTOCOL_CHECK_DELAY_MS);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [open, phase, checkingIndex, protocolsToCheckList]);

  // When checking done and report arrived, show choose (after short delay)
  useEffect(() => {
    if (!open || phase !== 'steps' || stepIndex < 3 || !report) return;
    const t = setTimeout(() => {
      setPhase('choose');
      onStepComplete();
    }, STEP_DELAY_MS);
    return () => clearTimeout(t);
  }, [open, phase, stepIndex, report, onStepComplete]);

  const handleChoose = (index: number) => {
    if (phase !== 'choose' || selectedIndex !== null) return;
    setSelectedIndex(index);
    setPhase('execute');
    const protocol = top4[index]?.name ?? `Protocol ${index + 1}`;
    setExecuteLogs((prev) => [...prev, `[${formatTime()}] Chosen: ${protocol}`]);
    const pair = type === 'bridge' ? 'USDT (Ethereum → Arbitrum)' : 'USDC → ETH';
    const fee = type === 'bridge' ? '0.001 ETH' : '0.002 ETH';
    const inputAmount = prompt.match(/\d+/)?.[0] ?? '100';
    const outputAmount = type === 'bridge' ? inputAmount : (Number(inputAmount) * 0.05).toFixed(4);
    setTimeout(() => {
      setExecuteLogs((prev) => [...prev, `[${formatTime()}] Pair: ${pair}`, `[${formatTime()}] Fee: ${fee}`, `[${formatTime()}] Input: ${inputAmount}`, `[${formatTime()}] Output: ${outputAmount}`]);
    }, 600);
    setTimeout(() => {
      setExecuteLogs((prev) => [...prev, `[${formatTime()}] Transaction submitted.`, `[${formatTime()}] Approval (token): 0x${Math.random().toString(16).slice(2, 10)}...`]);
    }, 1200);
    setTimeout(() => {
      const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const approvalHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setFinalResult({
        protocol,
        pair,
        fee,
        inputAmount: inputAmount + (type === 'bridge' ? ' USDT' : ' USDC'),
        outputAmount: outputAmount + (type === 'bridge' ? ' USDT' : ' ETH'),
        txHash,
        approvalHash,
      });
      setPhase('done');
      onComplete({
        protocol,
        pair,
        fee,
        inputAmount: inputAmount + (type === 'bridge' ? ' USDT' : ' USDC'),
        outputAmount: outputAmount + (type === 'bridge' ? ' USDT' : ' ETH'),
        txHash,
        approvalHash,
      });
    }, 2200);
  };

  if (!open) return null;

  return (
    <div className="h-full w-full min-w-0 flex flex-col rounded-xl border border-[#1e40af]/15 bg-gray-900/95 shadow-xl overflow-hidden">
      <div className="shrink-0 px-4 py-3 border-b border-white/10 flex items-center justify-between bg-gray-800/80">
        <div>
          <p className="text-sm font-semibold text-white">Process tracking</p>
          <p className="text-[10px] text-gray-400">{type === 'bridge' ? 'Bridge' : 'Swap'} flow</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="size-6 rounded-none p-1 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="flex-1 min-h-0 min-w-0 w-full overflow-y-auto overflow-x-hidden p-3 font-mono text-[11px] text-gray-300 bg-black/40 space-y-1.5">
        {/* Timeline: logs → protocol block in between → rest of logs; max visual */}
        {(() => {
          const listingIdx = logLines.findIndex((l) => l.includes('Listing') && l.includes('protocols'));
          const preLogs = listingIdx >= 0 ? logLines.slice(0, listingIdx + 1) : logLines;
          const postLogs = listingIdx >= 0 ? logLines.slice(listingIdx + 1) : [];
          const showProtocolBlock =
            (phase === 'checking' || (phase === 'steps' && stepIndex >= 3) || postLogs.length > 0) &&
            (protocolsToCheckList.length > 0 || protocolsToCheck.length > 0);

          return (
            <div className="w-full min-w-0">
            <>
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
                            <span className="text-emerald-400 text-sm font-semibold">✓</span>
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
                  <span className={line.includes('✓') ? 'text-emerald-400/90' : 'text-gray-300'}>{line}</span>
                </div>
              ))}

              {phase === 'choose' && (
                <div className="my-3 pl-7 border-l-2 border-emerald-500/30 ml-2 space-y-2">
                  <p className="text-emerald-400/90 font-medium text-xs">Top 4 {type}s — choose one</p>
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
                      •
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
            </>
            </div>
          );
        })()}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
