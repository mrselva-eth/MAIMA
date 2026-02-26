'use client';

import { ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { ConnectWalletButton } from '@/components/ui/ConnectWalletButton';

interface RequireWalletProps {
  children: ReactNode;
}

export function RequireWallet({ children }: RequireWalletProps) {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 pt-16">
        <h2 className="text-xl font-bold text-[#1e40af]">Connect Wallet</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          Please connect your wallet to access the MAIMA automated agent.
        </p>
        <ConnectWalletButton />
      </div>
    );
  }

  return <>{children}</>;
}

export default RequireWallet;
