'use client';

import { useAccount } from 'wagmi';
import Navbar from '@/components/navbar';
import Link from 'next/link';
import { useEffect, useRef, useState, useMemo } from 'react';
import { FlickeringGrid } from '@/components/flickering-grid';
import {
  ConnectWalletPrompt,
  IntentsPageHeader,
  IntentsStats,
  IntentList,
  IntentsEmpty,
  IntentsLoading,
  THEME_COLOR,
  type Intent,
} from '@/components/intents';

export default function IntentsPage() {
  const { address, status } = useAccount();
  const [intents, setIntents] = useState<Intent[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  const isConnectedState = status === 'connected' && Boolean(address);

  const stats = useMemo(() => {
    const total = intents.length;
    const active = intents.filter((i) => i.status === 'active').length;
    const pending = intents.filter((i) => i.status === 'pending').length;
    const executed = intents.filter((i) => i.status === 'executed').length;
    return { total, active, pending, executed };
  }, [intents]);

  useEffect(() => {
    if (!isConnectedState || !address) {
      setLoading(false);
      return;
    }
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    const fetchIntents = async () => {
      try {
        const res = await fetch(`/api/intents?address=${address}`);
        if (res.ok) {
          const data = await res.json();
          setIntents(data.intents || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };
    fetchIntents();
  }, [isConnectedState, address]);

  if (!isConnectedState) {
    return <ConnectWalletPrompt />;
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <Navbar />

      <div className="relative flex-1 flex flex-col min-h-0 pt-16">
        <FlickeringGrid
          className="absolute inset-0 z-0 pointer-events-none"
          color={THEME_COLOR}
          maxOpacity={0.06}
        />

        <div className="relative z-10 flex flex-col h-full w-full px-4 sm:px-6 py-5 min-h-0">
          <IntentsPageHeader />

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 min-h-0 mt-4">
            {/* Left: vertical stats + fills remaining height on desktop */}
            <aside className="flex flex-col gap-2 w-full sm:w-44 shrink-0 sm:min-h-0">
              <IntentsStats
                total={stats.total}
                active={stats.active}
                pending={stats.pending}
                executed={stats.executed}
              />
            </aside>

            {/* Right: list fills all remaining height with its own scroll */}
            <section className="flex flex-col flex-1 min-h-0 min-w-0">
              <div className="flex items-center justify-between mb-2 shrink-0">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  All intents
                </h2>
                {!loading && intents.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {intents.length} item{intents.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-lg border border-[#1e40af]/10 bg-white/50 p-2">
                {loading ? (
                  <IntentsLoading />
                ) : intents.length === 0 ? (
                  <IntentsEmpty />
                ) : (
                  <IntentList intents={intents} />
                )}
              </div>
            </section>
          </div>

          {/* Bottom bar: quick link */}
          <div className="shrink-0 flex items-center justify-end mt-4 pt-4 border-t border-[#1e40af]/10">
            <Link
              href="/docs"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
