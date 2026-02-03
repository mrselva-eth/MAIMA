'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import Image from 'next/image';
import { Zap, ChevronDown } from 'lucide-react';

const NAV_COLOR = '#1e40af';

export default function Navbar() {
  const [logoError, setLogoError] = useState(false);
  const [nameError, setNameError] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-border shadow-sm z-50 w-full">
      <div className="relative h-full w-full flex items-center justify-between px-4 sm:px-6">
        {/* Left: Logo (circle) + Project name image (no drag) */}
        <Link
          href="/"
          className="navbar-brand flex items-center gap-3 shrink-0 z-10"
          aria-label="MAIMA - Home"
        >
          {/* Logo: circular */}
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
          {/* Project name: maima.png image */}
          {!nameError ? (
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

        {/* Center: Nav links — #1e40af, underline on hover */}
        <div className="hidden md:flex absolute left-0 right-0 top-0 h-full items-center justify-center gap-12">
          <Link
            href="/intents"
            className="navbar-link text-sm font-medium whitespace-nowrap transition-colors"
          >
            Intents
          </Link>
          <Link
            href="/dashboard"
            className="navbar-link text-sm font-medium whitespace-nowrap transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/docs"
            className="navbar-link text-sm font-medium whitespace-nowrap transition-colors"
          >
            Docs
          </Link>
        </div>

        {/* Right: Custom connect — single clean pill when connected */}
        <div className="shrink-0 z-10">
          <ConnectButton.Custom>
            {({
              account,
              chain,
              mounted,
              openAccountModal,
              openConnectModal,
            }) => {
              if (!mounted) {
                return (
                  <div className="h-10 w-24 rounded-full bg-gray-100 animate-pulse" aria-hidden />
                );
              }
              const connected = account && chain && account.address;
              if (connected) {
                return (
                  <button
                    type="button"
                    onClick={openAccountModal}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm transition-colors hover:border-[#1e40af]/30 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1e40af]/20 focus:ring-offset-2"
                    aria-label="Account"
                  >
                    {account.ensAvatar ? (
                      <img
                        src={account.ensAvatar}
                        alt=""
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: NAV_COLOR }}
                      >
                        {account.displayName.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="max-w-[120px] truncate sm:max-w-[140px]">
                      {account.displayName}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
                  </button>
                );
              }
              return (
                <button
                  type="button"
                  onClick={openConnectModal}
                  className="rounded-full px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:ring-offset-2"
                  style={{ backgroundColor: NAV_COLOR }}
                >
                  Connect Wallet
                </button>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </nav>
  );
}
