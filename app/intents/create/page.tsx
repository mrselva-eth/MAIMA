'use client';

import { useAccount } from 'wagmi';
import Navbar from '@/components/navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Alert } from '@/components/ui/alert';

export default function CreateIntentPage() {
  const { address, status } = useAccount();
  const isConnectedState = status === 'connected' && Boolean(address);
  const [step, setStep] = useState<'input' | 'review' | 'confirm'>('input');
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parsedIntent, setParsedIntent] = useState<any>(null);

  const handleParseIntent = async () => {
    if (!userInput.trim()) {
      setError('Please describe what you want to do');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/intents/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput,
          walletAddress: address,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to parse intent');
      }

      const data = await res.json();

      if (data.success) {
        setParsedIntent(data.intent);
        setStep('review');
      } else {
        setError(data.error || 'Could not understand your intent');
      }
    } catch (err) {
      console.log('[v0] Error parsing intent:', err);
      setError('Error parsing intent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIntent = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...parsedIntent,
          walletAddress: address,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create intent');
      }

      const data = await res.json();
      setParsedIntent(data.intent);
      setStep('confirm');
    } catch (err) {
      console.log('[v0] Error creating intent:', err);
      setError('Error creating intent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnectedState) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-16 h-screen flex items-center justify-center px-6">
          <div className="max-w-md text-center space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Connect Your Wallet</h1>
            <p className="text-gray-600">Please connect your wallet to create intents.</p>
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground">Create Intent</h1>
            <p className="text-gray-600 mt-2">Tell us what you want to do with your crypto</p>
          </div>

          {error && (
            <Alert className="mb-6 bg-red-50 border-red-200 text-red-800">
              <AlertCircle className="w-4 h-4" />
              {error}
            </Alert>
          )}

          {step === 'input' && (
            <Card className="p-8 border-border/50">
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold text-foreground">Describe Your Intent</Label>
                  <p className="text-sm text-gray-600 mt-1 mb-4">
                    Use natural language to express what you want to do. For example:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 mb-4 ml-4 list-disc">
                    <li>"Swap 100 USDC to ETH at best rate within 1 hour"</li>
                    <li>"Stake 50 SOL monthly if balance is above $1000"</li>
                    <li>"Bridge 500 USDT from Ethereum to Arbitrum"</li>
                  </ul>
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Express your intent here..."
                    className="w-full h-32 p-4 border border-border rounded-lg bg-white text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1 bg-transparent"
                  >
                    <Link href="/intents">Cancel</Link>
                  </Button>
                  <Button
                    onClick={handleParseIntent}
                    disabled={loading || !userInput.trim()}
                    className="flex-1 bg-primary hover:bg-primary/90 text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Next <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {step === 'review' && parsedIntent && (
            <Card className="p-8 border-border/50 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">Review Your Intent</h2>

                {/* Intent Details */}
                <div className="bg-gray-50 p-6 rounded-lg space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Intent Type</p>
                    <p className="text-lg text-foreground capitalize">{parsedIntent.type}</p>
                  </div>

                  {parsedIntent.type === 'swap' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 font-semibold">From</p>
                          <p className="text-lg text-foreground">{parsedIntent.tokenIn}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-semibold">To</p>
                          <p className="text-lg text-foreground">{parsedIntent.tokenOut}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-semibold">Amount</p>
                        <p className="text-lg text-foreground">{parsedIntent.amount} {parsedIntent.tokenIn}</p>
                      </div>
                    </>
                  )}

                  {parsedIntent.constraints && parsedIntent.constraints.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 font-semibold mb-2">Constraints</p>
                      <ul className="text-sm space-y-1">
                        {parsedIntent.constraints.map((constraint: any, idx: number) => (
                          <li key={idx} className="text-foreground">
                            • {constraint.type}: {constraint.value} {constraint.unit || ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Confidence */}
                {parsedIntent.confidence && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 font-semibold mb-2">Parsing Confidence</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${parsedIntent.confidence * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{(parsedIntent.confidence * 100).toFixed(0)}% confident</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    onClick={() => setStep('input')}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleCreateIntent}
                    disabled={loading}
                    className="flex-1 bg-primary hover:bg-primary/90 text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Create Intent <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {step === 'confirm' && parsedIntent && (
            <Card className="p-8 border-border/50 text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-foreground">Intent Created!</h2>
                <p className="text-gray-600">Your intent is now active and being monitored</p>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <p className="text-sm text-gray-600 font-semibold mb-2">Intent ID</p>
                <p className="text-lg font-mono text-foreground break-all">{parsedIntent.id}</p>
              </div>

              <Button
                asChild
                className="w-full bg-primary hover:bg-primary/90 text-white h-12"
              >
                <Link href="/intents" className="flex items-center justify-center gap-2">
                  View All Intents <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
