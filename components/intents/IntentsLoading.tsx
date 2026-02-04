'use client';

import { Loader2 } from 'lucide-react';
import { THEME_COLOR } from './constants';

export function IntentsLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: THEME_COLOR }} />
      <p className="text-muted-foreground text-sm font-medium">Loading intents...</p>
    </div>
  );
}
