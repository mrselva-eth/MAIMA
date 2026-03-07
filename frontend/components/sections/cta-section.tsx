'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CtaSection() {
  return (
    <section
      id="cta"
      className="relative bg-[#1e40af] py-8 sm:py-10 px-6 sm:px-8"
      aria-label="Call to action"
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 max-w-4xl mx-auto">
        <div className="text-center sm:text-left">
          <h2
            className="text-xl font-bold text-white sm:text-2xl"
            style={{ fontFamily: 'var(--font-gagalin), sans-serif' }}
          >
            Ready to try MAIMA?
          </h2>
          <p className="text-blue-100 text-sm sm:text-base mt-0.5">
            Connect your wallet and describe what you want. MAIMA handles the rest.
          </p>
        </div>
        <Button
          size="lg"
          asChild
          className="shrink-0 h-11 px-6 font-semibold rounded-lg bg-white text-[#1e40af] hover:bg-blue-50"
        >
          <Link href="/app" className="flex items-center gap-2">
            Launch App
            <ArrowRight className="w-5 h-5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
