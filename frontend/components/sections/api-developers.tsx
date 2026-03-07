'use client';

import { Button } from '@/components/ui/button';
import { FileCode2, Zap, Cpu, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const THEME_COLOR = '#1e40af';

const HIGHLIGHTS = [
  { icon: Zap, label: 'Intent API', desc: 'Natural language → structured swap/bridge intents' },
  { icon: Cpu, label: 'CRE Workflows', desc: 'cre-maima, cre-swap, cre-bridge' },
];

export default function ApiDevelopers() {
  return (
    <section
      id="developers"
      className="relative bg-[#f8faff] py-16 sm:py-20 md:py-24 border-t border-[#1e40af]/10"
      aria-label="API and Developers"
    >
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <div className="rounded-2xl border-2 border-[#1e40af]/20 bg-white p-8 sm:p-10 md:p-12 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            <div>
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
                style={{ backgroundColor: `${THEME_COLOR}15` }}
              >
                <FileCode2 className="w-6 h-6" style={{ color: THEME_COLOR }} strokeWidth={2} />
              </div>
              <h2
                className="text-xl font-bold sm:text-2xl mb-2"
                style={{ fontFamily: 'var(--font-gagalin), sans-serif', color: THEME_COLOR }}
              >
                API & Developers
              </h2>
              <p className="text-gray-600 text-sm sm:text-base max-w-xl mb-6">
                Integrate with MAIMA: REST API for analysis and reports, Intent API for parsing, and Chainlink CRE workflows for trust-minimized route aggregation and oracle verification.
              </p>
              <div className="flex flex-wrap gap-3 mb-6 lg:mb-0">
                {HIGHLIGHTS.map((h) => (
                  <div
                    key={h.label}
                    className="flex items-center gap-2 rounded-lg border border-[#1e40af]/15 bg-[#f8faff]/80 px-3 py-2 text-sm"
                  >
                    <h.icon className="w-4 h-4 shrink-0" style={{ color: THEME_COLOR }} strokeWidth={2} />
                    <span>
                      <strong className="text-gray-900">{h.label}</strong>
                      <span className="text-gray-500 ml-1">— {h.desc}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <Button
              asChild
              className="shrink-0 h-12 px-6 rounded-lg font-semibold flex items-center gap-2"
              style={{ backgroundColor: THEME_COLOR }}
            >
              <Link href="/docs" className="text-white hover:text-white/90">
                View Docs
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 pt-6 border-t border-[#1e40af]/10 flex gap-3">
            <span className="text-xs font-semibold text-[#1e40af]/70 uppercase tracking-wider shrink-0">Disclaimer</span>
            <p className="text-xs text-gray-500 leading-relaxed">
              Route and price data are fetched live from LI.FI and Chainlink. Transaction execution is performed in a simulation environment via Chainlink CRE. DeFi involves risk; always verify routes and amounts before executing. This application does not constitute financial advice.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
