'use client';

import { useEffect, useRef, useState } from 'react';
import type { AnalyzeReport } from '@/lib/maima-types';
import { useSendTransaction } from 'wagmi';

export type TrackingPhase = 'steps' | 'checking' | 'choose' | 'execute' | 'done';

function formatTime() {
  return new Date().toLocaleTimeString();
}

export function ProcessTrackingPanel({
  open,
  onClose,
  prompt,
  report,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  prompt: string;
  report: AnalyzeReport | null;
  onComplete: (r: any) => void;
}) {
  const [phase, setPhase] = useState<TrackingPhase>('steps');
  const [logs, setLogs] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const bridges = report?.topBridges ?? [];

  const { sendTransactionAsync } = useSendTransaction();

  useEffect(() => {
    if (!open) return;
    setPhase('steps');
    setLogs([]);
    setSelected(null);

    setTimeout(() => {
      setLogs((l) => [...l, `[${formatTime()}] Parsing user intent…`]);
    }, 800);

    setTimeout(() => {
      setLogs((l) => [...l, `[${formatTime()}] Fetching routes from LI.FI…`]);
    }, 1600);

    setTimeout(() => {
      if (bridges.length === 0) {
        setLogs((l) => [...l, `[${formatTime()}] No routes found.`]);
      } else {
        setPhase('choose');
      }
    }, 2400);
  }, [open, prompt, bridges.length]);

  useEffect(() => {
    logRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const executeRoute = async (bridge: any) => {
    try {
      setPhase('execute');
      setLogs((l) => [
        ...l,
        `[${formatTime()}] Requesting transaction data…`,
      ]);

      const res = await fetch('/api/maima/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeId: bridge.routeId }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      const tx = data.tx;

      setLogs((l) => [
        ...l,
        `[${formatTime()}] Sending transaction to wallet…`,
      ]);

      const hash = await sendTransactionAsync({
        to: tx.to,
        data: tx.data,
        value: tx.value ? BigInt(tx.value) : 0n,
      });

      setLogs((l) => [
        ...l,
        `[${formatTime()}] Transaction sent: ${hash}`,
      ]);

      setPhase('done');

      onComplete({
        protocol: bridge.name,
        pair: 'Bridge',
        fee: 'Auto',
        inputAmount: '—',
        outputAmount: '—',
        txHash: hash,
        approvalHash: hash,
      });
    } catch (err: any) {
      console.error(err);
      setLogs((l) => [
        ...l,
        `[${formatTime()}] Execution failed: ${err.message}`,
      ]);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed right-4 top-4 w-[420px] h-[90vh] bg-black border border-white/10 rounded-xl p-3 text-white">
      <div className="flex justify-between items-center mb-2">
        <div>
          <div className="font-semibold">Process Tracking</div>
          <div className="text-xs text-gray-400">Bridge flow</div>
        </div>
        <button onClick={onClose}>×</button>
      </div>

      <div className="text-xs font-mono space-y-1 overflow-y-auto h-[70%]">
        {logs.map((l, i) => (
          <div key={i}>{l}</div>
        ))}

        {phase === 'choose' && (
          <div className="mt-3 space-y-2">
            <div className="text-green-400 text-xs">
              Top bridges suggested by LI.FI
            </div>
            {bridges.map((b: any, i: number) => (
              <button
                key={i}
                onClick={() => {
                  setSelected(i);
                  setLogs((l) => [
                    ...l,
                    `[${formatTime()}] Selected ${b.name}`,
                  ]);
                  executeRoute(b);
                }}
                className="w-full text-left border border-white/10 rounded p-2 hover:bg-white/10"
              >
                {i + 1}. {b.name} ({b.score})
              </button>
            ))}
          </div>
        )}

        {phase === 'execute' && selected !== null && (
          <div className="mt-3 text-yellow-400">
            Executing route via {bridges[selected]?.name}…
          </div>
        )}

        {phase === 'done' && (
          <div className="mt-3 text-green-400">
            Execution completed.
          </div>
        )}

        <div ref={logRef} />
      </div>
    </div>
  );
}
