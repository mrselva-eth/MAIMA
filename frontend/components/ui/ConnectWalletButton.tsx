'use client';

import { useState, useRef, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useDisconnect } from 'wagmi';
import Link from 'next/link';
import { Wallet, Copy, Check, LogOut, LayoutDashboard, FileText } from 'lucide-react';

const THEME_COLOR = '#1e40af';

export function ConnectWalletButton() {
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

    const handleLogout = () => {
        disconnect();
        setDropdownOpen(false);
    };

    return (
        <ConnectButton.Custom>
            {({
                account,
                chain,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
            }: any) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                    ready &&
                    account &&
                    chain &&
                    (!authenticationStatus || authenticationStatus === 'authenticated');

                return (
                    <div
                        ref={dropdownRef}
                        className="relative"
                        {...(!ready && {
                            'aria-hidden': true,
                            style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' },
                        })}
                    >
                        {!connected && (
                            <button
                                onClick={openConnectModal}
                                type="button"
                                className="text-white text-sm font-medium py-2 px-5 rounded-full transition-all shadow-md active:scale-95 flex items-center gap-2"
                                style={{ backgroundColor: THEME_COLOR }}
                            >
                                <Wallet className="w-4 h-4" />
                                Connect Wallet
                            </button>
                        )}

                        {connected && chain?.unsupported && (
                            <button
                                onClick={openChainModal}
                                type="button"
                                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-medium py-2 px-5 rounded-full transition-all active:scale-95 flex items-center gap-2"
                            >
                                Wrong network
                            </button>
                        )}

                        {connected && !chain?.unsupported && (
                            <>
                                <button
                                    onClick={() => setDropdownOpen((o) => !o)}
                                    type="button"
                                    className="bg-white hover:bg-gray-50 border border-gray-200 shadow-sm text-sm font-medium py-2 px-5 rounded-full transition-all active:scale-95 flex items-center gap-2"
                                    style={{ color: THEME_COLOR }}
                                >
                                    <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center bg-gray-50">
                                        {chain?.iconUrl && (
                                            <img
                                                alt={chain.name ?? 'Chain'}
                                                src={chain.iconUrl}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    {account?.displayName}
                                </button>

                                {dropdownOpen && (
                                    <div
                                        className="absolute right-0 mt-2 w-56 rounded-lg border border-[#1e40af]/20 bg-white shadow-lg z-50 py-2"
                                        style={{ borderColor: `${THEME_COLOR}33` }}
                                    >
                                        {/* Wallet address + copy */}
                                        <div className="px-3 py-2 border-b border-gray-100">
                                            <p className="text-xs text-gray-500 mb-1">Connected</p>
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-medium truncate" style={{ color: THEME_COLOR }}>
                                                    {account?.displayName}
                                                </p>
                                                <button
                                                    onClick={() => account?.address && handleCopy(account.address)}
                                                    className="shrink-0 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                                                    aria-label="Copy address"
                                                >
                                                    {copied ? (
                                                        <Check className="w-4 h-4 text-green-600" strokeWidth={2.5} />
                                                    ) : (
                                                        <Copy className="w-4 h-4 text-gray-500" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* App & Docs */}
                                        <div className="py-1">
                                            <Link
                                                href="/app"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                                                style={{ color: THEME_COLOR }}
                                            >
                                                <LayoutDashboard className="w-4 h-4" />
                                                App
                                            </Link>
                                            <Link
                                                href="/docs"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                                                style={{ color: THEME_COLOR }}
                                            >
                                                <FileText className="w-4 h-4" />
                                                Docs
                                            </Link>
                                        </div>

                                        {/* Logout */}
                                        <div className="border-t border-gray-100 pt-1">
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Log out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                );
            }}
        </ConnectButton.Custom>
    );
}
