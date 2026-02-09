'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Navbar from '@/components/sections/navbar';
import { RequireWallet } from '@/components/app/RequireWallet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BackgroundCircles } from '@/components/app/BackgroundCircles';
import { ProcessTrackingPanel } from '@/components/app/ProcessTrackingPanel';
import Image from 'next/image';
import { Copy, Check } from 'lucide-react';
import type { AnalyzeReport } from '@/lib/maima-types';

const THEME_COLOR = '#1e40af';

type FinalResult = {
  protocol: string;
  pair: string;
  fee: string;
  inputAmount: string;
  outputAmount: string;
  txHash: string;
  approvalHash: string;
};

function formatMessageTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      });
    }
    return (
      d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    );
  } catch {
    return '';
  }
}

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  report?: AnalyzeReport;
  result?: FinalResult;
  at: string;
};

export default function AppPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [trackingOpen, setTrackingOpen] = useState(false);
  const [trackingPrompt, setTrackingPrompt] = useState('');
  const [trackingReport, setTrackingReport] =
    useState<AnalyzeReport | null>(null);
  const [processingMessageId, setProcessingMessageId] =
    useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const { address } = useAccount();

  const copyMessage = (m: Message) => {
    let text = m.content;
    if (m.report)
      text += `\n\nAccuracy: ${m.report.accuracy}\nGas: ${m.report.gasFeeEstimate}\nOptimistic: ${
        m.report.optimisticEstimate
      }\n\nTop bridges: ${m.report.topBridges
        .map((b) => `${b.name} (${b.score})`)
        .join(', ')}\nTop swaps: ${m.report.topSwaps.map((s) => `${s.name} (${s.score})`).join(', ')}`;
    if (m.result)
      text += `\n\nProtocol: ${m.result.protocol}\nPair: ${m.result.pair}\nFee: ${m.result.fee}\nInput: ${m.result.inputAmount}\nOutput: ${m.result.outputAmount}\nTx: ${m.result.txHash}\nApproval: ${m.result.approvalHash}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(m.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;
    setInput('');

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: prompt,
      at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const processingId = `a_${Date.now()}`;
    const processingMsg: Message = {
      id: processingId,
      role: 'assistant',
      content:
        'Your request is being processed. Check the tracking panel on the right for progress.',
      at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, processingMsg]);
    setProcessingMessageId(processingId);

    // Open tracking panel
    setTrackingPrompt(prompt);
    setTrackingReport(null);
    setTrackingOpen(true);

    // Prompt → intent mapping
    let intent: '1' | '2' | '3' | '4' = '3';
    const p = prompt.toLowerCase();

    if (p.includes('usdc') && p.includes('eth') && p.includes('base')) {
      intent = '2';
    } else if (p.includes('eth') && p.includes('usdc')) {
      intent = '1';
    } else if (p.includes('arbitrum') && p.includes('base')) {
      intent = '4';
    } else if (p.includes('base') && p.includes('arbitrum')) {
      intent = '3';
    }

    try {
      const res = await fetch('/api/maima/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, fromAddress: address }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMessage =
          typeof data?.error === 'string' ? data.error : 'No allowed routes found. Try a different amount or pair.';
        setTrackingReport(null);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === processingId
              ? { ...m, content: `Request failed. ${errorMessage}` }
              : m
          )
        );
        return;
      }
      const report = data.report as AnalyzeReport | undefined;
      setTrackingReport(report ?? null);
    } catch (err) {
      console.error(err);
      setTrackingReport(null);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === processingId
            ? { ...m, content: 'Request failed. You can close the tracking panel and try again.' }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTrackingComplete = (result: FinalResult | null) => {
    if (!result || !processingMessageId) return;
    const content = `Done. ${result.protocol} - Pair: ${result.pair}, Fee: ${result.fee}. Input: ${result.inputAmount} -> Output: ${result.outputAmount}. Tx: ${result.txHash.slice(
      0,
      10
    )}... Approval: ${result.approvalHash.slice(0, 10)}...`;
    setMessages((prev) => prev.map((m) => (m.id === processingMessageId ? { ...m, content, result } : m)));
    setProcessingMessageId(null);
  };

  const handleTrackingClose = () => {
    setTrackingOpen(false);
    setTrackingPrompt('');
    setTrackingReport(null);
    setProcessingMessageId(null);
  };

  return (
    <div className="h-screen overflow-hidden bg-white flex flex-col">
      <Navbar />
      <RequireWallet>
        <div className="relative flex-1 flex flex-col min-h-0 pt-16">
          <div
            className={`relative z-10 flex-1 flex min-h-0 gap-3 px-4 py-2 ${
              trackingOpen ? 'flex-row' : 'flex-col'
            }`}
          >
            <div
              className={`h-full flex flex-col rounded-xl border border-[#1e40af]/15 bg-white/95 shadow-lg overflow-hidden transition-all ${
                trackingOpen ? 'w-[65%] min-w-0 max-w-4xl' : 'w-full max-w-4xl mx-auto'
              }`}
            >
              <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 overscroll-contain relative">
                <BackgroundCircles className="!absolute inset-0 z-0 pointer-events-none" />
                {messages.length === 0 && (
                  <div className="absolute inset-0 z-[1] flex items-center justify-center pointer-events-none" aria-hidden>
                    <Image
                      src="/images/logo.png"
                      alt=""
                      width={140}
                      height={140}
                      className="w-[140px] h-[140px] object-contain opacity-40 select-none"
                      unoptimized
                      draggable={false}
                    />
                  </div>
                )}
                <div className="relative z-10 p-4 space-y-4 min-h-full">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        {m.role === 'assistant' && (
                          <span className="shrink-0 w-7 h-7 rounded-full overflow-hidden border border-[#1e40af]/15 bg-white/80 flex items-center justify-center">
                            <Image
                              src="/images/logo.png"
                              alt=""
                              width={28}
                              height={28}
                              className="w-full h-full object-cover select-none"
                              unoptimized
                              draggable={false}
                            />
                          </span>
                        )}
                        <div
                          className={`group relative max-w-[85%] rounded-2xl px-4 py-2.5 ${
                            m.role === 'user'
                              ? 'bg-[#1e40af] text-white'
                              : 'bg-gray-100 text-foreground border border-gray-200'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                          {m.result && (
                            <div className="mt-3 pt-3 border-t border-gray-200/80 space-y-1.5 text-xs">
                              <p>
                                <strong>Protocol:</strong> {m.result.protocol}
                              </p>
                              <p>
                                <strong>Pair:</strong> {m.result.pair}
                              </p>
                              <p>
                                <strong>Fee:</strong> {m.result.fee}
                              </p>
                              <p>
                                <strong>Input:</strong> {m.result.inputAmount} {'->'} <strong>Output:</strong>{' '}
                                {m.result.outputAmount}
                              </p>
                              <p className="break-all">
                                <strong>Tx:</strong> {m.result.txHash}
                              </p>
                              <p className="break-all">
                                <strong>Approval:</strong> {m.result.approvalHash}
                              </p>
                            </div>
                          )}
                          {m.report && !m.result && (
                            <div className="mt-3 pt-3 border-t border-gray-200/80 space-y-2 text-xs">
                              <p>
                                <strong>Accuracy:</strong> {m.report.accuracy}
                              </p>
                              <p>
                                <strong>Gas (est.):</strong> {m.report.gasFeeEstimate}
                              </p>
                              <p>
                                <strong>Optimistic:</strong> {m.report.optimisticEstimate}
                              </p>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <div>
                                  <p className="font-medium text-foreground">Top bridges</p>
                                  <ul className="list-disc list-inside text-muted-foreground">
                                    {m.report.topBridges.slice(0, 5).map((b, i) => (
                                      <li key={i}>
                                        {b.name} ({b.score})
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">Top swaps</p>
                                  <ul className="list-disc list-inside text-muted-foreground">
                                    {m.report.topSwaps.slice(0, 5).map((s, i) => (
                                      <li key={i}>
                                        {s.name} ({s.score})
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div
                        className={`mt-1 flex items-center gap-2 px-1 text-[10px] text-muted-foreground ${
                          m.role === 'assistant' ? 'pl-9' : 'justify-end'
                        }`}
                      >
                        <span>{formatMessageTime(m.at)}</span>
                        <button
                          type="button"
                          onClick={() => copyMessage(m)}
                          className="p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                          aria-label="Copy message"
                          title="Copy"
                        >
                          {copiedId === m.id ? (
                            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                  {loading && !trackingOpen && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl px-4 py-2.5 bg-gray-100 border border-gray-200 text-sm text-muted-foreground">
                        Analyzing...
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              </div>

              <div className="shrink-0 p-4 border-t border-[#1e40af]/10 bg-white">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="e.g. Swap 100 USDC to ETH at best rate within 1 hour"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                    className="min-h-10 resize-none border-2 border-[#1e40af]/25 focus-visible:border-[#1e40af]/50 focus-visible:ring-2 focus-visible:ring-[#1e40af]/20"
                    rows={1}
                  />
                  <Button
                    type="button"
                    onClick={send}
                    disabled={loading || !input.trim()}
                    className="shrink-0"
                    style={{ backgroundColor: THEME_COLOR }}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
            {trackingOpen && (
              <div className="w-[35%] min-w-0 flex-1 h-full flex flex-col overflow-hidden">
                <ProcessTrackingPanel
                  open={trackingOpen}
                  onClose={handleTrackingClose}
                  prompt={trackingPrompt}
                  report={trackingReport}
                  onComplete={handleTrackingComplete}
                  onStepComplete={() => {}}
                />
              </div>
            )}
          </div>
        </div>
      </RequireWallet>
    </div>
  );
}
