'use client';

import { useAccount } from 'wagmi';
import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Intent {
  id: string;
  type: string;
  description: string;
  status: 'active' | 'pending' | 'executed' | 'expired';
  createdAt: string;
}

export default function IntentsPage() {
  const { isConnected, address } = useAccount();
  const [intents, setIntents] = useState<Intent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      // Fetch user's intents from API
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
        <div className="pt-16 h-screen flex items-center justify-center px-6">
          <div className="max-w-md text-center space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Connect Your Wallet</h1>
            <p className="text-gray-600">Please connect your wallet to view and manage intents.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Your Intents</h1>
              <p className="text-gray-600 mt-2">Manage all your automated actions</p>
            </div>
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Link href="/intents/create" className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                New Intent
              </Link>
            </Button>
          </div>

          {/* Intents List */}
          <div className="space-y-4">
            {loading ? (
              <Card className="p-12 text-center border-border/50">
                <p className="text-gray-600">Loading intents...</p>
              </Card>
            ) : intents.length === 0 ? (
              <Card className="p-12 text-center border-border/50">
                <h2 className="text-2xl font-bold text-foreground mb-2">No Intents Yet</h2>
                <p className="text-gray-600 mb-6">Create your first intent to automate your crypto actions</p>
                <Button
                  asChild
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  <Link href="/intents/create" className="flex items-center gap-2 justify-center">
                    Create Intent <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </Card>
            ) : (
              intents.map((intent) => (
                <Card
                  key={intent.id}
                  className="p-6 border-border/50 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{intent.type}</h3>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          intent.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : intent.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : intent.status === 'executed'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {intent.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{intent.description}</p>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(intent.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                    >
                      <Link href={`/intents/${intent.id}`}>View</Link>
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
