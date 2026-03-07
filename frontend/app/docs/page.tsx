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
                  MAIMA is an AI-powered DeFi orchestration layer that converts natural language intents into optimized, verified, cross-chain execution plans. It leverages <strong>Chainlink CRE</strong> for trust-minimized logic and <strong>LI.FI</strong> for deep route aggregation across 20+ chains.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-8">
                  <li><strong>AI Intent Parsing</strong>: Describe what you want in plain language (e.g., "swap 100 USDC to ETH").</li>
                  <li><strong>Oracle Verification</strong>: Every route is verified against <strong>Chainlink Price Feeds</strong> to ensure fair value.</li>
                  <li><strong>Process Tracking</strong>: Real-time feedback as the system analyzes, ranks, and verifies protocols.</li>
                  <li><strong>Transparent Reporting</strong>: Detailed JSON analysis reports available for download and audit.</li>
                </ul>
              </section>

              {/* Getting Started */}
              <section id="getting-started" className="scroll-mt-24">
                <h2 className="font-[family-name:var(--font-gagalin)] text-2xl text-foreground mt-12 mb-4">
                  Getting Started
                </h2>
                <p className="text-muted-foreground mb-4">
                  Prerequisites: Node.js 18+, pnpm, and a Web3 wallet. Clone the repository and install dependencies:
                </p>
                <pre className="bg-[#0f172a] text-gray-100 rounded-xl p-4 overflow-x-auto text-sm mb-4">
                  {`git clone https://github.com/mrselva-eth/MAIMA.git
cd MAIMA
pnpm install
# Install module dependencies
cd frontend && pnpm install
cd ../cre/cre-maima && pnpm install`}
                </pre>
                <p className="text-muted-foreground mb-2">
                  Configure your <code className="bg-muted px-1.5 py-0.5 rounded text-sm">.env</code> in the <code className="bg-muted px-1 rounded text-sm">frontend/</code> directory:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                  <li><code className="bg-muted px-1 rounded text-sm">NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID</code> — WalletConnect Cloud PID</li>
                  <li><code className="bg-muted px-1 rounded text-sm">OPENAI_API_KEY</code> — For AI intent parsing</li>
                  <li><code className="bg-muted px-1 rounded text-sm">LIFI_API_KEY</code> — For route aggregation</li>
                  <li><code className="bg-muted px-1 rounded text-sm">CRE_CLI_PATH</code> — Path to <code className="bg-muted px-1 rounded text-sm">bin/cre.exe</code> for local simulation</li>
                </ul>
              </section>

              {/* App (Chat) */}
              <section id="app" className="scroll-mt-24">
                <h2 className="font-[family-name:var(--font-gagalin)] text-2xl text-foreground mt-12 mb-4">
                  App (Chat)
                </h2>
                <p className="text-muted-foreground mb-4">
                  The <Link href="/app" className="text-primary underline underline-offset-2" style={{ color: THEME_COLOR }}>App</Link> interface provides a seamless chat experience:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                  <li><strong>Interactive Chat</strong>: Simply type your intent. MAIMA handles the complexity of chain selection and gas optimization.</li>
                  <li><strong>Tracking Panel</strong>: Watch as the intent is parsed, protocols are listed, and prices are verified via Chainlink.</li>
                  <li><strong>Route Ranking</strong>: Select from the top recommended routes based on gas, protocol reliability, and speed.</li>
                  <li><strong>Safety Notifications</strong>: Receive alerts if market prices shift significantly from the analyzed fair value before execution.</li>
                </ul>
              </section>

              {/* API */}
              <section id="api" className="scroll-mt-24">
                <h2 className="font-[family-name:var(--font-gagalin)] text-2xl text-foreground mt-12 mb-4">
                  API Reference
                </h2>
                <p className="text-muted-foreground mb-4">The MAIMA API handles request queuing and report management:</p>
                <ul className="space-y-3 text-muted-foreground mb-4">
                  <li>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm">POST /api/maima?action=analyze</code> — Enqueue a prompt and trigger CRE orchestrator.
                  </li>
                  <li>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm">POST /api/maima?action=run-swap</code> — Trigger a specific swap analysis worker.
                  </li>
                  <li>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm">GET /api/maima?action=report&requestId=...</code> — Retrieve the final analysis report.
                  </li>
                  <li>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm">GET /api/maima?action=diagnostic-status</code> — Inspect internal store states and environment variables.
                  </li>
                </ul>
              </section>

              {/* Chainlink CRE */}
              <section id="cre" className="scroll-mt-24">
                <h2 className="font-[family-name:var(--font-gagalin)] text-2xl text-foreground mt-12 mb-4">
                  Chainlink CRE Workflows
                </h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  MAIMA's intelligence runs inside decentralized <strong>CRE Workflows</strong>. These workflows perform asynchronous tasks like fetching routes, verifying prices, and ranking protocols without taxing the frontend.
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li><strong className="text-foreground">cre-maima</strong>: The master orchestrator.</li>
                  <li><strong className="text-foreground">cre-swap</strong>: Specialized swap analyzer with Oracle integration.</li>
                  <li><strong className="text-foreground">cre-bridge</strong>: Specialized cross-chain bridge analyzer.</li>
                </ul>
              </section>

              {/* Security */}
              <section id="security" className="scroll-mt-24">
                <h2 className="font-[family-name:var(--font-gagalin)] text-2xl text-foreground mt-12 mb-4">
                  Security & Trust
                </h2>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-8">
                  <li><strong>Oracle Guard</strong>: Direct integration with Chainlink Price Feeds ensures that the routes presented are based on "fair market value."</li>
                  <li><strong>Trust-Minimized Execution</strong>: Logic is isolated in CRE workflows, reducing reliance on centralized API proxies.</li>
                  <li><strong>Wallet Security</strong>: Users retain full control of their funds; MAIMA only facilitates route analysis and signing preparation.</li>
                </ul>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
