'use client';

import { useAccount } from 'wagmi';
import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';

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
  const router = useRouter();
  const id = params?.id as string;
  const { isConnected } = useAccount();
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

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-16 h-screen flex items-center justify-center px-6">
          <div className="max-w-md text-center space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Connect Your Wallet</h1>
            <p className="text-gray-600">Please connect your wallet to view intent details.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-16">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <Link
            href="/intents"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Intents
          </Link>

          {loading ? (
            <Card className="p-12 border-border/50 flex items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-gray-600">Loading intent...</span>
            </Card>
          ) : error || !intent ? (
            <Card className="p-12 border-border/50 text-center">
              <p className="text-gray-600 mb-6">{error || 'Intent not found'}</p>
              <Button asChild variant="outline">
                <Link href="/intents">Back to Intents</Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-foreground">Intent Details</h1>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    intent.status === 'validated' || intent.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : intent.status === 'executed'
                        ? 'bg-blue-100 text-blue-700'
                        : intent.status === 'revoked' || intent.status === 'expired'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {intent.status}
                </span>
              </div>

              <Card className="p-6 border-border/50 space-y-6">
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Intent ID</p>
                  <p className="text-sm font-mono text-foreground break-all">{intent.id}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Type</p>
                  <p className="text-foreground capitalize">{intent.type}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Description</p>
                  <p className="text-foreground">{intent.description}</p>
                </div>

                {intent.type === 'swap' && (intent.tokenIn || intent.tokenOut || intent.amount) && (
                  <div className="grid grid-cols-2 gap-4">
                    {intent.tokenIn && (
                      <div>
                        <p className="text-sm text-gray-600 font-semibold mb-1">From</p>
                        <p className="text-foreground">{intent.tokenIn}</p>
                      </div>
                    )}
                    {intent.tokenOut && (
                      <div>
                        <p className="text-sm text-gray-600 font-semibold mb-1">To</p>
                        <p className="text-foreground">{intent.tokenOut}</p>
                      </div>
                    )}
                    {intent.amount && (
                      <div>
                        <p className="text-sm text-gray-600 font-semibold mb-1">Amount</p>
                        <p className="text-foreground">{intent.amount}</p>
                      </div>
                    )}
                  </div>
                )}

                {intent.constraints && intent.constraints.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 font-semibold mb-2">Constraints</p>
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
                    <p className="text-sm text-gray-600 font-semibold mb-1">Created</p>
                    <p className="text-foreground">{new Date(intent.createdAt).toLocaleString()}</p>
                  </div>
                )}

                {intent.expiresAt && (
                  <div>
                    <p className="text-sm text-gray-600 font-semibold mb-1">Expires</p>
                    <p className="text-foreground">{new Date(intent.expiresAt).toLocaleString()}</p>
                  </div>
                )}
              </Card>

              <div className="flex gap-3">
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/intents">All Intents</Link>
                </Button>
                <Button asChild className="flex-1 bg-primary hover:bg-primary/90 text-white">
                  <Link href="/intents/create">New Intent</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
