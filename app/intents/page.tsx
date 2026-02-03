'use client';

import { useAccount } from 'wagmi';
import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight, Plus, Wallet, Inbox, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FlickeringGrid } from '@/components/flickering-grid';

const THEME_COLOR = '#1e40af';

interface Intent {
  id: string;
  type: string;
  description: string;
  status: 'active' | 'pending' | 'executed' | 'expired';
  createdAt: string;
}

const statusConfig: Record<Intent['status'], { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  executed: {
    label: 'Executed',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  expired: {
    label: 'Expired',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
};

export default function IntentsPage() {
  const { isConnected, address } = useAccount();
  const [intents, setIntents] = useState<Intent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      const fetchIntents = async () => {
        try {
          const res = await fetch(`/api/intents?address=${address}`);
          if (res.ok) {
            const data = await res.json();
            setIntents(data.intents || []);
          }
        } catch (error) {
          console.log('[v0] Error fetching intents:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchIntents();
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="relative pt-16 min-h-screen flex items-center justify-center px-6 overflow-hidden">
          <FlickeringGrid
            className="absolute inset-0 z-0"
            color={THEME_COLOR}
            maxOpacity={0.08}
          />
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

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="relative pt-16 min-h-screen overflow-hidden">
        <FlickeringGrid
          className="absolute inset-0 z-0 pointer-events-none"
          color={THEME_COLOR}
          maxOpacity={0.06}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 sm:py-16">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
            <div>
              <h1 className="font-[family-name:var(--font-gagalin)] text-4xl sm:text-5xl text-foreground tracking-tight">
                Your Intents
              </h1>
              <p className="text-muted-foreground mt-2 text-base sm:text-lg">
                Manage all your automated actions
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="rounded-xl font-semibold shadow-md hover:opacity-90 transition-opacity shrink-0"
              style={{ backgroundColor: THEME_COLOR }}
            >
              <Link href="/intents/create" className="flex items-center gap-2 text-white">
                <Plus className="w-5 h-5" />
                New Intent
              </Link>
            </Button>
          </div>

          {/* Intents list */}
          <div className="space-y-4">
            {loading ? (
              <Card className="p-12 border-[#1e40af]/15 bg-card/80 rounded-2xl">
                <div className="flex flex-col items-center justify-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-muted-foreground font-medium">Loading intents...</p>
                </div>
              </Card>
            ) : intents.length === 0 ? (
              <Card className="p-12 sm:p-16 border-[#1e40af]/15 bg-card/80 rounded-2xl text-center">
                <div className="flex justify-center mb-6">
                  <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                    <Inbox className="h-10 w-10" style={{ color: THEME_COLOR }} />
                  </span>
                </div>
                <h2 className="font-[family-name:var(--font-gagalin)] text-2xl sm:text-3xl text-foreground mb-2">
                  No Intents Yet
                </h2>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                  Create your first intent to automate your crypto actions.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="rounded-xl font-semibold shadow-md hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: THEME_COLOR }}
                >
                  <Link href="/intents/create" className="flex items-center gap-2 text-white justify-center">
                    Create Intent
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </Card>
            ) : (
              intents.map((intent) => {
                const status = statusConfig[intent.status];
                return (
                  <Card
                    key={intent.id}
                    className="group p-6 sm:p-8 border-[#1e40af]/15 bg-card/80 rounded-2xl hover:border-[#1e40af]/30 hover:shadow-lg transition-all duration-200 cursor-pointer"
                  >
                    <Link href={`/intents/${intent.id}`} className="block">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                              {intent.type}
                            </h3>
                            <span
                              className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </div>
                          <p className="text-muted-foreground mb-3 line-clamp-2">
                            {intent.description}
                          </p>
                          <p className="text-sm text-muted-foreground/80">
                            Created {new Date(intent.createdAt).toLocaleDateString(undefined, {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#1e40af]/30 px-4 py-2 text-sm font-medium text-primary bg-transparent group-hover:bg-primary/5 transition-colors shrink-0 self-start sm:self-center">
                          View
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </Link>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
