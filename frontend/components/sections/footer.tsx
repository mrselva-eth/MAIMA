'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BackgroundBeams } from '@/components/design/background-beams';

export default function Footer() {
  return (
    <footer className="relative w-full overflow-hidden bg-[#0f172a] text-white mt-24 sm:mt-28 md:mt-32">
      <BackgroundBeams className="opacity-90" />
      <div className="relative z-10 w-full px-6 sm:px-8 lg:px-12 py-14 lg:py-16">
        <div className="w-full max-w-7xl mx-auto">
          {/* Main footer content - full width grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 mb-12 lg:mb-14">
            {/* Brand - logo + MAIMA (Gagalin) */}
            <div className="lg:col-span-6 space-y-5">
              <Link href="/" className="inline-flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:ring-offset-2 focus:ring-offset-[#0f172a] rounded">
                <Image
                  src="/images/logo.png"
                  alt=""
                  width={40}
                  height={40}
                  className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-full object-contain"
                  unoptimized
                />
                <span
                  className="text-xl sm:text-2xl lg:text-3xl text-white"
                  style={{ fontFamily: 'var(--font-gagalin), sans-serif' }}
                >
                  MAIMA
                </span>
              </Link>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-md">
                Swap and bridge analysis and report by MAIMA.
              </p>
          </div>

          {/* Product */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-[#1e40af] uppercase tracking-wider">
                Product
              </h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <Link href="/app" className="hover:text-[#60a5fa] transition-colors inline-block">
                  App
                </Link>
              </li>
              <li>
                  <Link href="/" className="hover:text-[#60a5fa] transition-colors inline-block">
                    How it works
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-[#1e40af] uppercase tracking-wider">
                Resources
              </h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <Link href="/docs" className="hover:text-[#60a5fa] transition-colors inline-block">
                  Documentation
                </Link>
              </li>
              <li>
                  <Link href="#" className="hover:text-[#60a5fa] transition-colors inline-block">
                  GitHub
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-[#1e40af] uppercase tracking-wider">
                Legal
              </h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-[#60a5fa] transition-colors inline-block">
                  Privacy
                </Link>
              </li>
              <li>
                  <Link href="#" className="hover:text-[#60a5fa] transition-colors inline-block">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

          {/* Bottom bar - full width */}
          <div className="w-full border-t border-gray-700/80 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} MAIMA. All rights reserved.</p>
            <div className="flex gap-8">
              <Link href="#" className="hover:text-[#60a5fa] transition-colors">
              Twitter
            </Link>
              <Link href="#" className="hover:text-[#60a5fa] transition-colors">
              Discord
            </Link>
              <Link href="#" className="hover:text-[#60a5fa] transition-colors">
              Telegram
            </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
