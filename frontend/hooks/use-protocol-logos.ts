'use client';

import { useState, useEffect } from 'react';
import { fetchLifiTools, getProtocolLogoUrl } from '@/lib/lifi-tools';

export function useProtocolLogos(): {
  getLogoUrl: (protocolName: string | undefined) => string | null;
  isLoading: boolean;
} {
  const [map, setMap] = useState<Map<string, string> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchLifiTools()
      .then((m) => {
        if (!cancelled) setMap(m);
      })
      .catch(() => {
        if (!cancelled) setMap(new Map());
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    getLogoUrl: (protocolName: string | undefined) => getProtocolLogoUrl(protocolName, map),
    isLoading,
  };
}
