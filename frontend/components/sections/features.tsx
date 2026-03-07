'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';

const FEATURES = [
  { image: '/images/features/f1.png', title: 'Natural-Language Input', desc: 'Connect your wallet and describe what you want in plain language. e.g. "Swap 100 USDC to ETH" or "Bridge 1 ETH from Base to Arbitrum".' },
  { image: '/images/features/f2.png', title: 'Multi-Protocol Aggregation', desc: 'MAIMA workflows use LI.FI to aggregate routes from Uniswap, 1inch, KyberSwap, Paraswap, and more. All analysis happens within the CRE.' },
  { image: '/images/features/f3.png', title: 'Oracle Verification', desc: 'Chainlink Price Feeds verify token prices for transparency. Reports show "Oracle Verified (Chainlink)" when prices are confirmed.' },
  { image: '/images/features/f4.png', title: 'Smart Ranking', desc: 'Routes ranked by gas cost (40%), execution time (30%), and reliability (30%). See the best option with clear reasons.' },
  { image: '/images/features/f5.png', title: 'Process Tracking', desc: 'A panel shows the full flow: input checked, protocols listed and verified, top 4 displayed, then choose one and execute.' },
  { image: '/images/features/f6.png', title: 'Choose and Execute', desc: 'Click a protocol to run. Simulation mode shows CRE output without a real tx; real mode signs approval and swap in your wallet via LI.FI.' },
] as const;

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollDriverRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [failedImageUrls, setFailedImageUrls] = useState<Set<string>>(() => new Set());
  const [translateX, setTranslateX] = useState(0);

  useEffect(() => {
    const driver = scrollDriverRef.current;
    if (!driver) return;

    // Start buffer: first card stays fixed for 1 viewport before horizontal scroll begins
    const startBufferVh = 1;
    // End buffer: last card stays fixed for 2 viewports before next section
    const endBufferVh = 2;
    const cardScrollVh = FEATURES.length; // 6 viewports to scroll through cards

    const update = () => {
      const rect = driver.getBoundingClientRect();
      const top = rect.top;
      const vh = window.innerHeight;
      const startBufferPx = startBufferVh * vh;
      const cardScrollPx = cardScrollVh * vh;

      if (top > vh) {
        setTranslateX(0);
        return;
      }
      if (top + rect.height < 0) {
        setTranslateX(-(FEATURES.length - 1) * window.innerWidth);
        return;
      }

      // Progress 0: first card fixed for start buffer. Progress 1: last card fixed for end buffer.
      let progress: number;
      if (-top <= startBufferPx) {
        progress = 0;
      } else if (-top >= startBufferPx + cardScrollPx) {
        progress = 1;
      } else {
        progress = (-top - startBufferPx) / cardScrollPx;
      }
      const x = -progress * (FEATURES.length - 1) * window.innerWidth;
      setTranslateX(x);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const markImageFailed = (url: string) => {
    setFailedImageUrls((prev) => (prev.has(url) ? prev : new Set(prev).add(url)));
  };

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative bg-white"
      aria-label="Powerful Features Built for Automation"
    >
      {/* Scroll driver: start buffer + 6 cards + end buffer so first and last card stay visible longer */}
      <div ref={scrollDriverRef} style={{ height: `${(1 + FEATURES.length + 2) * 100}vh` }}>
        <div className="sticky top-16 h-[calc(100vh-4rem)] w-full flex flex-col overflow-hidden">
          {/* Fixed heading at center top during horizontal scroll */}
          <div className="flex-shrink-0 flex items-center justify-center py-4 bg-white/95 backdrop-blur-sm border-b border-[#1e40af]/10">
            <h2
              className="text-2xl font-bold text-[#1e40af] sm:text-3xl md:text-4xl"
              style={{ fontFamily: 'var(--font-gagalin), sans-serif' }}
            >
              Features
            </h2>
          </div>
          <div className="flex-1 min-h-0 relative">
            <div
              ref={stripRef}
              className="absolute inset-0 flex will-change-transform"
              style={{
                width: `${FEATURES.length * 100}vw`,
                transform: `translateX(${translateX}px)`,
              }}
            >
              {FEATURES.map((item, index) => (
                <div
                  key={index}
                  className="relative flex h-full w-screen flex-shrink-0 flex-col items-center justify-center bg-white px-6 sm:px-8 border-r border-[#1e40af]/25"
                >
                  {/* Card number — top-left corner */}
                  <span
                    className="absolute left-6 top-6 z-10 text-3xl font-bold text-[#1e40af] sm:text-4xl md:text-5xl"
                    style={{ fontFamily: 'var(--font-gagalin), sans-serif' }}
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  {/* Centered image */}
                  <div className="flex flex-shrink-0 items-center justify-center">
                    {!failedImageUrls.has(item.image) ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={180}
                        height={180}
                        className="h-auto max-h-[32vh] w-auto max-w-[200px] object-contain opacity-80"
                        unoptimized
                        onError={() => markImageFailed(item.image)}
                      />
                    ) : (
                      <span className="text-5xl font-bold text-[#1e40af]/20" aria-hidden>
                        {index + 1}
                      </span>
                    )}
                  </div>
                  {/* Text below image — centered */}
                  <div className="mt-6 sm:mt-8 flex flex-col items-center text-center max-w-2xl">
                    <h3
                      className="text-3xl font-bold text-[#1e40af] sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight"
                      style={{ fontFamily: 'var(--font-gagalin), sans-serif' }}
                    >
                      {item.title}
                    </h3>
                    <p className="mt-3 text-base text-gray-600 sm:text-lg md:text-xl">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
