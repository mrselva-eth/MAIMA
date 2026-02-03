'use client';

import { useAccount } from 'wagmi';
import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-16 h-screen flex items-center justify-center px-6">
          <div className="max-w-md text-center space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Connect Your Wallet</h1>
            <p className="text-gray-600">
              Please connect your wallet to access the dashboard and start creating intents.
            </p>
            <p className="text-sm text-gray-500">
              Your wallet is required to sign intents and approve transactions.
            </p>
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
          <div className="space-y-8 mb-12">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage your intents and monitor execution in real-time</p>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 border-border/50">
                <h3 className="font-semibold text-foreground mb-2">Create Intent</h3>
                <p className="text-sm text-gray-600 mb-4">Define a new automated action</p>
                <Button
                  asChild
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                >
                  <Link href="/intents/create" className="flex items-center justify-center gap-2">
                    New Intent <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </Card>

              <Card className="p-6 border-border/50">
                <h3 className="font-semibold text-foreground mb-2">View Intents</h3>
                <p className="text-sm text-gray-600 mb-4">Monitor all your active intents</p>
                <Button
                  asChild
                  variant="outline"
                  className="w-full bg-transparent"
                >
                  <Link href="/intents" className="flex items-center justify-center gap-2">
                    View All <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </Card>

              <Card className="p-6 border-border/50">
                <h3 className="font-semibold text-foreground mb-2">Documentation</h3>
                <p className="text-sm text-gray-600 mb-4">Learn how to use the app</p>
                <Button
                  asChild
                  variant="outline"
                  className="w-full bg-transparent"
                >
                  <Link href="#" className="flex items-center justify-center gap-2">
                    Read Docs <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </Card>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <Card className="p-6 border-border/50">
              <p className="text-sm text-gray-600 mb-2">Active Intents</p>
              <p className="text-4xl font-bold text-primary">0</p>
            </Card>
            <Card className="p-6 border-border/50">
              <p className="text-sm text-gray-600 mb-2">Executed</p>
              <p className="text-4xl font-bold text-primary">0</p>
            </Card>
            <Card className="p-6 border-border/50">
              <p className="text-sm text-gray-600 mb-2">Pending Approval</p>
              <p className="text-4xl font-bold text-accent">0</p>
            </Card>
            <Card className="p-6 border-border/50">
              <p className="text-sm text-gray-600 mb-2">Total Value</p>
              <p className="text-4xl font-bold text-primary">$0.00</p>
            </Card>
          </div>

          {/* Empty State */}
          <Card className="p-12 text-center border-border/50">
            <h2 className="text-2xl font-bold text-foreground mb-2">No Intents Yet</h2>
            <p className="text-gray-600 mb-6">Create your first intent to get started</p>
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Link href="/intents/create">Create Your First Intent</Link>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
