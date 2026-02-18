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
                  MAIMA uses LI.FI to analyze swap and bridge requests. Describe what you want in plain language;
                  you get a report with accuracy, gas estimate, and a ranked list of protocols. Use the process tracking panel to see protocols checked, then choose one and run it in the app.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-8">
                  <li>Chat interface: connect wallet, describe swap or bridge in plain language</li>
                  <li>Report: LI.FI routes, ranked with accuracy, gas, and recommended protocol</li>
                  <li>Process tracking: input checked, protocols listed and checked, top 4 choose one, then run simulation or sign in wallet</li>
                  <li>CRE workflows under <code className="bg-muted px-1 rounded text-sm">cre/</code>: cre-maima (main), cre-bridge, cre-swap; poll the app queue and can be deployed to Chainlink when ready</li>
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
                  <li><code className="bg-muted px-1 rounded text-sm">NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID</code> — from WalletConnect Cloud (for App)</li>
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
                  MAIMA calls LI.FI, ranks routes, and returns a report with accuracy, gas estimate, and a ranked list of protocols. The tracking panel shows the flow, then you choose one protocol and run it (simulation or sign approval and swap in your wallet).
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
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm">POST /api/maima/analyze</code> — Send prompt; returns report (LI.FI routes ranked, accuracy, gas, recommended protocol)
                  </li>
                  <li>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm">POST /api/maima/routing</code> — LI.FI proxy: <code className="bg-muted px-1 rounded text-sm">?action=quote</code> (used by analyze), <code className="bg-muted px-1 rounded text-sm">?action=step</code>, <code className="bg-muted px-1 rounded text-sm">?action=status</code> (used by app for execution)
                  </li>
                  <li>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm">GET /api/maima/queue</code> — Active requests (polled by CRE workflows)
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
                  Each runs on a schedule and polls <code className="bg-muted px-1 rounded text-sm">/api/maima/queue</code>. Use them for scheduled runs or deploy to Chainlink when ready.
                </p>
              </section>

              {/* Security */}
              <section id="security" className="scroll-mt-24">
                <h2 className="font-[family-name:var(--font-gagalin)] text-2xl text-foreground mt-12 mb-4">
                  Security
                </h2>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-8">
                  <li>Wallet required for the app; no keys stored in the backend</li>
                  <li>CRE workflows in <code className="bg-muted px-1 rounded text-sm">cre/</code> can be deployed to Chainlink when ready</li>
                </ul>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
