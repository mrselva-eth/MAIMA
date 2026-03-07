'use client';

const STEPS = [
  'Type your intent (e.g. "Swap 100 USDC to ETH")',
  'MAIMA parses, fetches routes, and verifies with Chainlink',
  'Review ranked protocols and pick the best option',
  'Execute the transaction in your wallet',
];

export default function AppInstructionRoadmap() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-[#1e40af]/15 bg-white p-4 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1e40af] mb-4">
          How it works
        </h3>
        <ol className="space-y-3">
          {STEPS.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[#1e40af]/10 text-[#1e40af] flex items-center justify-center font-bold text-xs">
                {i + 1}
              </span>
              <span className="text-gray-600 leading-snug pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="rounded-lg border border-[#1e40af]/10 bg-blue-50/50 p-3 text-xs text-gray-600">
        <p><strong className="text-[#1e40af]">Note:</strong> Market routes and price feeds are live. Transaction execution is simulated via Chainlink CRE.</p>
      </div>
    </div>
  );
}
