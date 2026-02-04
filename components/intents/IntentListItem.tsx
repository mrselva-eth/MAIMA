'use client';

import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Intent, STATUS_CONFIG, THEME_COLOR } from './constants';

export interface IntentListItemProps {
  intent: Intent;
}

export function IntentListItem({ intent }: IntentListItemProps) {
  const status = STATUS_CONFIG[intent.status] ?? STATUS_CONFIG.pending;
  return (
    <Card className="group border-[#1e40af]/12 bg-card/80 rounded-lg hover:border-[#1e40af]/25 transition-colors">
      <Link href={`/intents/${intent.id}`} className="flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-2.5">
        <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
          <span className="text-sm font-semibold text-foreground capitalize truncate shrink-0 max-w-[100px] sm:max-w-[120px]">
            {intent.type}
          </span>
          <span className="hidden sm:inline text-muted-foreground/60 text-xs">·</span>
          <p className="text-xs text-muted-foreground truncate flex-1 min-w-0">
            {intent.description}
          </p>
        </div>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${status.className}`}
        >
          {status.label}
        </span>
        <span
          className="flex items-center gap-0.5 text-xs font-medium shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
          style={{ color: THEME_COLOR }}
        >
          View
          <ArrowRight className="w-3 h-3" />
        </span>
      </Link>
    </Card>
  );
}
