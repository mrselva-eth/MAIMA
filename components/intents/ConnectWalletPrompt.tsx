'use client';

import Navbar from '@/components/navbar';
import { Wallet } from 'lucide-react';
import { FlickeringGrid } from '@/components/flickering-grid';
import { THEME_COLOR } from './constants';

export function ConnectWalletPrompt() {
  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <Navbar />
      <div className="relative flex-1 flex items-center justify-center px-6 min-h-0">
        <FlickeringGrid className="absolute inset-0 z-0" color={THEME_COLOR} maxOpacity={0.08} />
        <div className="relative z-10 max-w-md text-center space-y-8">
          <div className="flex justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Wallet className="h-8 w-8" style={{ color: THEME_COLOR }} />
            </span>
          </div>
          <div className="space-y-3">
            <h1 className="font-[family-name:var(--font-gagalin)] text-3xl sm:text-4xl text-foreground tracking-tight">
              Connect Your Wallet
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              Connect your wallet to view and manage your intents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
