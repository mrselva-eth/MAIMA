'use client';

import type { ProcessTrackingPanelProps } from './tracking-types';
import { useTrackingFlow } from './use-tracking-flow';
import { TrackingChartHeader } from '@/components/design/TrackingChartHeader';
import { useProtocolLogos } from '@/hooks/use-protocol-logos';
import Image from 'next/image';

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
                          className={`flex items-center gap-2 text-left px-3 py-2.5 rounded-lg border transition-all w-full ${
                            isChosen
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
                            <span className="text-gray-500">({item.score})</span>
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
        })()}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}

export default ProcessTrackingPanel;
