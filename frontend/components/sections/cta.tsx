'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const THEME_COLOR = '#1e40af';

export default function Cta() {
  return (
    <section
      id="cta"
      className="relative py-20 sm:py-24 md:py-28"
      style={{ backgroundColor: '#f0f4ff' }}
      aria-label="Launch App"
    >
      <div className="w-full max-w-3xl mx-auto px-6 sm:px-8 text-center">
        <h2
          className="text-2xl font-bold sm:text-3xl md:text-4xl mb-4"
          style={{ fontFamily: 'var(--font-gagalin), sans-serif', color: THEME_COLOR }}
        >
          Ready to Try?
        </h2>
        <p className="text-gray-600 mb-8 sm:mb-10 max-w-xl mx-auto">
          Connect your wallet and describe what you want. MAIMA handles the rest.
        </p>
        <Button
          size="lg"
          asChild
          className="h-14 px-10 text-lg font-semibold rounded-xl shadow-lg"
          style={{ backgroundColor: THEME_COLOR }}
        >
          <Link
            href="/app"
            className="flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
          >
            Launch App
            <ArrowRight className="w-5 h-5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
