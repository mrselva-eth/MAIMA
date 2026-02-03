'use client';

import dynamic from 'next/dynamic';

// Load wallet providers only on client to avoid "indexedDB is not defined" during SSR.
// Must be in a Client Component for next/dynamic with ssr: false (Next.js 16).
const Providers = dynamic(() => import('@/components/providers'), { ssr: false });

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Providers>{children}</Providers>;
}
