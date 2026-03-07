'use client';

import { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/sections/navbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BackgroundCircles } from '@/components/design/BackgroundCircles';
import { ProcessTrackingPanel } from '@/components/app/tracking-wind/ProcessTrackingPanel';
import Image from 'next/image';
import { Copy, Check, ShieldCheck, Download } from 'lucide-react';
import type { AnalyzeReport } from '@/lib/maima';
import type { IntentResult } from '@/app/api/intent/route';
import { useProtocolLogos } from '@/hooks/use-protocol-logos';
import { RequireWallet } from '@/context/RequireWallet';
import { useAccount } from 'wagmi';
import AppInstructionRoadmap from '@/components/app/AppInstructionRoadmap';
import AppFaq from '@/components/app/AppFaq';

const THEME_COLOR = '#1e40af';

type FinalResult = {
  protocol: string;
  pair: string;
  fee: string;
  inputAmount: string;
  outputAmount: string;
  txHash: string;
  approvalHash: string;
  accuracy?: string;
  executionVerifiedPrices?: { symbol: string; price: string }[];
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
  const { address } = useAccount();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [trackingOpen, setTrackingOpen] = useState(false);
  const [trackingPrompt, setTrackingPrompt] = useState('');
  const [trackingReport, setTrackingReport] =
    useState<AnalyzeReport | null>(null);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [trackingRunId, setTrackingRunId] = useState(0);
  const [processingMessageId, setProcessingMessageId] =
    useState<string | null>(null);
  const [executionPendingMessageId, setExecutionPendingMessageId] =
    useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const chatFollowTailRef = useRef(true);
  const { getLogoUrl } = useProtocolLogos();


  const processingMessage = processingMessageId
    ? messages.find((m) => m.id === processingMessageId)
    : null;
  const reportNotYetShown =
    trackingOpen &&
    processingMessageId &&
    processingMessage &&
    !processingMessage.report;

  // Poll for report when we have a pending requestId (non-blocking; UI shows "Waiting for CRE…")
  useEffect(() => {
    if (!pendingRequestId || !processingMessageId) return;
    const pollIntervalMs = 1500;
    const pollTimeoutMs = 60000;
    const started = Date.now();
    const id = setInterval(async () => {
      if (Date.now() - started >= pollTimeoutMs) {
        setPendingRequestId(null);
        return;
      }
      try {
        const r = await fetch(`/api/maima?action=report&requestId=${encodeURIComponent(pendingRequestId)}`);
        const j = await r.json();
        if (j.success && j.report != null) {
          const report = j.report as AnalyzeReport;
          setTrackingReport(report);
          setPendingRequestId(null);
        }
      } catch {
        // ignore
      }
    }, pollIntervalMs);
    return () => clearInterval(id);
  }, [pendingRequestId, processingMessageId]);

  const copyMessage = (m: Message) => {
    let text = m.content;
    if (m.report)
      text += `\n\nAccuracy: ${m.report.accuracy}\nGas: ${m.report.gasFeeEstimate}\nOptimistic: ${m.report.optimisticEstimate
        }\n\nTop bridges: ${m.report.topBridges
          .map((b) => `${b.name} (${b.score})`)
          .join(', ')}\nTop swaps: ${m.report.topSwaps.map((s) => `${s.name} (${s.score})`).join(', ')}`;
    if (m.report?.workflow?.length) {
      text += `\n\nWorkflow report:`;
      text += m.report.workflow
        .map((step, i) => `\n${i + 1}. ${step.name} (${step.status.toUpperCase()}) - ${step.details}`)
        .join('');
      if (m.report.selectionReason) {
        text += `\nWhy this protocol: ${m.report.selectionReason}`;
      }
    }
    if (m.report?.ranking?.length) {
      text += `\n\nProtocol ranking:`;
      text += m.report.ranking
        .slice(0, 5)
        .map((r) => {
          const fee =
            r.feeUSD !== null && r.feeUSD !== undefined ? `$${r.feeUSD.toFixed(4)}` : 'N/A';
          return `\n${r.rank}. ${r.protocol} - ${fee}${r.reason ? ` (${r.reason})` : ''}`;
        })
        .join('');
    }
    if (m.result)
      text += `\n\nProtocol: ${m.result.protocol}\nPair: ${m.result.pair}\nFee: ${m.result.fee}\nInput: ${m.result.inputAmount}\nOutput: ${m.result.outputAmount}\nTx: ${m.result.txHash}\nApproval: ${m.result.approvalHash}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(m.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const downloadReport = (m: Message) => {
    const r = m.report;
    const ts = new Date(m.at).toLocaleString();
    const rows = (r?.ranking ?? []).slice(0, 5).map((rank, i) => `
      <tr>
        <td style="padding:6px 12px;font-weight:600;color:#1e40af">#${rank.rank ?? i + 1}</td>
        <td style="padding:6px 12px;font-weight:600">${rank.protocol}</td>
        <td style="padding:6px 12px">${rank.feeUSD !== null && rank.feeUSD !== undefined ? '$' + Number(rank.feeUSD).toFixed(4) : 'N/A'}</td>
        <td style="padding:6px 12px">${rank.executionDuration ? Math.round(rank.executionDuration) + 's' : 'N/A'}</td>
        <td style="padding:6px 12px;color:#555">${rank.reason ?? ''}</td>
      </tr>`).join('');

    const chainlinkRows = r?.chainlink?.prices?.length
      ? r.chainlink.prices.map((c: { symbol: string; price: string }) => {
        const raw = String(c.price ?? '').replace(/^\$/, '');
        const num = Number(raw);
        const displayPrice = Number.isFinite(num) ? `$${num.toFixed(2)}` : c.price;
        return `<tr><td style="padding:6px 12px;font-weight:500">${c.symbol}</td><td style="padding:6px 12px">${displayPrice}</td><td style="padding:6px 12px;color:#059669">✔ Verified</td></tr>`;
      }).join('')
      : '';



    const workflowRows = r?.workflow?.length
      ? r.workflow.map((s, i) => `<tr><td style="padding:6px 12px">${i + 1}. ${s.name}</td><td style="padding:6px 12px;text-transform:uppercase;font-weight:600;color:${s.status === 'ok' ? '#059669' : '#dc2626'}">${s.status}</td><td style="padding:6px 12px;color:#555">${s.details ?? ''}</td></tr>`).join('')
      : '';

    const logoUrl = `${window.location.origin}/images/logo.png`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>MAIMA Analysis Report</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#111;background:#fff;padding:40px 48px;max-width:900px;margin:0 auto;position:relative}
    .watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:500px;height:500px;opacity:0.10;pointer-events:none;z-index:0;user-select:none}
    .watermark img{width:100%;height:100%;object-fit:contain}
    .content{position:relative;z-index:1}
    .header{display:flex;align-items:center;gap:16px;border-bottom:2px solid #1e40af;padding-bottom:16px;margin-bottom:24px}
    .logo-img{width:48px;height:48px;object-fit:contain;border-radius:10px}
    h1{font-size:22px;color:#1e40af;font-weight:700}
    .sub{font-size:12px;color:#777;margin-top:2px}
    .section{margin-bottom:24px}
    h2{font-size:14px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;border-bottom:1px solid #e5e7ef;padding-bottom:6px}
    .kv{display:grid;grid-template-columns:160px 1fr;gap:6px 12px;font-size:13px}
    .label{color:#666;font-weight:500}
    .value{color:#111;font-weight:600}
    table{width:100%;border-collapse:collapse;font-size:12.5px;border:1px solid #e5e7ef;border-radius:8px;overflow:hidden}
    thead{background:#1e40af;color:#fff}
    th{padding:9px 12px;text-align:left;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase}
    .footer{margin-top:32px;text-align:center;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:14px;display:flex;align-items:center;justify-content:center;gap:8px}
    .footer img{width:18px;height:18px;object-fit:contain;opacity:0.5}
    @media print{body{padding:20px 28px}.watermark{position:fixed}}
  </style>
</head>
<body>
  <div class="watermark"><img src="${logoUrl}" alt="" /></div>
  <div class="content">
  <div class="header">
    <img src="/favicon.ico" style="height:48px;width:auto;object-contain" alt="MAIMA">
    <div>
      <h1>MAIMA Analysis Report</h1>
      <div class="sub">Generated · ${ts}</div>
    </div>
  </div>

  <div style="margin-bottom:24px;padding:16px;background:#f0f7ff;border:1px solid #cce3ff;border-radius:8px">
    <div style="font-size:13px;font-weight:700;color:#1e40af;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.04em">Simulation Environment Active</div>
    <div style="font-size:12px;color:#444;line-height:1.5">
      <strong>Verification Note:</strong> All route and price data in this report is authentic and real-time. 
      The execution process is performed in a safe simulation environment via Chainlink CRE.
    </div>
  </div>

  <div class="section">
    <h2>Summary</h2>
    <div class="kv">
      <span class="label">Intent Type</span><span class="value">${r?.intentType ?? 'N/A'}</span>
      <span class="label">Accuracy</span><span class="value">${r?.accuracy ?? 'N/A'}</span>
      <span class="label">Gas Fee Estimate</span><span class="value">${r?.gasFeeEstimate ?? 'N/A'}</span>
      <span class="label">Optimistic Estimate</span><span class="value">${r?.optimisticEstimate ?? 'N/A'}</span>
      ${r?.selectionReason ? `<span class="label">Selection Reason</span><span class="value">${r.selectionReason}</span>` : ''}
      ${r?.summary ? `<span class="label">Summary</span><span class="value">${r.summary}</span>` : ''}
    </div>
  </div>

  ${rows ? `<div class="section">
    <h2>Protocol Ranking</h2>
    <table>
      <thead><tr><th>Rank</th><th>Protocol</th><th>Fee</th><th>Est. Time</th><th>Reason</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>` : ''}

  ${chainlinkRows ? `<div class="section">
    <h2>Chainlink Oracle Prices</h2>
    <table>
      <thead><tr><th>Pair</th><th>Price</th><th>Status</th></tr></thead>
      <tbody>${chainlinkRows}</tbody>
    </table>
  </div>` : ''}

  ${workflowRows ? `<div class="section">
    <h2>Workflow Steps</h2>
    <table>
      <thead><tr><th>Step</th><th>Status</th><th>Details</th></tr></thead>
      <tbody>${workflowRows}</tbody>
    </table>
  </div>` : ''}

  ${m.result ? `<div class="section">
    <h2>Execution Result</h2>
    <div class="kv">
      <span class="label">Protocol</span><span class="value">${m.result.protocol}</span>
      <span class="label">Pair</span><span class="value">${m.result.pair}</span>
      <span class="label">Fee</span><span class="value">${m.result.fee}</span>
      <span class="label">Input</span><span class="value">${m.result.inputAmount}</span>
      <span class="label">Output</span><span class="value">${m.result.outputAmount}</span>
      <span class="label">Tx Hash</span><span class="value" style="word-break:break-all;font-size:11px">${m.result.txHash}</span>
    </div>
  </div>` : ''}

  <div class="footer">
    <div style="font-weight:600;color:#999">MAIMA · AI-Powered DeFi Intent Analyzer</div>
  </div>
  <script>window.onload=()=>{window.print();}</script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };


  useEffect(() => {
    const el = chatScrollContainerRef.current;
    if (!el || !chatFollowTailRef.current) return;
    requestAnimationFrame(() => {
      el.scrollTo({
        top: el.scrollHeight - el.clientHeight,
        behavior: 'smooth',
      });
    });
  }, [messages]);

  const send = async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;
    setInput('');

    const now = Date.now();
    const userMsg: Message = {
      id: `u_${now}`,
      role: 'user',
      content: prompt,
      at: new Date().toISOString(),
    };


    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // AI Intent Analysis
    let intent: IntentResult | null = null;
    try {
      const intentRes = await fetch('/api/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (intentRes.ok) {
        intent = await intentRes.json() as IntentResult;
      }
    } catch {
      // fall through to keyword fallback below
    }

    // If AI returned an unsupported intent, show friendly error
    if (intent && !intent.isValid) {
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `a_${now}_unsupported`,
          role: 'assistant',
          content: intent!.errorMessage ??
            "I didn't recognize that request. Try: 'Swap 100 USDC to ETH' or 'Bridge 1 ETH from Base to Arbitrum'.",
          at: new Date().toISOString(),
        },
      ]);
      return;
    }

    // If AI failed entirely (null), do a basic keyword guard
    if (!intent) {
      const p2 = prompt.toLowerCase();
      const isSwapIntent = /swap|convert|exchange/.test(p2);
      const isBridgeIntent = /bridge|transfer|move.*to|send.*to|cross.chain/.test(p2);

      if (!isSwapIntent && !isBridgeIntent) {
        setLoading(false);
        setMessages((prev) => [...prev, { id: `a_${now}_unsupported`, role: 'assistant', content: "I didn't recognize that request. Try: 'Swap 10 USDC to ETH on Polygon' or 'Bridge 1 ETH from Ethereum to Base'.", at: new Date().toISOString() }]);
        return;
      }
    }

    const processingId = `a_${now}_processing`;
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
    setTrackingRunId((n) => n + 1);
    setExecutionPendingMessageId(null);



    try {
      const res = await fetch('/api/maima', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          prompt,
          fromAddress: address ?? '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          // Pass AI-parsed intent type so backend can skip regex
          intentType: intent?.type ?? undefined,
        }),
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
      const requestId = data.requestId as string | undefined;
      if (!requestId) {
        setTrackingReport(null);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === processingId ? { ...m, content: 'No requestId from analyze.' } : m
          )
        );
        return;
      }
      setPendingRequestId(requestId);
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

  const handleStepComplete = () => {
    if (!processingMessageId || !trackingReport) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === processingMessageId
          ? {
            ...m,
            report: trackingReport,
            content:
              'Report ready. Review why each protocol was ranked and choose the best option.',
          }
          : m
      )
    );
  };

  const handleExecuteStart = () => {
    if (processingMessageId) setExecutionPendingMessageId(processingMessageId);
  };

  const handleTrackingComplete = (result: FinalResult | null) => {
    if (!result || !processingMessageId) return;
    setExecutionPendingMessageId(null);
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== processingMessageId) return m;
        const doneContent = `Done. ${result.protocol} - Pair: ${result.pair}, Fee: ${result.fee}. Input: ${result.inputAmount} -> Output: ${result.outputAmount}. Tx: ${result.txHash.slice(
          0,
          10
        )}... Approval: ${result.approvalHash.slice(0, 10)}...`;
        return m.report
          ? { ...m, result } // Keep existing content; final output shows in report bottom
          : { ...m, content: doneContent, result };
      })
    );
    setProcessingMessageId(null);
  };

  const handleTrackingClose = () => {
    setTrackingOpen(false);
    setTrackingPrompt('');
    setTrackingReport(null);
    setPendingRequestId(null);
    setProcessingMessageId(null);
    setExecutionPendingMessageId(null);
  };

  return (
    <div className="h-screen overflow-hidden bg-white flex flex-col">
      <Navbar />
      <RequireWallet>
        <div className="relative flex-1 flex flex-col min-h-0 pt-16">
          <div
            className={`relative z-10 flex-1 flex min-h-0 gap-3 px-4 py-2 ${trackingOpen ? 'flex-row' : 'flex-row'
              }`}
          >
            {/* Left: Instruction roadmap (only when tracking closed) */}
            {!trackingOpen && (
              <aside className="hidden lg:flex w-56 xl:w-64 shrink-0 flex-col overflow-y-auto">
                <AppInstructionRoadmap />
              </aside>
            )}
            <div
              className={`relative h-full flex flex-col rounded-xl border border-[#1e40af]/15 bg-white/95 shadow-lg overflow-hidden transition-all ${trackingOpen ? 'w-[65%] min-w-0 max-w-4xl' : 'flex-1 min-w-0 max-w-4xl'
                }`}
            >
              <BackgroundCircles className="!absolute inset-0 z-0 pointer-events-none" />
              <div
                ref={chatScrollContainerRef}
                onScroll={() => {
                  const el = chatScrollContainerRef.current;
                  if (!el) return;
                  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 50;
                  chatFollowTailRef.current = nearBottom;
                }}
                className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden min-h-0 overscroll-contain"
              >
                <div className="relative z-10 p-4 space-y-4 min-h-full">
                  {/* Default welcome message - always first */}
                  <div className="flex flex-col items-start">
                    <div className="flex gap-2">
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
                      <div className="rounded-2xl px-4 py-2.5 bg-gray-100 text-foreground border border-gray-200 max-w-[85%]">
                        <p className="text-sm">
                          Optimistic routes + execution. Type intent e.g. &quot;Swap 100 USDC to ETH&quot; I analyze, verify (Chainlink), rank, then execute.
                        </p>
                      </div>
                    </div>
                  </div>
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
                          className={`group relative max-w-[85%] rounded-2xl px-4 py-2.5 ${m.role === 'user'
                            ? 'bg-[#1e40af] text-white'
                            : 'bg-gray-100 text-foreground border border-gray-200'
                            }`}
                        >
                          {m.role === 'assistant' &&
                            m.id === processingMessageId &&
                            !m.report ? (
                            <div className="flex flex-col items-center justify-center gap-4 py-6 min-w-[200px]">
                              <Image
                                src="/images/logo.png"
                                alt=""
                                width={120}
                                height={120}
                                className="w-[120px] h-[120px] object-contain select-none animate-pulse"
                                unoptimized
                                draggable={false}
                              />
                              <p className="text-sm font-medium text-[#1e40af] tracking-wide">
                                MAIMA is miming
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                          )}
                          {m.report && (
                            <div className="mt-3 pt-3 border-t border-gray-200/80 space-y-2 text-xs">
                              {(() => {
                                const workflowHint = m.report?.workflow?.[0]?.details?.toLowerCase() ?? '';
                                const inferredTypeFromWorkflow = workflowHint.includes('bridge')
                                  ? 'bridge'
                                  : workflowHint.includes('swap')
                                    ? 'swap'
                                    : null;
                                const reportType =
                                  m.report?.intentType ??
                                  inferredTypeFromWorkflow ??
                                  m.report?.bestRoute?.type ??
                                  (m.report.topBridges.length > 0 && m.report.topSwaps.length === 0
                                    ? 'bridge'
                                    : 'swap');
                                return (
                                  <>
                                    <p className="flex items-center gap-1.5">
                                      <strong>Accuracy:</strong> {m.report.accuracy || 'N/A'}
                                      {m.report.accuracy?.includes('Oracle') && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold border border-blue-500/20">
                                          <ShieldCheck className="w-2.5 h-2.5" />
                                          Chainlink
                                        </span>
                                      )}
                                    </p>
                                    {m.report.chainlink?.prices && m.report.chainlink.prices.length > 0 && (
                                      <div className="flex flex-col gap-0.5 mt-1">
                                        {m.report.chainlink.prices.map((p, idx) => (
                                          <p key={idx} className="text-[#1e40af]/80 font-medium text-[11px]">
                                            <strong>{p.symbol} Price:</strong> {p.price} (Oracle)
                                          </p>
                                        ))}
                                      </div>
                                    )}
                                    <p>
                                      <strong>Gas (est.):</strong> {m.report.gasFeeEstimate}
                                    </p>
                                    <p>
                                      <strong>Optimistic:</strong> {m.report.optimisticEstimate}
                                    </p>
                                    <div className="grid grid-cols-1 gap-2 mt-2">
                                      {reportType === 'bridge' ? (
                                        <div>
                                          <p className="font-medium text-foreground">Top bridges</p>
                                          {m.report.topBridges?.length ? (
                                            <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                                              {m.report.topBridges.slice(0, 5).map((b, i) => (
                                                <li key={i} className="flex items-center gap-2 min-h-[28px]">
                                                  <span className="w-6 h-6 shrink-0 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                                                    {getLogoUrl(b.name) ? (
                                                      <Image
                                                        src={getLogoUrl(b.name)!}
                                                        alt=""
                                                        width={24}
                                                        height={24}
                                                        className="w-full h-full object-contain"
                                                        unoptimized
                                                      />
                                                    ) : null}
                                                  </span>
                                                  <span>{b.name} ({b.score})</span>
                                                </li>
                                              ))}
                                            </ul>
                                          ) : (
                                            <p className="text-muted-foreground">No bridge routes found.</p>
                                          )}
                                        </div>
                                      ) : (
                                        <div>
                                          <p className="font-medium text-foreground">Top swaps</p>
                                          {m.report.topSwaps?.length ? (
                                            <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                                              {m.report.topSwaps.slice(0, 5).map((s, i) => (
                                                <li key={i} className="flex items-center gap-2 min-h-[28px]">
                                                  <span className="w-6 h-6 shrink-0 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                                                    {getLogoUrl(s.name) ? (
                                                      <Image
                                                        src={getLogoUrl(s.name)!}
                                                        alt=""
                                                        width={24}
                                                        height={24}
                                                        className="w-full h-full object-contain"
                                                        unoptimized
                                                      />
                                                    ) : null}
                                                  </span>
                                                  <span>{s.name} ({s.score})</span>
                                                </li>
                                              ))}
                                            </ul>
                                          ) : (
                                            <p className="text-muted-foreground">No swap routes found.</p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    {m.report.workflow?.length ? (
                                      <div className="pt-2 border-t border-gray-200/80 space-y-2">
                                        <p className="font-medium text-foreground">Workflow report</p>
                                        <div className="space-y-1 text-muted-foreground">
                                          {m.report.workflow.map((step, i) => (
                                            <p key={i}>
                                              {i + 1}. {step.name} ({step.status.toUpperCase()}) -- {step.details}
                                            </p>
                                          ))}
                                        </div>
                                        {m.report.selectionReason ? (
                                          <p className="text-muted-foreground">
                                            Why this protocol: {m.report.selectionReason}
                                          </p>
                                        ) : null}
                                      </div>
                                    ) : null}
                                    {m.report.ranking?.length ? (
                                      <div className="pt-2 border-t border-gray-200/80 space-y-2">
                                        <p className="font-medium text-foreground">Protocol ranking</p>
                                        <div className="space-y-2">
                                          {m.report.ranking.slice(0, 4).map((r, i) => (
                                            <div
                                              key={r.protocol}
                                              className={`rounded-2xl border p-3 ${r.isSelected
                                                ? 'border-[#1e40af]/45 bg-[#1e40af]/10'
                                                : 'border-[#1e40af]/20 bg-white'
                                                }`}
                                            >
                                              <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 min-h-[34px]">
                                                  <span className="w-10 h-10 shrink-0 rounded-xl overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center">
                                                    {getLogoUrl(r.protocol) ? (
                                                      <Image
                                                        src={getLogoUrl(r.protocol)!}
                                                        alt=""
                                                        width={30}
                                                        height={30}
                                                        className="w-7 h-7 object-contain"
                                                        unoptimized
                                                      />
                                                    ) : null}
                                                  </span>
                                                  <div className="flex flex-col min-w-0">
                                                    <span className="text-[13px] font-semibold leading-none text-foreground">{r.protocol}</span>
                                                    <div className="flex gap-1.5 mt-1">
                                                      {i === 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium uppercase tracking-tighter">Cheapest</span>}
                                                      {i === 1 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-medium uppercase tracking-tighter">Fastest</span>}
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="text-[#60a5fa] text-lg leading-none">{'>'}</div>
                                              </div>
                                              <div className="mt-3 grid grid-cols-2 gap-2">
                                                <div className="rounded-lg bg-[#1e40af]/[0.04] border border-[#1e40af]/15 px-2 py-1.5">
                                                  <p className="text-[8px] text-gray-500 uppercase leading-none mb-0.5">Gas Fee</p>
                                                  <p className="text-[10px] text-foreground font-semibold leading-none">
                                                    {r.feeUSD !== null && r.feeUSD !== undefined ? `$${r.feeUSD.toFixed(4)}` : 'N/A'}
                                                  </p>
                                                </div>
                                                <div className="rounded-lg bg-[#1e40af]/[0.04] border border-[#1e40af]/15 px-2 py-1.5">
                                                  <p className="text-[8px] text-gray-500 uppercase leading-none mb-0.5">Est. Time</p>
                                                  <p className="text-[10px] text-foreground font-semibold leading-none">
                                                    {r.executionDuration ? `${Math.round(r.executionDuration)}s` : 'N/A'}
                                                  </p>
                                                </div>
                                                <div className="rounded-lg bg-[#1e40af]/[0.04] border border-[#1e40af]/15 px-2 py-1.5">
                                                  <p className="text-[8px] text-gray-500 uppercase leading-none mb-0.5">Reliability</p>
                                                  <p className="text-[10px] text-foreground font-semibold leading-none">{r.reliabilityScore || 'N/A'}</p>
                                                </div>
                                                <div className="rounded-lg bg-[#1e40af]/[0.04] border border-[#1e40af]/15 px-2 py-1.5">
                                                  <p className="text-[8px] text-gray-500 uppercase leading-none mb-0.5">Liquidity</p>
                                                  <p className="text-[10px] text-foreground font-semibold leading-none">{r.liquidityScore || 'N/A'}</p>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : null}
                                    {executionPendingMessageId === m.id && !m.result ? (
                                      <div className="mt-3 pt-3 border-t border-gray-200/80 flex flex-col items-center gap-2 py-4">
                                        <Image
                                          src="/images/logo.png"
                                          alt=""
                                          width={48}
                                          height={48}
                                          className="animate-pulse opacity-80 object-contain"
                                          unoptimized
                                        />
                                        <p className="text-xs text-muted-foreground">Execution in progress...</p>
                                      </div>
                                    ) : m.result ? (
                                      <div className="mt-3 pt-3 border-t border-gray-200/80 space-y-1.5 text-xs">
                                        <p className="font-medium text-foreground">Final execution</p>
                                        <p className="flex items-center gap-2">
                                          <strong>Protocol:</strong>
                                          <span className="w-6 h-6 shrink-0 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                                            {getLogoUrl(m.result.protocol) ? (
                                              <Image
                                                src={getLogoUrl(m.result.protocol)!}
                                                alt=""
                                                width={24}
                                                height={24}
                                                className="w-full h-full object-contain"
                                                unoptimized
                                              />
                                            ) : null}
                                          </span>
                                          <span>{m.result.protocol}</span>
                                        </p>
                                        <p>
                                          <strong>Pair:</strong> {m.result.pair}
                                        </p>
                                        <p>
                                          <strong>Fee:</strong> {m.result.fee}
                                        </p>
                                        <p>
                                          <strong>Input:</strong> {m.result.inputAmount} {'->'}{' '}
                                          <strong>Output:</strong> {m.result.outputAmount}
                                        </p>
                                        <p className="break-all">
                                          <strong>Tx:</strong> {m.result.txHash}
                                        </p>
                                        <p className="break-all">
                                          <strong>Approval:</strong> {m.result.approvalHash}
                                        </p>
                                      </div>
                                    ) : null}
                                  </>
                                );
                              })()}
                            </div>
                          )}
                          {!m.report && m.result && (
                            <div className="mt-3 pt-3 border-t border-gray-200/80 space-y-1.5 text-xs">
                              <p className="flex items-center gap-2">
                                <strong>Protocol:</strong>
                                <span className="w-6 h-6 shrink-0 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                                  {getLogoUrl(m.result.protocol) ? (
                                    <Image
                                      src={getLogoUrl(m.result.protocol)!}
                                      alt=""
                                      width={24}
                                      height={24}
                                      className="w-full h-full object-contain"
                                      unoptimized
                                    />
                                  ) : null}
                                </span>
                                <span>{m.result.protocol}</span>
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
                        </div>
                      </div>
                      <div
                        className={`mt-1 flex items-center gap-2 px-1 text-[10px] text-muted-foreground ${m.role === 'assistant' ? 'pl-9' : 'justify-end'
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
                        {(m.report || m.result) && (
                          <button
                            type="button"
                            onClick={() => downloadReport(m)}
                            className="p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity text-muted-foreground hover:text-blue-500"
                            aria-label="Download report"
                            title="Download report as JSON"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
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

              <div className="relative z-10 shrink-0 p-4 border-t border-[#1e40af]/10 bg-white">
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
            {/* Right: FAQ (only when tracking closed) */}
            {!trackingOpen && (
              <aside className="hidden lg:flex w-56 xl:w-64 shrink-0 flex-col overflow-y-auto">
                <AppFaq />
              </aside>
            )}
            {trackingOpen && (
              <div className="w-[35%] min-w-0 flex-1 h-full flex flex-col overflow-hidden">
                <ProcessTrackingPanel
                  key={trackingRunId}
                  open={trackingOpen}
                  onClose={handleTrackingClose}
                  prompt={trackingPrompt}
                  report={trackingReport}
                  isWaitingForReport={!!pendingRequestId}
                  onComplete={handleTrackingComplete}
                  onStepComplete={handleStepComplete}
                  onExecuteStart={handleExecuteStart}
                />
              </div>
            )}
          </div>
        </div>
      </RequireWallet>
    </div>
  );
}
