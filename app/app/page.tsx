'use client';

import { useState, useRef, useEffect } from 'react';
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
      d.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })
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

  const copyMessage = (m: Message) => {
    navigator.clipboard.writeText(m.content).then(() => {
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
        body: JSON.stringify({ intent }),
      });

      const data = await res.json();
      const report = data.report as AnalyzeReport | undefined;
      setTrackingReport(report ?? null);
    } catch (err) {
      console.error(err);
      setTrackingReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackingComplete = (result: FinalResult | null) => {
    if (!result || !processingMessageId) return;

    const content = `Done. ${result.protocol} — Pair: ${result.pair}, Fee: ${result.fee}.`;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === processingMessageId
          ? { ...m, content, result }
          : m
      )
    );

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
            {/* Chat panel */}
            <div
              className={`h-full flex flex-col rounded-xl border bg-white shadow-lg overflow-hidden transition-all ${
                trackingOpen
                  ? 'w-[65%] min-w-0 max-w-4xl'
                  : 'w-full max-w-4xl mx-auto'
              }`}
            >
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.role === 'user'
                        ? 'items-end'
                        : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        m.role === 'user'
                          ? 'bg-[#1e40af] text-white'
                          : 'bg-gray-100 text-black'
                      }`}
                    >
                      {m.content}
                    </div>

                    <button
                      onClick={() => copyMessage(m)}
                      className="text-xs mt-1 opacity-60"
                    >
                      {copiedId === m.id ? (
                        <Check size={14} />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="e.g. Bridge ETH from Base to Arbitrum"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' &&
                      !e.shiftKey &&
                      (e.preventDefault(), send())
                    }
                  />
                  <Button
                    onClick={send}
                    disabled={loading || !input.trim()}
                    style={{ backgroundColor: THEME_COLOR }}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>

            {/* Tracking panel */}
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
