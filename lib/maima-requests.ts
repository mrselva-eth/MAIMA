/**
 * In-memory store for MAIMA chat requests (swap/bridge).
 * CRE workflows poll GET /api/maima/requests. Replace with DB in production.
 */

export type MaimaRequest = {
  id: string;
  prompt: string;
  type: 'swap' | 'bridge' | 'both';
  createdAt: string;
  report?: unknown;
};

export const maimaRequests = new Map<string, MaimaRequest>();
