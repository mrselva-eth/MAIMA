'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ConnectButton, type ConnectButtonCustomRenderProps } from '@rainbow-me/rainbowkit';
import { useDisconnect } from 'wagmi';
import Link from 'next/link';
import Image from 'next/image';
import { Zap, ChevronDown, Copy, Check, LogOut } from 'lucide-react';

const NAV_COLOR = '#1e40af';

function shortenAddress(address: string) {
  if (!address || address.length < 14) return address;
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
}

export default function Navbar() {
  const pathname = usePathname();
  const isAppPage = pathname === '/app';
  const [logoError, setLogoError] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { disconnect } = useDisconnect();

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

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-border shadow-sm z-50 w-full">
      <div className="relative h-full w-full flex items-center justify-between px-4 sm:px-6">
        {/* Left: Logo + title (on /app: DeFi tagline; else logo + maima image) */}
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

        {/* Right: Nav links (bold) + wallet — same gap between all three */}
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
          <ConnectButton.Custom>
            {({
              account,
              chain,
              mounted,
              openConnectModal,
            }: ConnectButtonCustomRenderProps) => {
              if (!mounted) {
                return (
                  <div className="h-10 w-24 rounded-full bg-gray-100 animate-pulse" aria-hidden />
                );
              }
              const connected = account && chain && account.address;
              if (connected) {
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen((o) => !o)}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm transition-colors hover:border-[#1e40af]/30 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1e40af]/20 focus:ring-offset-2"
                      aria-label="Account"
                      aria-expanded={dropdownOpen}
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
                      <ChevronDown className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {/* Dropdown below navbar */}
                    {dropdownOpen && (
                      <div
                        className="absolute right-0 top-full mt-4 w-64 rounded-lg border border-gray-200 bg-white py-3 shadow-lg"
                        role="menu"
                      >
                        {/* Address row: online + short address + copy */}
                        <div className="flex items-center justify-between gap-2 px-4 pb-3 mb-3 border-b border-gray-100">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="relative flex h-2.5 w-2.5 shrink-0" title="Connected">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                            </span>
                            <span className="text-sm font-mono text-gray-700 truncate">
                              {shortenAddress(account.address)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(account.address)}
                            className="shrink-0 p-1.5 rounded-md transition-colors hover:bg-[#1e40af]/10"
                            style={{
                              color: NAV_COLOR,
                              backgroundColor: copied ? `${NAV_COLOR}14` : 'transparent',
                            }}
                            title={copied ? 'Copied' : 'Copy address'}
                          >
                            {copied ? (
                              <Check className="h-4 w-4" strokeWidth={2.5} />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {/* Page links — theme blue hover */}
                        <div className="px-2">
                          <Link
                            href="/app"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center w-full rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-[#1e40af]/8 hover:text-[#1e40af]"
                          >
                            App
                          </Link>
                          <Link
                            href="/docs"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center w-full rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-[#1e40af]/8 hover:text-[#1e40af]"
                          >
                            Docs
                          </Link>
                        </div>
                        {/* Log out */}
                        <div className="mt-2 pt-2 border-t border-gray-100 px-2">
                          <button
                            type="button"
                            onClick={() => {
                              disconnect();
                              setDropdownOpen(false);
                            }}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            Log out
                          </button>
                        </div>
                      </div>
                    )}
                  </>
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
      </div>
    </nav>
  );
}
