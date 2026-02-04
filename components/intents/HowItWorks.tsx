'use client';

import { THEME_COLOR } from './constants';

/**
 * Short explanation: create → list, and how CRE simulation fits in.
 */
export function HowItWorks() {
  return (
    <div
      className="rounded-lg border border-[#1e40af]/15 bg-[#1e40af]/05 px-3 py-2 text-xs text-muted-foreground"
      style={{ borderColor: `${THEME_COLOR}26` }}
    >
      <p>
        <strong className="text-foreground">Create Intent</strong> → saved here (status: Pending).{' '}
        <strong className="text-foreground">CRE</strong> (cre-intent) polls <code className="bg-white/80 px-1 rounded">/api/intents/active</code>.{' '}
        Run <code className="bg-white/80 px-1 rounded">pnpm dev</code> then <code className="bg-white/80 px-1 rounded">pnpm cre:simulate</code> in another terminal to test. Deploy workflow when you have Early Access.
      </p>
    </div>
  );
}
