'use client';

import React, { ReactNode } from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { base, arbitrum, sepolia, mainnet } from 'wagmi/chains';

const config = getDefaultConfig({
  appName: 'MAIMA',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '1cdad9b6bd5d0d661445bfb8a4f228dc',
  chains: [base, arbitrum, sepolia, mainnet],
  ssr: true,
});

const queryClient = new QueryClient();

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
