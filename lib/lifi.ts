// lib/lifi.ts

const BASE_URL = process.env.LIFI_BASE_URL ?? "https://li.quest/v1";
const API_KEY = process.env.LIFI_API_KEY;

export type LifiRouteParams = {
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  fromAmount: string; // wei
};

export async function getLifiRoutes(params: LifiRouteParams) {
  const url = new URL(`${BASE_URL}/routes`);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value.toString());
  });

  const res = await fetch(url.toString(), {
    headers: {
      accept: "application/json",
      ...(API_KEY ? { "x-lifi-api-key": API_KEY } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[LI.FI] ${err}`);
  }

  return res.json();
}
