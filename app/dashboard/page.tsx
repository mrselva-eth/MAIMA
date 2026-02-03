'use client';

import { useAccount } from 'wagmi';
import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import {
  ArrowRight,
  Wallet,
  Inbox,
  FileText,
  ListTodo,
  Zap,
} from 'lucide-react';
import { FlickeringGrid } from '@/components/flickering-grid';

const THEME_COLOR = '#1e40af';

export default function DashboardPage() {
  const { isConnected } = useAccount();

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
                Connect your wallet to access the dashboard and start creating intents.
              </p>
              <p className="text-sm text-muted-foreground/90">
                Your wallet is required to sign intents and approve transactions.
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

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 sm:py-16">
          {/* Page header */}
          <div className="mb-12">
            <h1 className="font-[family-name:var(--font-gagalin)] text-4xl sm:text-5xl text-foreground tracking-tight">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2 text-base sm:text-lg">
              Manage your intents and monitor execution in real-time
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 sm:p-8 border-[#1e40af]/15 bg-card/80 rounded-2xl hover:border-[#1e40af]/30 hover:shadow-lg transition-all duration-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <Zap className="h-6 w-6" style={{ color: THEME_COLOR }} />
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-2">Create Intent</h3>
              <p className="text-sm text-muted-foreground mb-6">Define a new automated action</p>
              <Button
                asChild
                size="lg"
                className="w-full rounded-xl font-semibold shadow-md hover:opacity-90 transition-opacity"
                style={{ backgroundColor: THEME_COLOR }}
              >
                <Link href="/intents/create" className="flex items-center justify-center gap-2 text-white">
                  New Intent
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </Card>

            <Card className="p-6 sm:p-8 border-[#1e40af]/15 bg-card/80 rounded-2xl hover:border-[#1e40af]/30 hover:shadow-lg transition-all duration-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <ListTodo className="h-6 w-6" style={{ color: THEME_COLOR }} />
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-2">View Intents</h3>
              <p className="text-sm text-muted-foreground mb-6">Monitor all your active intents</p>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full rounded-xl border-[#1e40af]/30 text-primary hover:bg-primary/5 font-medium"
              >
                <Link href="/intents" className="flex items-center justify-center gap-2">
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </Card>

            <Card className="p-6 sm:p-8 border-[#1e40af]/15 bg-card/80 rounded-2xl hover:border-[#1e40af]/30 hover:shadow-lg transition-all duration-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <FileText className="h-6 w-6" style={{ color: THEME_COLOR }} />
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-2">Documentation</h3>
              <p className="text-sm text-muted-foreground mb-6">Learn how to use the app</p>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full rounded-xl border-[#1e40af]/30 text-primary hover:bg-primary/5 font-medium"
              >
                <Link href="/docs" className="flex items-center justify-center gap-2">
                  Read Docs
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </Card>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12">
            <Card className="p-6 border-[#1e40af]/15 bg-card/80 rounded-2xl">
              <p className="text-sm text-muted-foreground mb-1">Active Intents</p>
              <p className="text-3xl sm:text-4xl font-bold" style={{ color: THEME_COLOR }}>
                0
              </p>
            </Card>
            <Card className="p-6 border-[#1e40af]/15 bg-card/80 rounded-2xl">
              <p className="text-sm text-muted-foreground mb-1">Executed</p>
              <p className="text-3xl sm:text-4xl font-bold" style={{ color: THEME_COLOR }}>
                0
              </p>
            </Card>
            <Card className="p-6 border-[#1e40af]/15 bg-card/80 rounded-2xl">
              <p className="text-sm text-muted-foreground mb-1">Pending Approval</p>
              <p className="text-3xl sm:text-4xl font-bold text-amber-600">0</p>
            </Card>
            <Card className="p-6 border-[#1e40af]/15 bg-card/80 rounded-2xl">
              <p className="text-sm text-muted-foreground mb-1">Total Value</p>
              <p className="text-3xl sm:text-4xl font-bold" style={{ color: THEME_COLOR }}>
                $0.00
              </p>
            </Card>
          </div>

          {/* Empty State */}
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
              Create your first intent to get started
            </p>
            <Button
              asChild
              size="lg"
              className="rounded-xl font-semibold shadow-md hover:opacity-90 transition-opacity"
              style={{ backgroundColor: THEME_COLOR }}
            >
              <Link href="/intents/create" className="flex items-center gap-2 text-white justify-center">
                Create Your First Intent
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
