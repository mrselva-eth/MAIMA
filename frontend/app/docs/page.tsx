'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/sections/navbar';
import Link from 'next/link';
import { Menu, ExternalLink } from 'lucide-react';

const THEME_COLOR = '#1e40af';

const SECTIONS = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'environment', label: 'Environment' },
  { id: 'app', label: 'App (Chat)' },
  { id: 'api', label: 'API Reference' },
  { id: 'api-intent', label: 'Intent API' },
  { id: 'cre', label: 'Chainlink CRE' },
  { id: 'security', label: 'Security & Trust' },
];

export default function DocsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeId, setActiveId] = useState('introduction');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="pt-16 flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-72 shrink-0
            border-r border-[#1e40af]/10 bg-white
            transform transition-transform duration-200 ease-out
            md:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto py-4 px-3 pt-6">
              <p className="text-xs font-semibold uppercase tracking-wider px-2 mb-3" style={{ color: THEME_COLOR }}>
                On this page
              </p>
              <nav className="space-y-0.5">
                {SECTIONS.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      activeId === s.id
                        ? 'bg-[#1e40af]/10 text-[#1e40af]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-[#1e40af]'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {s.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/20 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="md:hidden sticky top-16 z-20 flex items-center gap-3 border-b border-[#1e40af]/10 bg-white px-4 py-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#1e40af]/20 text-[#1e40af]"
              aria-label="Open docs menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-[family-name:var(--font-gagalin)] text-lg" style={{ color: THEME_COLOR }}>
              Documentation
            </span>
          </div>

          <div className="max-w-3xl mx-auto px-6 py-10 sm:py-14">
            <div className="prose prose-gray max-w-none">
              {/* Introduction */}
              <section id="introduction" className="scroll-mt-24">
                <h1
                  className="font-[family-name:var(--font-gagalin)] text-3xl sm:text-4xl tracking-tight mb-4"
                  style={{ color: THEME_COLOR }}
                >
                  Documentation
                </h1>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  MAIMA is an AI-powered DeFi orchestration layer that converts natural language intents into optimized, verified, cross-chain execution plans. Built with <strong>Chainlink CRE</strong> for trust-minimized logic and <strong>LI.FI</strong> for route aggregation across 20+ chains and 250+ DEXs and bridges.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-8">
                  <li><strong>AI Intent Parsing</strong>: Describe what you want in plain language (e.g., &quot;swap 100 USDC to ETH&quot; or &quot;bridge 1 ETH to Arbitrum&quot;).</li>
                  <li><strong>Oracle Verification</strong>: Every route is verified against Chainlink Price Feeds for fair value.</li>
                  <li><strong>Process Tracking</strong>: Real-time feedback as the system analyzes, ranks, and verifies protocols.</li>
                  <li><strong>Transparent Reporting</strong>: Download detailed analysis reports for audit.</li>
                </ul>
              </section>

              {/* Getting Started */}
              <section id="getting-started" className="scroll-mt-24">
                <h2
                  className="font-[family-name:var(--font-gagalin)] text-2xl mt-12 mb-4"
                  style={{ color: THEME_COLOR }}
                >
                  Getting Started
                </h2>
                <p className="text-gray-600 mb-4">
                  Prerequisites: <strong>Node.js 18+</strong>, <strong>pnpm</strong>, <strong>Chainlink CRE CLI</strong>, and a Web3 wallet. Clone and install:
                </p>
                <pre
                  className="rounded-xl p-4 overflow-x-auto text-sm mb-4"
                  style={{ backgroundColor: '#0f172a', color: '#e2e8f0' }}
                >
{`git clone https://github.com/mrselva-eth/MAIMA.git
cd MAIMA
pnpm install

cd frontend && pnpm install
cd ../cre/cre-maima && pnpm install
cd ../cre-swap && pnpm install
cd ../cre-bridge && pnpm install`}
                </pre>
                <p className="text-gray-600 mb-4">
                  Run the frontend from the project root:
                </p>
                <pre
                  className="rounded-xl p-4 overflow-x-auto text-sm mb-4"
                  style={{ backgroundColor: '#0f172a', color: '#e2e8f0' }}
                >
{`cd frontend
pnpm dev`}
                </pre>
                <p className="text-gray-600">Open <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">http://localhost:3000</code></p>
              </section>

              {/* Environment */}
              <section id="environment" className="scroll-mt-24">
                <h2
                  className="font-[family-name:var(--font-gagalin)] text-2xl mt-12 mb-4"
                  style={{ color: THEME_COLOR }}
                >
                  Environment Variables
                </h2>
                <p className="text-gray-600 mb-4">
                  Create a <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">.env</code> file in <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">frontend/</code>:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-1">
                  <li><code className="bg-gray-100 px-1 rounded text-sm">NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID</code> — WalletConnect project ID from <a href="https://cloud.walletconnect.com" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: THEME_COLOR }}>WalletConnect Cloud</a></li>
                  <li><code className="bg-gray-100 px-1 rounded text-sm">AI_API_KEY</code> — For AI intent parsing (OpenRouter or OpenAI)</li>
                  <li><code className="bg-gray-100 px-1 rounded text-sm">CRE_CLI_PATH</code> — Path to CRE CLI (e.g. <code className="bg-gray-100 px-1 rounded text-sm">bin/cre.exe</code> on Windows)</li>
                </ul>
                <p className="text-gray-600 mb-2">
                  <strong>LI.FI API key</strong> is configured in CRE workflow config:
                </p>
                <p className="text-gray-600 text-sm mb-4">
                  Copy <code className="bg-gray-100 px-1 rounded">config.staging.example.json</code> to <code className="bg-gray-100 px-1 rounded">config.staging.json</code> in <code className="bg-gray-100 px-1 rounded">cre/cre-swap/</code> and <code className="bg-gray-100 px-1 rounded">cre/cre-bridge/</code>, then set <code className="bg-gray-100 px-1 rounded">lifiApiKey</code>.
                </p>
              </section>

              {/* App */}
              <section id="app" className="scroll-mt-24">
                <h2
                  className="font-[family-name:var(--font-gagalin)] text-2xl mt-12 mb-4"
                  style={{ color: THEME_COLOR }}
                >
                  App (Chat)
                </h2>
                <p className="text-gray-600 mb-4">
                  The <Link href="/app" className="underline inline-flex items-center gap-1" style={{ color: THEME_COLOR }}>App <ExternalLink className="w-3.5 h-3.5" /></Link> provides a wallet-gated chat interface:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li><strong>Natural Language</strong>: Type your intent; MAIMA parses it via AI.</li>
                  <li><strong>Tracking Panel</strong>: See intent parsing, protocol listing, and Chainlink price verification in real time.</li>
                  <li><strong>Route Ranking</strong>: Top protocols ranked by gas, reliability, and speed.</li>
                  <li><strong>Report Download</strong>: Export analysis as HTML for audit.</li>
                </ul>
              </section>

              {/* API Reference */}
              <section id="api" className="scroll-mt-24">
                <h2
                  className="font-[family-name:var(--font-gagalin)] text-2xl mt-12 mb-4"
                  style={{ color: THEME_COLOR }}
                >
                  API Reference
                </h2>
                <p className="text-gray-600 mb-4">
                  Single route: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">/api/maima</code>. Actions via <code className="bg-gray-100 px-1 rounded text-sm">?action=</code> (GET) or <code className="bg-gray-100 px-1 rounded text-sm">body.action</code> (POST).
                </p>
                <h3 className="text-lg font-semibold mt-6 mb-2" style={{ color: THEME_COLOR }}>GET</h3>
                <ul className="space-y-2 text-gray-600 mb-4 text-sm">
                  <li><code className="bg-gray-100 px-1.5 py-0.5 rounded">?action=queue</code> — List pending requests</li>
                  <li><code className="bg-gray-100 px-1.5 py-0.5 rounded">?action=report&requestId=...</code> — Fetch report</li>
                  <li><code className="bg-gray-100 px-1.5 py-0.5 rounded">?action=pending-swap</code> — Consume swap request (CRE)</li>
                  <li><code className="bg-gray-100 px-1.5 py-0.5 rounded">?action=pending-bridge</code> — Consume bridge request (CRE)</li>
                  <li><code className="bg-gray-100 px-1.5 py-0.5 rounded">?action=status&txHash=...</code> — LI.FI tx status</li>
                  <li><code className="bg-gray-100 px-1.5 py-0.5 rounded">?action=diagnostic-status</code> — Internal state</li>
                </ul>
                <h3 className="text-lg font-semibold mt-6 mb-2" style={{ color: THEME_COLOR }}>POST</h3>
                <ul className="space-y-2 text-gray-600 mb-4 text-sm">
                  <li><code className="bg-gray-100 px-1.5 py-0.5 rounded">action=analyze</code> — Enqueue intent, spawn cre-maima</li>
                  <li><code className="bg-gray-100 px-1.5 py-0.5 rounded">action=cre-report</code> — Store CRE report</li>
                  <li><code className="bg-gray-100 px-1.5 py-0.5 rounded">action=run-swap</code> — Push swap queue, spawn cre-swap</li>
                  <li><code className="bg-gray-100 px-1.5 py-0.5 rounded">action=run-bridge</code> — Push bridge queue, spawn cre-bridge</li>
                </ul>
              </section>

              {/* Intent API */}
              <section id="api-intent" className="scroll-mt-24">
                <h2
                  className="font-[family-name:var(--font-gagalin)] text-2xl mt-12 mb-4"
                  style={{ color: THEME_COLOR }}
                >
                  Intent API
                </h2>
                <p className="text-gray-600 mb-4">
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">POST /api/intent</code> — Parses natural language into structured DeFi intents (swap vs bridge, tokens, amount, chains). Uses OpenRouter/OpenAI with a keyword fallback.
                </p>
                <p className="text-gray-600 text-sm">
                  Body: <code className="bg-gray-100 px-1 rounded">{'{ prompt: string }'}</code>. Returns: type, fromToken, toToken, amount, fromChain, toChain, isValid, reason, errorMessage.
                </p>
              </section>

              {/* CRE */}
              <section id="cre" className="scroll-mt-24">
                <h2
                  className="font-[family-name:var(--font-gagalin)] text-2xl mt-12 mb-4"
                  style={{ color: THEME_COLOR }}
                >
                  Chainlink CRE Workflows
                </h2>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  All analysis logic runs inside CRE workflows. The API is a thin orchestration layer; CRE performs route aggregation, price verification, and ranking.
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-1 mb-4">
                  <li><strong className="text-gray-900">cre-maima</strong>: Orchestrator. Polls queue, delegates to workers.</li>
                  <li><strong className="text-gray-900">cre-swap</strong>: Swap analysis. LI.FI routing, Chainlink verification, ranking.</li>
                  <li><strong className="text-gray-900">cre-bridge</strong>: Bridge analysis. Same pipeline for cross-chain routes.</li>
                </ul>
                <p className="text-gray-600 text-sm">
                  Manual run: <code className="bg-gray-100 px-1 rounded">cre workflow simulate cre/cre-maima --target staging-settings --non-interactive --trigger-index 0</code>
                </p>
              </section>

              {/* Security */}
              <section id="security" className="scroll-mt-24">
                <h2
                  className="font-[family-name:var(--font-gagalin)] text-2xl mt-12 mb-4"
                  style={{ color: THEME_COLOR }}
                >
                  Security & Trust
                </h2>
                <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-8">
                  <li><strong>Oracle Guard</strong>: Chainlink Price Feeds validate route outputs against fair market value.</li>
                  <li><strong>Protocol Whitelisting</strong>: Only trusted protocols (Uniswap, 1inch, KyberSwap, Curve, Paraswap) are ranked.</li>
                  <li><strong>Isolated Logic</strong>: Analysis runs in CRE; the API only queues and spawns workflows.</li>
                  <li><strong>Wallet Control</strong>: Users retain full custody; MAIMA prepares routes and signing, never holds funds.</li>
                </ul>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
