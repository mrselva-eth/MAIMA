/**
 * LI.FI tools (bridges & exchanges) for protocol logos.
 * GET https://li.quest/v1/tools returns logoURI per tool.
 * Used in Process Tracking panel and chat to show protocol icons.
 */

const TOOLS_URL = 'https://li.quest/v1/tools';

type ToolEntry = { key?: string; name?: string; logoURI?: string };

let cachedMap: Map<string, string> | null = null;
let fetchPromise: Promise<Map<string, string>> | null = null;

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function buildMap(data: { exchanges?: ToolEntry[]; bridges?: ToolEntry[] }): Map<string, string> {
  const map = new Map<string, string>();
  const add = (t: ToolEntry) => {
    const uri = t?.logoURI?.trim();
    if (!uri) return;
    if (t.key) map.set(normalize(t.key), uri);
    if (t.name) map.set(normalize(t.name), uri);
  };
  (data.exchanges ?? []).forEach(add);
  (data.bridges ?? []).forEach(add);
  return map;
}

export async function fetchLifiTools(): Promise<Map<string, string>> {
  if (cachedMap) return cachedMap;
  if (fetchPromise) return fetchPromise;
  fetchPromise = (async () => {
    const res = await fetch(TOOLS_URL);
    if (!res.ok) return new Map<string, string>();
    const data = (await res.json()) as { exchanges?: ToolEntry[]; bridges?: ToolEntry[] };
    cachedMap = buildMap(data);
    return cachedMap;
  })();
  return fetchPromise;
}

/** Get logo URL for a protocol (mainTool / name from LI.FI). Returns null if unknown. */
export function getProtocolLogoUrl(protocolName: string | undefined, map: Map<string, string> | null): string | null {
  if (!protocolName || !map) return null;
  return map.get(normalize(protocolName)) ?? null;
}
