'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CTA() {
  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-8 bg-white">
      <div className="max-w-4xl w-full mx-auto text-center space-y-6">
        <h2
          className="text-4xl font-bold text-[#1e40af] sm:text-5xl md:text-6xl"
          style={{ fontFamily: 'var(--font-gagalin), sans-serif' }}
        >
          Ready to Automate Your Crypto?
        </h2>
        <p className="text-gray-600 text-base sm:text-lg max-w-xl mx-auto">
          Express your goals, not your transactions.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <Button
            size="lg"
            asChild
            className="h-12 px-8 text-base font-semibold rounded-lg"
            style={{ backgroundColor: '#1e40af' }}
          >
            <Link href="/intents" className="flex items-center justify-center gap-2 text-white hover:opacity-90 transition-opacity">
              Launch App
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 px-8 text-base font-semibold rounded-lg border-2 border-[#1e40af] text-[#1e40af] bg-transparent hover:bg-[#1e40af] hover:text-white transition-colors"
          >
            Read Documentation
          </Button>
        </div>
      </div>
    </section>
  );
}
