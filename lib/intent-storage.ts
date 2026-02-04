/**
 * Shared in-memory intent storage.
 * Used by GET/POST /api/intents and GET/PATCH/DELETE /api/intents/[id].
 * Replace with a database (e.g. Supabase/PostgreSQL) in production.
 */

import type { Intent } from './types';

export type StoredIntent = Intent & {
  walletAddress?: string;
  executedAt?: string;
  executionResult?: { type: string; message: string; txData?: unknown; quote?: unknown };
};

export const intentStorage = new Map<string, StoredIntent>();
