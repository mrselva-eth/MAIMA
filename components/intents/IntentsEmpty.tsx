'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Inbox } from 'lucide-react';
import { THEME_COLOR } from './constants';

export function IntentsEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 mb-4">
        <Inbox className="h-7 w-7" style={{ color: THEME_COLOR }} />
      </span>
      <h2 className="font-[family-name:var(--font-gagalin)] text-xl text-foreground mb-1">
        No intents yet
      </h2>
      <p className="text-muted-foreground text-sm mb-5 max-w-xs">
        Create your first intent to automate actions.
      </p>
      <Button
        asChild
        size="sm"
        className="rounded-lg font-semibold"
        style={{ backgroundColor: THEME_COLOR }}
      >
        <Link href="/intents/create" className="flex items-center gap-1.5 text-white text-sm">
          Create intent
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  );
}
