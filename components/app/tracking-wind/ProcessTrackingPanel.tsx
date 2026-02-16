'use client';

import React from 'react';

import type { ProcessTrackingPanelProps } from './tracking-types';
import { useTrackingFlow } from './use-tracking-flow';
import { TrackingChartHeader } from '@/components/design/TrackingChartHeader';
import { useProtocolLogos } from '@/hooks/use-protocol-logos';
import Image from 'next/image';
import {
  Fuel,
  Clock,
  ShieldCheck,
  Droplets,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ReceiptText,
  Loader2
} from 'lucide-react';

export type { TrackingPhase, ProcessTrackingState, ProcessTrackingPanelProps } from './tracking-types';

export function ProcessTrackingPanel({
  open,
  onClose,
  prompt,
  report,
  onComplete,
  onStepComplete,
  onExecuteStart,
}: ProcessTrackingPanelProps) {
  const { getLogoUrl } = useProtocolLogos();
  const {
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
  } = useTrackingFlow({
    open,
    onClose,
    prompt,
    report,
    onComplete,
    onStepComplete,
    onExecuteStart,
  });

  const [viewMode, setViewMode] = React.useState<'logs' | 'table'>('table');

  if (!open) return null;

  // Timestamp (and optional [TAG]) in green; rest of line gray. Supports [12:02:17 PM] and 2026-02-12T12:05:23Z [USER LOG]
  const renderLogLine = (line: string, okGreen = false) => {
    const appTime = line.match(/^(\[\d{1,2}:\d{2}:\d{2}\s*[AP]M\])(\s*.*)$/);
    if (appTime) {
      return (
        <>
          <span className="text-emerald-400">{appTime[1]}</span>
          <span className={okGreen && line.includes('OK') ? 'text-emerald-400/90' : 'text-gray-300'}>{appTime[2]}</span>
        </>
      );
    }
    const creTime = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z(?:\s+\[[^\]]+\])?)(\s*.*)$/);
    if (creTime) {
      return (
        <>
          <span className="text-emerald-400">{creTime[1]}</span>
          <span className="text-gray-300">{creTime[2]}</span>
        </>
      );
    }
    return <span className="text-gray-300">{line}</span>;
  };

  return (
    <div className="h-full w-full min-w-0 flex flex-col rounded-xl border border-[#1e40af]/15 bg-gray-900/95 shadow-xl overflow-hidden">
      <div className="relative shrink-0 px-4 py-3 pr-10 border-b border-white/10 flex items-center justify-between bg-gray-800/80 rounded-t-xl overflow-hidden">
        <TrackingChartHeader />
        <div className="relative z-10 flex flex-col">
          <p className="text-sm font-semibold text-white">Process tracking</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{inferredType === 'bridge' ? 'Bridge' : 'Swap'} flow</p>
        </div>

        {/* View Toggle */}
        <div className="relative z-10 flex bg-black/40 rounded-lg p-0.5 ml-4">
          <button
            type="button"
            onClick={() => setViewMode('logs')}
            className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all ${viewMode === 'logs' ? 'bg-[#1e40af]/40 text-[#60a5fa] shadow-sm' : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            Logs
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all ${viewMode === 'table' ? 'bg-[#1e40af]/40 text-[#60a5fa] shadow-sm' : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            Table
          </button>
        </div>
        <span className="absolute right-10 bottom-2 text-[10px] font-semibold text-[#60a5fa] tracking-wide z-10">
          MAIMING ...
        </span>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 size-6 rounded-none p-1 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white z-10"
          aria-label="Close"
        >
          x
        </button>
      </div>
      <div
        ref={scrollContainerRef}
        onScroll={() => {
          const el = scrollContainerRef.current;
          if (!el) return;
          const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 50;
          followTailRef.current = nearBottom;
        }}
        className="flex-1 min-h-0 min-w-0 w-full overflow-y-auto overflow-x-hidden p-3 font-mono text-[11px] text-gray-300 bg-black/40 space-y-2"
      >

        {viewMode === 'table' ? (
          <div className="w-full min-w-0 space-y-4">
            {/* Protocol List */}
            <div className="space-y-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold px-2">
                {finalResult ? 'Selected Protocol' : 'Select a protocol to execute'}
              </p>
              <div className="flex flex-col gap-2">
                {top4.length > 0 ? top4.map((item, i) => {
                  const isSelected = selectedIndex === i;
                  const dim = finalResult && !isSelected;

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => !finalResult && handleChoose(i)}
                      disabled={!!finalResult}
                      className={`group relative flex flex-col gap-3 text-left p-3.5 rounded-xl border transition-all duration-300 w-full ${isSelected
                        ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                        : dim
                          ? 'border-white/5 bg-white/5 opacity-50'
                          : 'border-white/10 hover:border-[#1e40af]/50 hover:bg-[#1e40af]/10 bg-white/5 hover:-translate-y-0.5'
                        }`}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <span className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center overflow-hidden border transition-colors ${isSelected ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-white/10 border-white/10'
                          }`}>
                          {getLogoUrl(item.name) ? (
                            <Image
                              src={getLogoUrl(item.name)!}
                              alt=""
                              width={32}
                              height={32}
                              className="w-7 h-7 object-contain"
                              unoptimized
                            />
                          ) : (
                            <div className="w-6 h-6 rounded bg-gray-700 animate-pulse" />
                          )}
                        </span>

                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[13px] font-bold truncate ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                              {item.name}
                            </span>
                            {isSelected ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shadow-sm" />
                            ) : !finalResult && (
                              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#60a5fa] group-hover:translate-x-0.5 transition-all" />
                            )}
                          </div>

                          {/* Quality Badge */}
                          <div className="flex gap-1.5 mt-1">
                            {i === 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium uppercase tracking-tighter">Cheapest</span>}
                            {i === 1 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-medium uppercase tracking-tighter">Fastest</span>}
                            {isSelected && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium uppercase tracking-tighter">Best Rank</span>}
                          </div>
                        </div>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 gap-2 mt-1 px-0.5">
                        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-black/20 border border-white/5">
                          <Fuel className="w-3 h-3 text-orange-400/80" />
                          <div className="flex flex-col">
                            <span className="text-[8px] text-gray-500 uppercase leading-none mb-0.5">Gas Fee</span>
                            <span className="text-[10px] text-gray-200 font-medium leading-none">{item.metrics.fee}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-black/20 border border-white/5">
                          <Clock className="w-3 h-3 text-blue-400/80" />
                          <div className="flex flex-col">
                            <span className="text-[8px] text-gray-500 uppercase leading-none mb-0.5">Est. Time</span>
                            <span className="text-[10px] text-gray-200 font-medium leading-none">{item.metrics.duration}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-black/20 border border-white/5">
                          <ShieldCheck className="w-3 h-3 text-emerald-400/80" />
                          <div className="flex flex-col">
                            <span className="text-[8px] text-gray-500 uppercase leading-none mb-0.5">Reliability</span>
                            <span className="text-[10px] text-gray-200 font-medium leading-none">{item.metrics.reliability}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-black/20 border border-white/5">
                          <Droplets className="w-3 h-3 text-cyan-400/80" />
                          <div className="flex flex-col">
                            <span className="text-[8px] text-gray-500 uppercase leading-none mb-0.5">Liquidity</span>
                            <span className="text-[10px] text-gray-200 font-medium leading-none">{item.metrics.liquidity}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                }) : (
                  /* Skeleton Loaders */
                  [1, 2, 3, 4].map((n) => (
                    <div key={n} className="flex flex-col gap-3 p-3.5 rounded-xl border border-white/5 bg-white/5 animate-pulse">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10" />
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-3 w-1/3 bg-white/10 rounded" />
                          <div className="h-2 w-1/4 bg-white/10 rounded" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[1, 2, 3, 4].map((m) => (
                          <div key={m} className="h-8 bg-black/20 rounded-lg border border-white/5" />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Execution Status: Success, Failure, or Processing */}
            {finalResult ? (
              // SUCCESS STATE
              <div className="relative group overflow-hidden bg-gray-900 border border-emerald-500/30 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                {/* Digital Receipt Header */}
                <div className="bg-emerald-500/10 px-4 py-3 flex items-center justify-between border-b border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Transaction Success</span>
                  </div>
                  <ReceiptText className="w-4 h-4 text-emerald-500/50" />
                </div>

                {/* Receipt Body */}
                <div className="p-4 space-y-4 relative">
                  {/* Decorative Receipt Cutout */}
                  <div className="absolute -left-2 top-0 bottom-0 w-1 flex flex-col justify-around pointer-events-none opacity-20">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="w-2 h-2 rounded-full bg-white" />)}
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    <div className="space-y-1">
                      <p className="text-[9px] text-gray-500 uppercase tracking-tight">Output Amount</p>
                      <p className="text-[13px] font-bold text-white leading-none font-sans">{finalResult.outputAmount}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[9px] text-gray-500 uppercase tracking-tight">Protocol Used</p>
                      <p className="text-[11px] font-semibold text-emerald-400 leading-none">{finalResult.protocol}</p>
                    </div>
                    <div className="space-y-1 pt-1 border-t border-white/5">
                      <p className="text-[9px] text-gray-500 uppercase tracking-tight">Fee Paid</p>
                      <p className="text-[11px] font-medium text-gray-300 leading-none">{finalResult.fee}</p>
                    </div>
                    <div className="space-y-1 pt-1 border-t border-white/5 text-right">
                      <p className="text-[9px] text-gray-500 uppercase tracking-tight">Time</p>
                      <p className="text-[10px] text-gray-400 leading-none">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>

                  {/* Transaction Reference */}
                  <div className="pt-3 border-t-2 border-dashed border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-gray-500 uppercase">Transaction Hash</span>
                      <span className="text-[8px] text-emerald-500/60 font-mono">CONFIRMED</span>
                    </div>
                    <a
                      href={`https://polygonscan.com/tx/${finalResult.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between w-full p-2 rounded-lg bg-black/40 border border-white/5 hover:border-[#60a5fa]/30 transition-all group/link"
                    >
                      <span className="text-[10px] font-mono text-gray-400 truncate max-w-[200px]">{finalResult.txHash}</span>
                      <ExternalLink className="w-3 h-3 text-[#60a5fa] opacity-60 group-hover/link:opacity-100" />
                    </a>
                  </div>
                </div>

                {/* Receipt Footer Design */}
                <div className="h-1.5 w-full bg-[radial-gradient(circle_at_center,_#10b981_0%,_transparent_70%)] opacity-30" />
              </div>
            ) : phase === 'execute' ? (
              // PROCESSING STATE
              <div className="relative overflow-hidden bg-[#1e40af]/5 border border-[#1e40af]/20 rounded-xl p-4 space-y-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-[#60a5fa] animate-spin" />
                  <div className="flex flex-col">
                    <p className="text-[#60a5fa] font-bold text-[11px] uppercase tracking-widest">
                      Processing Blockchain Interaction
                    </p>
                    <p className="text-[9px] text-gray-500 font-medium">Please wait for confirmation...</p>
                  </div>
                </div>

                {/* Progress Bar Simulation */}
                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-[#1e40af] to-[#60a5fa] w-2/3 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                </div>

                <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                  {executeLogs.slice(-1).map((log, i) => (
                    <p key={i} className="text-[10px] text-gray-400 truncate font-mono flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-[#60a5fa]" />
                      {log.replace(/^\[.*?\]\s*/, '')}
                    </p>
                  ))}
                </div>
              </div>
            ) : executeLogs.length > 0 && !finalResult ? (
              // FAILURE STATE
              <div className="relative overflow-hidden bg-red-500/5 border border-red-500/20 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-full bg-red-500/20 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-red-400 font-bold text-[11px] uppercase tracking-widest">
                      Execution Encountered an Error
                    </p>
                    <p className="text-[9px] text-gray-500 font-medium">Your funds are safe on the source chain.</p>
                  </div>
                </div>

                <div className="bg-black/30 p-3 rounded-lg border border-red-500/10 font-mono text-[10px] text-red-300/80 leading-relaxed">
                  {executeLogs[executeLogs.length - 1]?.replace(/^\[.*?\]\s*/, '') || 'Unknown error occurred'}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    // Logic to reset and try again is handled by the hook resetting phase
                  }}
                  className="w-full py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-red-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Try Again
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          (() => {
            const listingIdx = logLines.findIndex((l) => l.includes('Listing') && l.includes('protocols'));
            const preLogs = listingIdx >= 0 ? logLines.slice(0, listingIdx + 1) : logLines;
            const postLogs = listingIdx >= 0 ? logLines.slice(listingIdx + 1) : [];
            const showProtocolBlock =
              (phase === 'checking' || (phase === 'steps' && stepIndex >= 3) || postLogs.length > 0) &&
              (protocolsToCheckList.length > 0 || protocolsToCheck.length > 0);

            return (
              <div className="w-full min-w-0">
                {preLogs.map((line, i) => (
                  <div key={`pre-${i}`} className="flex items-center gap-2 py-1">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-[#1e40af]/20 border border-[#1e40af]/40 flex items-center justify-center text-[10px] text-[#60a5fa] font-semibold">
                      {i + 1}
                    </span>
                    <span>{renderLogLine(line)}</span>
                  </div>
                ))}

                {isStreamingCreLog && (
                  <div className="flex items-center gap-2 py-1" ref={logEndRef}>
                    <span className="shrink-0 w-5 h-5 rounded-full bg-[#1e40af]/20 border border-[#1e40af]/40 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] animate-pulse" />
                    </span>
                    <span className="inline-block w-2 h-4 bg-[#60a5fa]/90 animate-pulse" aria-hidden />
                  </div>
                )}

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
                            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all duration-200 ${status === 'checked'
                              ? 'border-emerald-500/40 bg-emerald-500/10'
                              : status === 'checking'
                                ? 'border-[#1e40af]/50 bg-[#1e40af]/15 shadow-sm'
                                : 'border-white/10 bg-white/5'
                              }`}
                          >
                            <span
                              className="w-8 h-8 rounded-lg bg-white/10 shrink-0 flex items-center justify-center overflow-hidden border border-white/10"
                              title="Protocol icon"
                            >
                              {getLogoUrl(name) ? (
                                <Image
                                  src={getLogoUrl(name)!}
                                  alt=""
                                  width={32}
                                  height={32}
                                  className="w-full h-full object-contain"
                                  unoptimized
                                />
                              ) : null}
                            </span>
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
                  <div key={`post-${i}`} className="flex items-center gap-2 py-1">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-[#1e40af]/20 border border-[#1e40af]/40 flex items-center justify-center text-[10px] text-[#60a5fa]">
                      {preLogs.length + i + 1}
                    </span>
                    <span>{renderLogLine(line, true)}</span>
                  </div>
                ))}

                {(phase === 'choose' || phase === 'execute' || phase === 'done') && (
                  <div className="my-3 pl-7 border-l-2 border-emerald-500/30 ml-2 space-y-2">
                    <p className="text-emerald-400/90 font-medium text-xs">
                      {phase === 'choose' ? `Top 4 ${inferredType}s - choose one` : `Top 4 ${inferredType}s (chosen)`}
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {top4.map((item, i) => {
                        const isChosen = selectedIndex === i;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => phase === 'choose' && handleChoose(i)}
                            disabled={phase !== 'choose'}
                            className={`flex items-center gap-2 text-left px-3 py-2.5 rounded-lg border transition-all w-full ${isChosen
                              ? 'border-emerald-500/50 bg-emerald-500/10 cursor-default'
                              : phase === 'choose'
                                ? 'border-white/10 hover:border-[#1e40af]/50 hover:bg-[#1e40af]/10 cursor-pointer'
                                : 'border-white/10 bg-white/5 opacity-80 cursor-default'
                              }`}
                          >
                            <span className="w-8 h-8 rounded-lg bg-white/10 shrink-0 flex items-center justify-center overflow-hidden border border-white/10">
                              {getLogoUrl(item.name) ? (
                                <Image
                                  src={getLogoUrl(item.name)!}
                                  alt=""
                                  width={32}
                                  height={32}
                                  className="w-full h-full object-contain"
                                  unoptimized
                                />
                              ) : null}
                            </span>
                            <span>
                              <span className="text-[#60a5fa] font-semibold">{i + 1}.</span> {item.name}{' '}
                              <span className="text-gray-500">({item.metrics.fee} • {item.metrics.duration})</span>
                              {isChosen && phase !== 'choose' && (
                                <span className="ml-2 text-emerald-400 text-[10px]">chosen</span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {phase === 'choose' && (
                      <p className="text-[10px] text-gray-500 mt-1.5">
                        Select one to run execution — logs will appear below.
                      </p>
                    )}
                  </div>
                )}

                {(phase === 'execute' || phase === 'done' || (phase === 'choose' && executeLogs.length > 0)) &&
                  executeLogs.map((line, i) => (
                    <div key={`ex-${i}`} className="flex items-center gap-2 py-1">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-[#1e40af]/20 border border-[#1e40af]/40 flex items-center justify-center text-[10px] text-[#60a5fa]">
                        *
                      </span>
                      <span>{renderLogLine(line)}</span>
                    </div>
                  ))}
                {phase === 'execute' && isStreamingExecuteLog && (
                  <div className="flex items-center gap-2 py-1">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-[#1e40af]/20 border border-[#1e40af]/40 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] animate-pulse" />
                    </span>
                    <span className="inline-block w-2 h-4 bg-[#60a5fa]/90 animate-pulse" aria-hidden />
                  </div>
                )}

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
          })()
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}

export default ProcessTrackingPanel;
