'use client';

import { useState } from 'react';
import Navbar from '@/components/sections/navbar';
import Link from 'next/link';
import { Menu } from 'lucide-react';

const THEME_COLOR = '#1e40af';

const SECTIONS = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'app', label: 'App (Chat)' },
  { id: 'api', label: 'API Reference' },
  { id: 'cre', label: 'Chainlink CRE' },
  { id: 'security', label: 'Security' },
];

export default function DocsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="pt-16 flex">
        {/* Sidebar - desktop: sticky; mobile: drawer */}
        <aside
          className={`
            fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-72 shrink-0
            border-r border-border bg-white
            transform transition-transform duration-200 ease-out
            md:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex h-full flex-col overflow-hidden">
            {/* On this page */}
            <div className="flex-1 overflow-y-auto py-4 px-3 pt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-3">
                On this page
              </p>
              <nav className="space-y-0.5">
                {SECTIONS.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                    style={{ color: 'inherit' }}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {s.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
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
          {/* Mobile: menu button */}
          <div className="md:hidden sticky top-16 z-20 flex items-center gap-3 border-b border-border bg-white px-4 py-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground"
              aria-label="Open docs menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-[family-name:var(--font-gagalin)] text-lg text-foreground">
              Documentation
            </span>
          </div>

          <div className="max-w-3xl mx-auto px-6 py-10 sm:py-14">
            <div className="docs-prose">
              {/* Introduction */}
              <section id="introduction" className="scroll-mt-24">
                <h1 className="font-[family-name:var(--font-gagalin)] text-3xl sm:text-4xl text-foreground tracking-tight mb-4">
                  Documentation
                </h1>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  MAIMA is a DeFi optimistic solution handler. Describe swap or bridge needs in natural language;
                  MAIMA AI analyzes and returns a report with accuracy, gas fee, and optimistic estimates.
                  Use process tracking in the app to see protocols checked and choose the best option.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-8">
                  <li>Chat interface for swap/bridge requests</li>
                  <li>Report: accuracy, gas estimate, optimistic execution</li>
                  <li>Process tracking: protocols listed, checked, then choose one</li>
                  <li>CRE workflows under <code className="bg-muted px-1 rounded text-sm">cre/</code>: maima (main), bridge, swap</li>
                  <li>Deploy workflows to Chainlink when you have Early Access</li>
                </ul>
              </section>

              {/* Getting Started */}
              <section id="getting-started" className="scroll-mt-24">
                <h2 className="font-[family-name:var(--font-gagalin)] text-2xl text-foreground mt-12 mb-4">
                  Getting Started
                </h2>
                <p className="text-muted-foreground mb-4">
                  Prerequisites: Node.js 18+, a Web3 wallet (e.g. MetaMask). Clone the repo and install:
                </p>
                <pre className="bg-[#0f172a] text-gray-100 rounded-xl p-4 overflow-x-auto text-sm mb-4">
{`git clone https://github.com/mrselva-eth/MAIMA.git
cd MAIMA
pnpm install`}
                </pre>
                <p className="text-muted-foreground mb-2">
                  Copy <code className="bg-muted px-1.5 py-0.5 rounded text-sm">.env.example</code> to{' '}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm">.env.local</code> and set:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                  <li><code className="bg-muted px-1 rounded text-sm">NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID</code> — WalletConnect Cloud</li>
                  <li><code className="bg-muted px-1 rounded text-sm">NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID</code> — for wallet connect (optional)</li>
                </ul>
                <p className="text-muted-foreground">
                  Run <code className="bg-muted px-1.5 py-0.5 rounded text-sm">pnpm dev</code> and open{' '}
                  <a href="http://localhost:3000" className="text-primary underline underline-offset-2" style={{ color: THEME_COLOR }}>
                    http://localhost:3000
                  </a>.
                </p>
              </section>

              {/* App (Chat) */}
              <section id="app" className="scroll-mt-24">
                <h2 className="font-[family-name:var(--font-gagalin)] text-2xl text-foreground mt-12 mb-4">
                  App (Chat)
                </h2>
                <p className="text-muted-foreground mb-4">
                  Open <Link href="/app" className="text-primary underline underline-offset-2" style={{ color: THEME_COLOR }}>App</Link> to use the chat interface. Examples:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                  <li>&quot;Swap 100 USDC to ETH at best rate within 1 hour&quot;</li>
                  <li>&quot;Bridge 500 USDT from Ethereum to Arbitrum&quot;</li>
                </ul>
                <p className="text-muted-foreground">
                  MAIMA returns a report with accuracy, gas fee estimate, optimistic execution, and top bridges/swaps. Use the tracking panel to see protocols checked and choose one for your request.
                </p>
              </section>

              {/* API */}
              <section id="api" className="scroll-mt-24">
                <h2 className="font-[family-name:var(--font-gagalin)] text-2xl text-foreground mt-12 mb-4">
                  API Reference
                </h2>
                <p className="text-muted-foreground mb-4">Key endpoints:</p>
                <ul className="space-y-3 text-muted-foreground mb-4">
                  <li>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm">GET /api/maima/requests</code> — Active requests (for CRE)
                  </li>
                  <li>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm">POST /api/maima/analyze</code> — Send prompt, get report (accuracy, gas, optimistic, top bridges/swaps)
                  </li>
                  <li>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm">GET /api/tokens/quote?tokenIn=ETH&tokenOut=USDC&amount=1</code> — Swap quote (optional)
                  </li>
                </ul>
              </section>

              {/* Chainlink CRE */}
              <section id="cre" className="scroll-mt-24">
                <h2 className="font-[family-name:var(--font-gagalin)] text-2xl text-foreground mt-12 mb-4">
                  Chainlink CRE
                </h2>
                <p className="text-muted-foreground mb-4">
                  Three workflows under <code className="bg-muted px-1 rounded text-sm">cre/</code>: <strong className="text-foreground">cre-maima</strong> (main), <strong className="text-foreground">cre-bridge</strong>, <strong className="text-foreground">cre-swap</strong>.
                  Each runs on a schedule and polls <code className="bg-muted px-1 rounded text-sm">/api/maima/requests</code>. Based on user requests, the workflow gets active and the AI report is generated in the app chat. Deploy to Chainlink when you have Early Access.
                </p>
              </section>

              {/* Security */}
              <section id="security" className="scroll-mt-24">
                <h2 className="font-[family-name:var(--font-gagalin)] text-2xl text-foreground mt-12 mb-4">
                  Security
                </h2>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-8">
                  <li>Deploy workflows to Chainlink when ready for production</li>
                  <li>Wallet connect optional; no keys in backend</li>
                </ul>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
