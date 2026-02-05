'use client';

import Image from 'next/image';
import FlickeringGrid from '@/components/design/flickering-grid';

/**
 * Standalone full-page section: is.png image with flickering grid on top.
 * Used between Features and How It Works on the home page.
 */
export default function MaimaImageSection() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 pt-16 pb-[20vh] sm:pb-[25vh] bg-white overflow-hidden">
      {/* Main image: is.png — full page, no transparency */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <Image
          src="/images/is.png"
          alt=""
          fill
          className="object-cover w-full h-full"
          priority={false}
          unoptimized
          aria-hidden
        />
      </div>
      {/* Background design: flickering grid on top of all layers */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <FlickeringGrid
          color="rgb(30, 64, 175)"
          maxOpacity={0.2}
          squareSize={4}
          gridGap={6}
          flickerChance={0.3}
        />
      </div>
    </section>
  );
}
