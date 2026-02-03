'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';

const steps = [
  {
    title: 'Express Intent',
    desc: 'Say what you want in plain language. Describe your goal and MAIMA turns it into an executable intent.',
  },
  {
    title: 'AI Processing',
    desc: 'Parsed into executable actions. Natural language is interpreted and structured for on-chain execution.',
  },
  {
    title: 'Multisig Approval',
    desc: 'High-risk intents need multi-signature. Your team approves before execution.',
  },
  {
    title: 'CRE Monitoring',
    desc: 'Chainlink monitors conditions 24/7. Real-time data triggers when your intent can be fulfilled.',
  },
  {
    title: 'Auto Execution',
    desc: 'Executes on-chain when conditions are met. No manual steps—fully automated.',
  },
  {
    title: 'Verification',
    desc: 'On-chain audit trail. Transparent and verifiable from start to finish.',
  },
];

// Smooth follow: higher = snappier. 0.2 = responsive but smooth.
const SMOOTH_LERP = 0.2;
const SNAP_THRESHOLD = 0.0008;

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackContainerRef = useRef<HTMLDivElement>(null);
  const movingDotRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [sectionInView, setSectionInView] = useState(false);
  const targetProgressRef = useRef(0);
  const displayProgressRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const updateFromScroll = () => {
      const rect = section.getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionHeight = rect.height;
      const viewportHeight = window.innerHeight;

      const progress = sectionHeight > 0 ? Math.max(0, Math.min(1, -sectionTop / sectionHeight)) : 0;
      targetProgressRef.current = progress;
      setScrollProgress(progress);

      const hasEntered = sectionTop <= 0;
      const hasNotLeft = sectionTop + sectionHeight > 0 && progress < 0.92;
      setSectionInView(hasEntered && hasNotLeft);

      if (sectionTop > viewportHeight) {
        setActiveIndex(0);
        return;
      }
      if (sectionTop + sectionHeight < 0) {
        setActiveIndex(steps.length - 1);
        return;
      }

      const rawIndex = progress * steps.length + 0.42;
      const index = Math.min(Math.max(0, Math.floor(rawIndex)), steps.length - 1);
      setActiveIndex(index);
    };

    const tick = () => {
      const target = targetProgressRef.current;
      let current = displayProgressRef.current;
      const diff = target - current;

      if (Math.abs(diff) < SNAP_THRESHOLD) {
        current = target;
      } else {
        current += diff * SMOOTH_LERP;
      }
      displayProgressRef.current = current;

      const track = trackContainerRef.current;
      const dot = movingDotRef.current;
      if (track && dot) {
        const h = track.offsetHeight;
        dot.style.top = '0';
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
      id="how-it-works"
      className="relative bg-white"
      aria-label="How MAIMA Works"
    >
      {/* Left scale track: big vertical line + 6 static dots + one dot that moves with scroll */}
      {sectionInView && (
        <div
          ref={trackContainerRef}
          className="fixed left-4 sm:left-6 md:left-8 top-1/2 -translate-y-1/2 z-[100] flex flex-col items-center pointer-events-none"
          style={{ height: 'min(70vh, 520px)' }}
          aria-hidden
        >
          {/* Vertical line (big line) behind dots */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-1 rounded-full bg-[#1e40af]/25"
            style={{ top: 0, bottom: 0, minHeight: '100%' }}
          />
          {/* 6 static dots along the line */}
          <div className="relative flex flex-col justify-between items-center w-4 h-full flex-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className="flex-shrink-0 rounded-full border-2 z-[1]"
                style={{
                  width: 14,
                  height: 14,
                  backgroundColor: 'transparent',
                  borderColor: 'rgba(30, 64, 175, 0.4)',
                }}
              />
            ))}
          </div>
          {/* Moving indicator: logo.png, position updated every frame in RAF for smooth motion */}
          <div
            ref={movingDotRef}
            className="absolute left-1/2 z-10 flex items-center justify-center rounded-full overflow-hidden border-2 border-[#1e40af]/40 will-change-transform"
            style={{
              width: 20,
              height: 20,
              top: 0,
              transform: 'translate(-50%, -50%) translateY(0px)',
            }}
          >
            <Image
              src="/images/logo.png"
              alt=""
              width={20}
              height={20}
              className="h-full w-full object-cover"
              unoptimized
            />
          </div>
        </div>
      )}

      {/* Scroll driver: total height = 6 full viewports so user scrolls through each step */}
      <div className="relative" style={{ height: `${steps.length * 100}vh` }}>
        {steps.map((step, index) => (
          <div
            key={index}
            className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden"
            style={{
              zIndex: index,
              // Light blue → darker at 3 → light again: opaque so each panel fully covers the previous
              backgroundColor: [
                '#f5f7ff', // 1: light blue
                '#eef2ff', // 2: slightly more
                '#dce4ff', // 3: mid — darkest
                '#e8edff', // 4: gradually reduce
                '#f0f4ff', // 5: lighter
                '#f8f9ff', // 6: light blue again
              ][index],
            }}
          >
            {/* Ensures this panel fully covers the previous when stacked */}
            <div className="absolute inset-0 z-0" aria-hidden style={{ backgroundColor: 'inherit' }} />
            {/* Content - only visible when this panel is active; fits in viewport so no cut-off */}
            <div
              className={`relative z-10 mx-auto w-full max-w-4xl px-6 sm:px-8 py-8 sm:py-12 text-center transition-all duration-700 ease-out flex flex-col items-center justify-center max-h-[85vh] min-h-0 ${
                activeIndex === index
                  ? 'translate-y-0 opacity-100'
                  : 'pointer-events-none translate-y-[15%] opacity-0'
              }`}
            >
              <span className="text-xs font-semibold text-[#1e40af]/60 tracking-widest uppercase mb-3 sm:mb-4 block shrink-0">
                {String(index + 1).padStart(2, '0')} — How MAIMA Works
              </span>
              <h2
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-[#1e40af] mb-4 sm:mb-6 leading-tight shrink-0"
                style={{ fontFamily: 'var(--font-gagalin), sans-serif' }}
              >
                {step.title}
              </h2>
              <p className="text-gray-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed min-h-0 overflow-y-auto">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
