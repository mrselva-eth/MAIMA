'use client';

import Image from 'next/image';

const INTEGRATIONS = [
  {
    image: '/images/pb/pb1.png',
    name: 'Chainlink CRE',
    role: 'Orchestration',
    desc: 'All analysis logic runs inside CRE workflows. Route aggregation, verification, and ranking are trust-minimized and modular.',
  },
  {
    image: '/images/pb/pb2.png',
    name: 'LI.FI',
    role: 'Routing',
    desc: 'Multi-protocol route aggregation across 20+ chains and 250+ DEXs and bridges.',
  },
  {
    image: '/images/pb/pb3.png',
    name: 'Chainlink Price Feeds',
    role: 'Verification',
    desc: 'Token prices verified on-chain. Routes flagged when output deviates from oracle data.',
  },
];

export default function Integrations() {
  return (
    <section
      id="integrations"
      className="relative min-h-screen bg-[#f8faff] flex flex-col border-y border-[#1e40af]/10"
      aria-label="Integrations"
    >
      {/* Top center heading */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center pt-12 sm:pt-16 pb-8 sm:pb-10">
        <h2
          className="text-2xl font-bold text-[#1e40af] sm:text-3xl md:text-4xl text-center"
          style={{ fontFamily: 'var(--font-gagalin), sans-serif' }}
        >
          Powered By
        </h2>
        <p className="text-gray-600 text-base sm:text-lg max-w-2xl text-center mt-2">
          Built on industry-standard infrastructure for routing and verification.
        </p>
      </div>

      {/* Three integration cards */}
      <div className="flex-1 flex flex-col md:flex-row items-stretch min-h-0 px-6 sm:px-8 pb-12">
        {INTEGRATIONS.map((item) => (
          <div
            key={item.name}
            className="relative flex-1 min-h-[30vh] md:min-h-0 flex flex-col justify-end rounded-xl border border-[#1e40af]/15 bg-white p-6 sm:p-8 shadow-sm mx-0 md:mx-2 first:md:ml-0 last:md:mr-0 my-2 md:my-0 overflow-hidden"
          >
            {/* Background image - covers full card, non-interactable */}
            <div className="absolute inset-0 z-0 opacity-[0.12] pointer-events-none">
              <Image
                src={item.image}
                alt=""
                fill
                className="object-cover"
                unoptimized
                aria-hidden
              />
            </div>
            <div className="relative z-10 flex flex-col items-end text-right">
              <span className="text-xs font-semibold text-[#1e40af]/70 uppercase tracking-wider">
                {item.role}
              </span>
              <h3
                className="text-lg font-bold text-[#1e40af] sm:text-xl mt-1 mb-2"
                style={{ fontFamily: 'var(--font-gagalin), sans-serif' }}
              >
                {item.name}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
