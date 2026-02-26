'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Zap } from 'lucide-react';
import { ConnectWalletButton } from '@/components/ui/ConnectWalletButton';

const NAV_COLOR = '#1e40af';

export default function Navbar() {
  const pathname = usePathname();
  const isAppPage = pathname === '/app';
  const [logoError, setLogoError] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-border shadow-sm z-50 w-full">
      <div className="relative h-full w-full flex items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="navbar-brand flex items-center gap-3 shrink-0 z-10 min-w-0"
          aria-label="MAIMA - Home"
        >
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/5">
            {!logoError ? (
              <Image
                src="/images/logo.png"
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 object-cover"
                priority
                unoptimized
                draggable={false}
                onError={() => setLogoError(true)}
              />
            ) : (
              <Zap className="h-5 w-5" style={{ color: NAV_COLOR }} aria-hidden />
            )}
          </span>
          {isAppPage ? (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate sm:text-base" style={{ color: NAV_COLOR }}>
                MAIMA — DeFi Optimistic Solution
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                Swap or bridge → report (accuracy, gas).
              </span>
            </div>
          ) : !nameError ? (
            <Image
              src="/images/maima.png"
              alt="MAIMA"
              width={240}
              height={72}
              className="h-14 w-auto object-contain sm:h-[3.5rem] md:h-16"
              draggable={false}
              unoptimized
              onError={() => setNameError(true)}
            />
          ) : (
            <span className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: NAV_COLOR }}>
              MAIMA
            </span>
          )}
        </Link>

        {/* Right: Nav links */}
        <div className="flex items-center gap-7 sm:gap-9 shrink-0 z-10">
          <div className="hidden sm:flex items-center gap-7 sm:gap-9">
            <Link
              href="/app"
              className="navbar-link text-sm font-bold whitespace-nowrap transition-colors"
            >
              App
            </Link>
            <Link
              href="/docs"
              className="navbar-link text-sm font-bold whitespace-nowrap transition-colors"
            >
              Docs
            </Link>
          </div>
          <div className="relative" ref={dropdownRef}>
            <ConnectWalletButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
