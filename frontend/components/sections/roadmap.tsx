'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';

const SMOOTH_LERP = 0.2;
const SNAP_THRESHOLD = 0.0008;

// Done first (top), then Next (below). Alternating left/right: 1 left, 2 right, 3 left...
const ITEMS = [
  { side: 'left', label: 'Done', title: 'AI Intent & Chat', desc: 'Natural language parsing, wallet-gated chat.' },
  { side: 'right', label: 'Done', title: 'CRE + LI.FI + Chainlink', desc: 'Orchestration, routing, oracle verification.' },
  { side: 'left', label: 'Done', title: 'Ranking & Tracking', desc: 'Gas, speed, reliability. Process panel.' },
  { side: 'right', label: 'Next', title: 'Execution Layer', desc: 'Standardized tx submission, gas & signing.' },
  { side: 'left', label: 'Next', title: 'Multi-workflow', desc: 'Bridge + swap in one intent.' },
  { side: 'right', label: 'Next', title: 'Full on-chain + DeFi UI', desc: 'Real txs. Token/chain form view.' },
];

export default function Roadmap() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackContainerRef = useRef<HTMLDivElement>(null);
  const movingDotRef = useRef<HTMLDivElement>(null);
  const [sectionInView, setSectionInView] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const targetProgressRef = useRef(0);
  const displayProgressRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Scroll driver: extra height so last item isn't cut by next section
  const scrollDriverHeight = ITEMS.length * 100 + 80;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const updateFromScroll = () => {
      const rect = section.getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionHeight = rect.height;
      const vh = window.innerHeight;
      const progress = sectionHeight > 0 ? Math.max(0, Math.min(1, -sectionTop / sectionHeight)) : 0;
      targetProgressRef.current = progress;
      const hasEntered = sectionTop <= vh;
      const hasNotLeft = sectionTop + sectionHeight > 0 && progress < 0.98;
      setSectionInView(hasEntered && hasNotLeft);
      const rawIndex = progress * ITEMS.length + 0.3;
      setActiveIndex(Math.min(Math.max(0, Math.floor(rawIndex)), ITEMS.length - 1));
    };

    const tick = () => {
      const target = targetProgressRef.current;
      let current = displayProgressRef.current;
      const diff = target - current;
      if (Math.abs(diff) < SNAP_THRESHOLD) current = target;
      else current += diff * SMOOTH_LERP;
      displayProgressRef.current = current;
      const track = trackContainerRef.current;
      const dot = movingDotRef.current;
      if (track && dot) {
        const h = track.offsetHeight;
        dot.style.transform = `translate(-50%, -50%) translateY(${current * h}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    updateFromScroll();
    displayProgressRef.current = targetProgressRef.current;
    rafRef.current = requestAnimationFrame(tick);
    window.addEventListener('scroll', updateFromScroll, { passive: true });
    window.addEventListener('resize', updateFromScroll);
    return () => {
      window.removeEventListener('scroll', updateFromScroll);
      window.removeEventListener('resize', updateFromScroll);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="roadmap"
      className="relative bg-[#f8faff] border-t border-[#1e40af]/10"
      aria-label="Roadmap"
      style={{ height: `${scrollDriverHeight}vh` }}
    >
      <div className="sticky top-0 h-screen flex flex-col justify-start pt-20 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-4xl mx-auto px-6 sm:px-8 pb-12 flex-shrink-0 text-center">
          <h2
            className="text-2xl font-bold text-[#1e40af] sm:text-3xl md:text-4xl"
            style={{ fontFamily: 'var(--font-gagalin), sans-serif' }}
          >
            Roadmap
          </h2>
          <p className="text-gray-600 text-sm mt-2">What we built · What&apos;s next</p>
          <div className="mt-4 h-px w-24 mx-auto bg-[#1e40af]/30" aria-hidden />
        </div>

        <div className="flex-1 relative flex items-center justify-center min-h-0 px-4 pt-4 pb-20">
          <div className="relative w-full max-w-4xl" style={{ height: 'min(75vh, 520px)' }}>
            {sectionInView && (
              <div
                ref={trackContainerRef}
                className="absolute left-1/2 top-0 -translate-x-1/2 z-10 pointer-events-none flex flex-col items-center"
                style={{ height: '100%', width: 32 }}
                aria-hidden
              >
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 rounded-full bg-[#1e40af]/25" />
                <div
                  ref={movingDotRef}
                  className="absolute left-1/2 top-0 z-10 flex items-center justify-center rounded-full overflow-hidden border-2 border-[#1e40af]/40 bg-white shadow"
                  style={{
                    width: 32,
                    height: 32,
                    transform: 'translate(-50%, -50%) translateY(0px)',
                  }}
                >
                  <Image src="/images/logo.png" alt="" width={28} height={28} className="object-cover" unoptimized />
                </div>
              </div>
            )}

            {ITEMS.map((item, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 flex items-center transition-opacity duration-300"
                style={{
                  top: `${5 + (i / (ITEMS.length - 1)) * 85}%`,
                  transform: 'translateY(-50%)',
                  opacity: activeIndex === i ? 1 : 0.35,
                }}
              >
                <div
                  className={`w-[calc(50%-32px)] ${item.side === 'left' ? 'pr-6 text-right' : 'pl-6 ml-auto text-left'}`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${item.label === 'Done' ? 'text-emerald-600' : 'text-[#1e40af]'}`}>
                    {item.label}
                  </span>
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base mt-1">{item.title}</h3>
                  <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
