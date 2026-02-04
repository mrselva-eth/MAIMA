'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/** Animated blue waveform line for the "Working" header */
function WaveformLine({ active }: { active: boolean }) {
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const step = () => {
      setTick((t) => t + 1);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  const points = Array.from({ length: 24 }, (_, i) => {
    const x = (i / 23) * 100;
    const y = 50 + Math.sin((i * 0.7) + tick * 0.05) * 35;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg
      className="absolute inset-0 h-full w-full text-[#1e40af]"
      preserveAspectRatio="none"
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const STEPS = [
  { id: 'compile', label: 'Compiling workflow...' },
  { id: 'trigger', label: 'Triggering cron...' },
  { id: 'fetch', label: 'Calling /api/intents/active...' },
  { id: 'execute', label: 'Executing intents...' },
  { id: 'result', label: '' },
  { id: 'done', label: 'Done' },
];

const STEP_DURATION_MS = 600;

function formatLogTime() {
  return new Date().toISOString().replace('T', ' ').slice(0, 23);
}

export interface SimulationWidgetProps {
  open: boolean;
  onClose: () => void;
}

export function SimulationWidget({ open, onClose }: SimulationWidgetProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [resultJson, setResultJson] = useState<{
    activeCount: number;
    executed: number;
    results?: Array<{ intentId: string; success: boolean; type?: string }>;
    timestamp: number;
  } | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const appendLog = useCallback((line: string) => {
    setLogLines((prev) => [...prev, line]);
  }, []);

  const runSimulation = useCallback(async () => {
    setIsRunning(true);
    setStepIndex(0);
    setActiveCount(null);
    setLogLines([]);
    setResultJson(null);

    appendLog('Workflow compiled');

    // Step 0: Compiling
    await new Promise((r) => setTimeout(r, STEP_DURATION_MS));
    setStepIndex(1);
    appendLog(`${formatLogTime()} [SIMULATION] Simulator Initialized`);
    appendLog('');
    appendLog(`${formatLogTime()} [SIMULATION] Running trigger trigger=cron-trigger@1.0.0`);

    // Step 1: Trigger
    await new Promise((r) => setTimeout(r, STEP_DURATION_MS));
    setStepIndex(2);

    let count = 0;
    const intents: Array<{ id: string; type?: string }> = [];
    try {
      const res = await fetch('/api/intents/active');
      const data = await res.json();
      count = typeof data.count === 'number' ? data.count : 0;
      if (Array.isArray(data.intents)) {
        intents.push(...data.intents.map((i: { id?: string; type?: string }) => ({ id: i?.id ?? '', type: i?.type })));
      }
    } catch {
      count = 0;
    }
    setActiveCount(count);
    setStepIndex(3);

    appendLog(`${formatLogTime()} [USER LOG] Intent Monitor: workflow triggered.`);
    appendLog(`${formatLogTime()} [USER LOG] Active intents: ${count}`);
    appendLog('');

    // Step 4: Execute each intent (same as CRE workflow)
    setStepIndex(4);
    const results: Array<{ intentId: string; success: boolean; type?: string }> = [];
    for (const intent of intents) {
      if (!intent?.id) continue;
      appendLog(`${formatLogTime()} [EXECUTE] POST /api/intents/execute ${intent.id} (${intent.type ?? '?'})`);
      try {
        const execRes = await fetch('/api/intents/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intentId: intent.id }),
        });
        const execData = await execRes.json();
        const ok = Boolean(execData?.success);
        results.push({ intentId: intent.id, success: ok, type: execData?.type });
        appendLog(`${formatLogTime()} [USER LOG] ${ok ? 'Executed' : 'Skipped/failed'}: ${intent.id}${execData?.type ? ` (${execData.type})` : ''}`);
      } catch (err) {
        results.push({ intentId: intent.id, success: false, type: intent.type });
        appendLog(`${formatLogTime()} [USER LOG] Failed: ${intent.id} - ${err instanceof Error ? err.message : 'request error'}`);
      }
    }
    const executed = results.filter((r) => r.success).length;
    if (intents.length > 0) appendLog('');

    appendLog('Workflow Simulation Result:');
    const payload = {
      activeCount: count,
      executed,
      results,
      timestamp: Date.now(),
    };
    setResultJson(payload);
    appendLog(` ${JSON.stringify(payload, null, 2)}`);
    appendLog('');

    await new Promise((r) => setTimeout(r, STEP_DURATION_MS));
    setStepIndex(5);
    appendLog(`${formatLogTime()} [SIMULATION] Execution finished signal received`);
    appendLog(`${formatLogTime()} [SIMULATION] Skipping WorkflowEngineV2`);
    setIsRunning(false);
  }, [appendLog]);

  useEffect(() => {
    if (open && isRunning === false && stepIndex === 0 && activeCount === null) {
      runSimulation();
    }
  }, [open, runSimulation, isRunning, stepIndex, activeCount]);

  useEffect(() => {
    if (!open) {
      setStepIndex(0);
      setActiveCount(null);
      setIsRunning(false);
      setLogLines([]);
      setResultJson(null);
    }
  }, [open]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logLines]);

  if (!open) return null;

  const currentStep = STEPS[stepIndex];
  const displayLabel =
    stepIndex === 4 && resultJson
      ? `Executed: ${resultJson.executed}/${resultJson.activeCount}`
      : stepIndex === 3 && activeCount !== null
        ? `Active intents: ${activeCount}`
        : currentStep?.label ?? '';

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] w-[28rem] max-w-[calc(100vw-2rem)] max-h-[85vh] flex flex-col rounded-xl border border-white/10 bg-gray-900/95 shadow-2xl backdrop-blur-sm"
      aria-live="polite"
      role="status"
    >
      {/* Header: waveform + Working */}
      <div className="relative h-14 shrink-0 overflow-hidden rounded-t-xl bg-gray-800/80 px-3 pt-2">
        <div className="grid grid-cols-8 grid-rows-3 gap-px opacity-40">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="h-1.5 w-1.5 rounded-sm bg-gray-500" />
          ))}
        </div>
        <WaveformLine active={stepIndex < 5} />
        <div className="absolute bottom-2 left-3 right-10">
          <p className="text-sm font-semibold text-white">Working</p>
          <p className="text-xs text-gray-400">
            {stepIndex >= 5 ? 'Simulation complete' : 'Running diagnostics...'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 size-6 rounded-none p-1 text-gray-400 hover:bg-white/10 hover:text-white flex items-center justify-center"
          aria-label="Close"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      </div>

      {/* Steps checklist */}
      <div className="shrink-0 border-t border-white/10 px-3 py-2">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {STEPS.slice(0, stepIndex + 1).map((step, i) => {
            const isResult = step.id === 'result' && resultJson != null;
            const label = isResult ? `Executed: ${resultJson.executed}/${resultJson.activeCount}` : step.label;
            const isCurrent = i === stepIndex;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-1.5 text-xs ${
                  isCurrent ? 'text-[#60a5fa] font-medium' : 'text-gray-400'
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                    stepIndex > i
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isCurrent
                        ? 'bg-[#1e40af]/30 text-[#60a5fa]'
                        : 'bg-gray-600 text-gray-500'
                  }`}
                >
                  {stepIndex > i ? '✓' : i + 1}
                </span>
                <span>{label || (isResult && resultJson ? `Executed: ${resultJson.executed}/${resultJson.activeCount}` : step.id)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Terminal-style log (same as pnpm cre:simulate output) */}
      <div className="flex-1 min-h-0 border-t border-white/10 flex flex-col">
        <div className="px-2 py-1.5 text-[10px] text-gray-500 font-mono border-b border-white/5">
          cre workflow simulate cre-intent — target staging
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto p-3 font-mono text-[11px] text-gray-300 bg-black/40 leading-relaxed">
          {logLines.length === 0 && (
            <span className="text-gray-500">Waiting for simulation…</span>
          )}
          {logLines.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap break-all">
              {line}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}
