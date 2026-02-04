'use client';

import { useState } from 'react';
import Navbar from '@/components/navbar';
import Link from 'next/link';
import { Menu } from 'lucide-react';

const THEME_COLOR = '#1e40af';

const SECTIONS = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'intents', label: 'Intents' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'api', label: 'API Reference' },
  { id: 'contracts', label: 'Smart Contracts' },
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
                  MAIMA (Machine-AI for Managed Actions) is an intent-based smart wallet with
                  AI-powered automation, multisig security, and real-time Chainlink CRE execution.
                  Express goals in natural language—not raw transactions.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-8">
                  <li>Intent-based execution from natural language</li>
                  <li>AI-powered parsing (OpenAI / OpenRouter)</li>
                  <li>Multisig for high-risk intents</li>
                  <li>Chainlink CRE monitoring and execution</li>
                  <li>Non-custodial; your keys stay yours</li>
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
                  <li><code className="bg-muted px-1 rounded text-sm">OPENAI_API_KEY</code> or <code className="bg-muted px-1 rounded text-sm">OPENROUTER_API_KEY</code> — for intent parsing</li>
                </ul>
                <p className="text-muted-foreground">
                  Run <code className="bg-muted px-1.5 py-0.5 rounded text-sm">pnpm dev</code> and open{' '}
                  <a href="http://localhost:3000" className="text-primary underline underline-offset-2" style={{ color: THEME_COLOR }}>
                    http://localhost:3000
                  </a>.
                </p>
              </section>

              {/* Intents */}
              <section id="intents" className="scroll-mt-24">
                <h2 className="font-[family-name:var(--font-gagalin)] text-2xl text-foreground mt-12 mb-4">
                  Intents
                </h2>
                <p className="text-muted-foreground mb-4">
                  Create an intent by describing what you want in plain language. Examples:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                  <li>&quot;Swap 100 USDC to ETH at best rate within 1 hour&quot;</li>
                  <li>&quot;Stake 50 SOL monthly if balance is above $1000&quot;</li>
                  <li>&quot;Bridge 500 USDT from Ethereum to Arbitrum&quot;</li>
                </ul>
                <p className="text-muted-foreground mb-2">Lifecycle:</p>
                <p className="text-muted-foreground font-mono text-sm bg-muted/50 rounded-lg p-3 mb-4">
                  Created → Validated → Active → Monitored → Executed → Finalized
                </p>
                <p className="text-muted-foreground">
                  Connect your wallet, go to <Link href="/intents/create" className="text-primary underline underline-offset-2" style={{ color: THEME_COLOR }}>Create Intent</Link>,
                  enter your goal, review the parsed intent, and sign. CRE monitors conditions and executes when met.
                </p>
              </section>

              {/* Dashboard */}
              <section id="dashboard" className="scroll-mt-24">
                <h2 className="font-[family-name:var(--font-gagalin)] text-2xl text-foreground mt-12 mb-4">
                  Dashboard
                </h2>
                <p className="text-muted-foreground mb-4">
                  The <Link href="/dashboard" className="text-primary underline underline-offset-2" style={{ color: THEME_COLOR }}>Dashboard</Link> shows
                  quick actions (Create Intent, View Intents, Docs), stats (active, executed, pending, total value), and an empty state until you create intents.
                  Use it as the hub for managing and monitoring all intents.
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
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm">GET /api/intents?address=0x...</code> — List user intents
                  </li>
                  <li>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm">POST /api/intents</code> — Create intent
                  </li>
                  <li>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm">GET /api/intents/[id]</code> — Get intent details
                  </li>
                  <li>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm">POST /api/intents/parse</code> — Parse natural language to intent
                  </li>
                  <li>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm">GET /api/tokens/quote?tokenIn=ETH&tokenOut=USDC&amount=1</code> — Swap quote
                  </li>
                  <li>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm">POST /api/workflows/trigger</code> — Trigger CRE workflow
                  </li>
                </ul>
              </section>

              {/* Smart Contracts */}
              <section id="contracts" className="scroll-mt-24">
                <h2 className="font-[family-name:var(--font-gagalin)] text-2xl text-foreground mt-12 mb-4">
                  Smart Contracts
                </h2>
                <p className="text-muted-foreground mb-4">
                  <strong className="text-foreground">IntentRegistry</strong> — Stores intent metadata and lifecycle.{' '}
                  <strong className="text-foreground">IntentWallet</strong> — Executes intents via authorized CRE caller with rate limiting.{' '}
                  <strong className="text-foreground">SafetyModule</strong> — Emergency controls, circuit breaker, whitelisting, time locks.
                </p>
              </section>

              {/* Chainlink CRE */}
              <section id="cre" className="scroll-mt-24">
                <h2 className="font-[family-name:var(--font-gagalin)] text-2xl text-foreground mt-12 mb-4">
                  Chainlink CRE
                </h2>
                <p className="text-muted-foreground mb-4">
                  CRE runs outside the app on a DON. This repo includes workflow templates (monitor, executor, incident-handler).
                  The cre-intent workflow runs on a schedule, evaluates conditions, and updates status; the executor runs when intents are approved.
                </p>
              </section>

              {/* Security */}
              <section id="security" className="scroll-mt-24">
                <h2 className="font-[family-name:var(--font-gagalin)] text-2xl text-foreground mt-12 mb-4">
                  Security
                </h2>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-8">
                  <li>No private keys in the backend; wallet-based only</li>
                  <li>Multisig for critical actions</li>
                  <li>On-chain validation of constraints</li>
                  <li>Rate limiting and time locks</li>
                </ul>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
