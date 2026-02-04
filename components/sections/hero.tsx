'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { OrbitsBackground } from '@/components/orbits-background';

const THEME_COLOR = '#1e40af';

export default function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex overflow-hidden bg-white">
      {/* Left: Project name image + description + Launch button (bottom-left) */}
      {/* Left: Project name image + description only */}
      <div className="relative z-10 flex flex-col justify-center w-full min-w-0 px-6 py-24 sm:px-10 md:w-1/2 md:px-12 lg:px-16">
        <div className="flex flex-col gap-6">
          <div className="navbar-brand">
            <Image
              src="/images/maima.png"
              alt="MAIMA"
              width={400}
              height={120}
              className="h-20 w-auto object-contain sm:h-24 md:h-28 lg:h-32 max-w-[420px]"
              draggable={false}
              unoptimized
              priority
            />
          </div>
          <p className="text-base text-gray-600 max-w-md leading-relaxed sm:text-lg">
            Machine-AI for Managed Actions. An intent-based smart wallet that turns your goals into
            executable intents—with multisig security, real-time monitoring, and on-chain execution.
          </p>
        </div>
      </div>

      {/* Right: Orbits animation + Launch button at bottom-right */}
      <div className="absolute right-0 top-0 bottom-0 left-1/2 hidden md:block">
        <OrbitsBackground color={THEME_COLOR} className="h-full w-full" />
        {/* Launch button — right side bottom corner */}
        <div className="absolute bottom-8 right-8 z-20">
          <Button
            size="lg"
            asChild
            className="h-12 px-8 text-base font-semibold rounded-lg shadow-lg"
            style={{ backgroundColor: THEME_COLOR }}
          >
            <Link
              href="/intents"
              className="flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
            >
              Launch App
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Mobile: Launch button below description */}
      <div className="absolute bottom-8 left-6 right-6 z-20 md:hidden">
        <Button
          size="lg"
          asChild
          className="h-12 w-full px-8 text-base font-semibold rounded-lg"
          style={{ backgroundColor: THEME_COLOR }}
        >
          <Link
            href="/intents"
            className="flex items-center justify-center gap-2 text-white hover:opacity-90 transition-opacity"
          >
            Launch App
            <ArrowRight className="w-5 h-5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
