'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Play } from 'lucide-react';
import { THEME_COLOR } from './constants';

export interface IntentsPageHeaderProps {
  onRunSimulation?: () => void;
}

export function IntentsPageHeader({ onRunSimulation }: IntentsPageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 shrink-0">
      <div>
        <h1 className="font-[family-name:var(--font-gagalin)] text-2xl sm:text-3xl text-foreground tracking-tight">
          Your Intents
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage automated actions</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onRunSimulation && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg font-semibold border-[#1e40af]/30 text-foreground hover:bg-[#1e40af]/10"
            onClick={onRunSimulation}
          >
            <Play className="w-3.5 h-3.5 mr-1.5" />
            Run simulation
          </Button>
        )}
        <Button
          asChild
          size="sm"
          className="rounded-lg font-semibold shrink-0"
          style={{ backgroundColor: THEME_COLOR }}
        >
          <Link href="/intents/create" className="flex items-center gap-1.5 text-white text-sm py-2">
            <Plus className="w-4 h-4" />
            New Intent
          </Link>
        </Button>
      </div>
    </div>
  );
}
