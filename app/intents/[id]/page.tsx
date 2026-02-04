'use client';

import { useAccount } from 'wagmi';
import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Wallet } from 'lucide-react';
import { FlickeringGrid } from '@/components/flickering-grid';

const THEME_COLOR = '#1e40af';

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  validated: { label: 'Validated', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  executed: { label: 'Executed', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  expired: { label: 'Expired', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  revoked: { label: 'Revoked', className: 'bg-gray-100 text-gray-600 border-gray-200' },
};

interface IntentDetail {
  id: string;
  type: string;
  description: string;
  status: string;
  createdAt?: string;
  expiresAt?: string;
  walletAddress?: string;
  tokenIn?: string;
  tokenOut?: string;
  amount?: string;
  constraints?: Array<{ type: string; value: string | number; unit?: string }>;
}

export default function IntentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { address, status } = useAccount();
  const isConnectedState = status === 'connected' && Boolean(address);
  const [intent, setIntent] = useState<IntentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchIntent = async () => {
      try {
        const res = await fetch(`/api/intents/${id}`);
        if (!res.ok) {
          if (res.status === 404) setError('Intent not found');
          else setError('Failed to load intent');
          setIntent(null);
          return;
        }
        const data = await res.json();
        setIntent(data.data ?? null);
      } catch {
        setError('Failed to load intent');
        setIntent(null);
      } finally {
        setLoading(false);
      }
    };
    fetchIntent();
  }, [id]);

  if (!isConnectedState) {
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
                Connect your wallet to view intent details.
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

        <div className="relative z-10 max-w-2xl mx-auto px-6 py-12 sm:py-16">
          <Link
            href="/intents"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-[#1e40af] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Intents
          </Link>

          {loading ? (
            <Card className="p-12 border-[#1e40af]/15 bg-card/80 rounded-2xl flex items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: THEME_COLOR }} />
              <span className="text-muted-foreground font-medium">Loading intent...</span>
            </Card>
          ) : error || !intent ? (
            <Card className="p-12 border-[#1e40af]/15 bg-card/80 rounded-2xl text-center">
              <p className="text-muted-foreground mb-6 font-medium">{error || 'Intent not found'}</p>
              <Button asChild variant="outline" className="rounded-xl border-[#1e40af]/30 text-[#1e40af] hover:bg-[#1e40af]/10">
                <Link href="/intents">Back to Intents</Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="font-[family-name:var(--font-gagalin)] text-3xl sm:text-4xl text-foreground tracking-tight">
                  Intent Details
                </h1>
                <span
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                    (statusConfig[intent.status] ?? statusConfig.pending).className
                  }`}
                >
                  {(statusConfig[intent.status] ?? statusConfig.pending).label}
                </span>
              </div>

              <Card className="p-6 sm:p-8 border-[#1e40af]/15 bg-card/80 rounded-2xl space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground font-semibold mb-1">Intent ID</p>
                  <p className="text-sm font-mono text-foreground break-all">{intent.id}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground font-semibold mb-1">Type</p>
                  <p className="text-foreground capitalize">{intent.type}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground font-semibold mb-1">Description</p>
                  <p className="text-foreground">{intent.description}</p>
                </div>

                {intent.type === 'swap' && (intent.tokenIn || intent.tokenOut || intent.amount) && (
                  <div className="grid grid-cols-2 gap-4">
                    {intent.tokenIn && (
                      <div>
                        <p className="text-sm text-muted-foreground font-semibold mb-1">From</p>
                        <p className="text-foreground">{intent.tokenIn}</p>
                      </div>
                    )}
                    {intent.tokenOut && (
                      <div>
                        <p className="text-sm text-muted-foreground font-semibold mb-1">To</p>
                        <p className="text-foreground">{intent.tokenOut}</p>
                      </div>
                    )}
                    {intent.amount && (
                      <div>
                        <p className="text-sm text-muted-foreground font-semibold mb-1">Amount</p>
                        <p className="text-foreground">{intent.amount}</p>
                      </div>
                    )}
                  </div>
                )}

                {intent.constraints && intent.constraints.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground font-semibold mb-2">Constraints</p>
                    <ul className="text-sm space-y-1">
                      {intent.constraints.map((c, i) => (
                        <li key={i} className="text-foreground">
                          • {c.type}: {String(c.value)} {c.unit ?? ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {intent.createdAt && (
                  <div>
                    <p className="text-sm text-muted-foreground font-semibold mb-1">Created</p>
                    <p className="text-foreground">{new Date(intent.createdAt).toLocaleString()}</p>
                  </div>
                )}

                {intent.expiresAt && (
                  <div>
                    <p className="text-sm text-muted-foreground font-semibold mb-1">Expires</p>
                    <p className="text-foreground">{new Date(intent.expiresAt).toLocaleString()}</p>
                  </div>
                )}
              </Card>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 rounded-xl font-semibold border-[#1e40af]/30 text-[#1e40af] hover:bg-[#1e40af]/10"
                >
                  <Link href="/intents" className="flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    All Intents
                  </Link>
                </Button>
                <Button
                  asChild
                  className="flex-1 rounded-xl font-semibold shadow-md hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: THEME_COLOR }}
                >
                  <Link href="/intents/create" className="flex items-center justify-center gap-2 text-white">
                    New Intent
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
