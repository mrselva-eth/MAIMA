'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet } from 'lucide-react';

export function ConnectWalletButton() {
    return (
        <ConnectButton.Custom>
            {({
                account,
                chain,
                openAccountModal,
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
                        {...(!ready && {
                            'aria-hidden': true,
                            style: {
                                opacity: 0,
                                pointerEvents: 'none',
                                userSelect: 'none',
                            },
                        })}
                    >
                        {(() => {
                            if (!connected) {
                                return (
                                    <button
                                        onClick={openConnectModal}
                                        type="button"
                                        className="bg-[#1e40af] hover:bg-[#1e40af]/90 text-white text-sm font-medium py-2 px-5 rounded-full transition-all shadow-md active:scale-95 flex items-center gap-2"
                                    >
                                        <Wallet className="w-4 h-4" />
                                        Connect Wallet
                                    </button>
                                );
                            }

                            if (chain.unsupported) {
                                return (
                                    <button
                                        onClick={openChainModal}
                                        type="button"
                                        className="bg-red-50 focus:ring-red-400 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-medium py-2 px-5 rounded-full transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        Wrong network
                                    </button>
                                );
                            }

                            return (
                                <button
                                    onClick={openAccountModal}
                                    type="button"
                                    className="bg-white hover:bg-gray-50 text-[#1e40af] border border-gray-200 shadow-sm text-sm font-medium py-2 px-5 rounded-full transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <div
                                        className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center bg-gray-50"
                                    >
                                        {chain.iconUrl && (
                                            <img
                                                alt={chain.name ?? 'Chain icon'}
                                                src={chain.iconUrl}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    {account.displayName}
                                </button>
                            );
                        })()}
                    </div>
                );
            }}
        </ConnectButton.Custom>
    );
}
