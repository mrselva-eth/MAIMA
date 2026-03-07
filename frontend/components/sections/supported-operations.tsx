'use client';

import { ArrowLeftRight, Layers } from 'lucide-react';
import Link from 'next/link';

const THEME_COLOR = '#1e40af';

const OPERATIONS = [
  {
    icon: ArrowLeftRight,
    title: 'Swaps',
    desc: 'Swap tokens on the same chain. MAIMA finds the best DEX routes across Uniswap, 1inch, KyberSwap, and more.',
  },
  {
    icon: Layers,
    title: 'Bridges',
    desc: 'Move assets cross-chain. MAIMA aggregates bridge routes and ranks them by gas, speed, and protocol reliability.',
  },
];

export default function SupportedOperations() {
  return (
    <section
      id="operations"
      className="relative min-h-screen bg-white flex flex-col"
      aria-label="Supported Operations"
    >
      {/* Top center heading */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center pt-12 sm:pt-16 pb-8 sm:pb-10">
        <h2
          className="text-2xl font-bold text-[#1e40af] sm:text-3xl md:text-4xl text-center"
          style={{ fontFamily: 'var(--font-gagalin), sans-serif' }}
        >
          Supported Operations
        </h2>
      </div>

      {/* Two boxes 50/50 */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {OPERATIONS.map((op) => (
          <Link
            key={op.title}
            href="/app"
            className="flex-1 min-h-[40vh] md:min-h-0 flex flex-col items-center justify-center p-8 sm:p-10 md:p-12 border border-[#1e40af]/15 md:border-y-0 md:first:border-r md:last:border-l md:last:border-r-0 bg-white hover:bg-[#f8faff] transition-colors cursor-pointer"
          >
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-6"
              style={{ backgroundColor: `${THEME_COLOR}15` }}
            >
              <op.icon className="w-7 h-7" style={{ color: THEME_COLOR }} strokeWidth={2} />
            </div>
            <h3
              className="text-2xl font-bold text-[#1e40af] sm:text-3xl mb-3 text-center"
              style={{ fontFamily: 'var(--font-gagalin), sans-serif' }}
            >
              {op.title}
            </h3>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed text-center max-w-md">
              {op.desc}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
