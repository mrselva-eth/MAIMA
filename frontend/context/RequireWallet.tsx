'use client';

import { useAccount } from 'wagmi';
import { ConnectButton, type ConnectButtonCustomRenderProps } from '@rainbow-me/rainbowkit';
import { ReactNode } from 'react';

const THEME_COLOR = '#1e40af';

interface RequireWalletProps {
  children: ReactNode;
}

/**
 * Gates app content behind wallet connection. Renders children only when connected.
 * When disconnected, shows a prompt to connect wallet (same as before: no access without connect).
 * Reusable across app and other routes; import from @/context/RequireWallet.
 */
export function RequireWallet({ children }: RequireWalletProps) {
  const { isConnected, isReconnecting } = useAccount();

  if (isReconnecting) {
    return (
      <div className="flex-1 flex flex-col min-h-0 pt-16">
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-muted-foreground text-sm">Reconnecting wallet…</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex-1 flex flex-col min-h-0 pt-16">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <h1 className="text-3xl sm:text-4xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-gagalin), sans-serif' }}>
              Connect your wallet
            </h1>
            <p className="text-muted-foreground text-sm">
              You need to connect your wallet to access the app.
            </p>
            <ConnectButton.Custom>
              {({ openConnectModal }: ConnectButtonCustomRenderProps) => (
                <button
                  type="button"
                  onClick={openConnectModal}
                  className="rounded-full px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:ring-offset-2"
                  style={{ backgroundColor: THEME_COLOR }}
                >
                  Connect Wallet
                </button>
              )}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default RequireWallet;
