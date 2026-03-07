'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ_ITEMS = [
  {
    q: 'What can I do with MAIMA?',
    a: 'Swap tokens on the same chain or bridge assets cross-chain. Type your intent in plain language (e.g. "Swap 100 USDC to ETH" or "Bridge 1 ETH to Arbitrum") and MAIMA finds the best routes.',
  },
  {
    q: 'How does route verification work?',
    a: 'Chainlink Price Feeds verify that route outputs match fair market value. Routes that deviate significantly are flagged. Only trusted protocols (Uniswap, 1inch, KyberSwap, etc.) are included.',
  },
  {
    q: 'Is execution real or simulated?',
    a: 'Market routes and price feeds are live. Transaction execution runs in a simulation environment via Chainlink CRE. Real on-chain execution is on the roadmap.',
  },
  {
    q: 'Which chains are supported?',
    a: 'MAIMA aggregates routes across 20+ chains including Ethereum, Base, Arbitrum, Polygon, Optimism, BSC, and Avalanche via LI.FI.',
  },
];

export default function AppFaq() {
  return (
    <div className="rounded-xl border border-[#1e40af]/15 bg-white p-4 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1e40af] mb-4">
        FAQ
      </h3>
      <Accordion type="single" collapsible className="w-full">
        {FAQ_ITEMS.map((item, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border-[#1e40af]/10">
            <AccordionTrigger className="text-sm font-medium text-gray-800 py-3 hover:no-underline hover:text-[#1e40af]">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-xs text-gray-600 pb-3">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
