const DEFAULT_BG = '#1e40af';

function svgDataUri(letter: string, bg: string, fg = '#ffffff') {
  const safeLetter = letter.trim().slice(0, 2).toUpperCase() || '?';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${bg}"/><text x="32" y="40" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="${fg}">${safeLetter}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function normalizeProtocolName(name?: string) {
  return (name ?? '').trim().toLowerCase();
}

const PROTOCOL_LOGO_FALLBACKS: Record<string, string> = {
  stargate: '/logos/stargate.png',
  across: '/logos/across.png',
  hop: '/logos/hop.png',
  synapse: '/logos/synapse.png',
  'celer cbridge': '/logos/celer.png',
  cbridge: '/logos/celer.png',
  'uniswap v3': '/logos/uniswap.png',
  uniswap: '/logos/uniswap.png',
  '1inch': '/logos/1inch.png',
  curve: '/logos/curve.png',
  kyberswap: '/logos/kyberswap.png',
  paraswap: '/logos/paraswap.png',
  sushiswap: '/logos/sushiswap.png',
};

const PROTOCOL_LOGO_FALLBACKS_SVG: Record<string, string> = {
  stargate: svgDataUri('S', '#0ea5e9'),
  across: svgDataUri('A', '#f97316'),
  hop: svgDataUri('H', '#22c55e'),
  synapse: svgDataUri('S', '#a855f7'),
  'celer cbridge': svgDataUri('C', '#6366f1'),
  cbridge: svgDataUri('C', '#6366f1'),
  'uniswap v3': svgDataUri('U', '#ff007a'),
  uniswap: svgDataUri('U', '#ff007a'),
  '1inch': svgDataUri('1', '#4f46e5'),
  curve: svgDataUri('C', '#0ea5e9'),
  kyberswap: svgDataUri('K', '#14b8a6'),
  paraswap: svgDataUri('P', '#8b5cf6'),
  sushiswap: svgDataUri('S', '#ec4899'),
};

export function getProtocolLogoSrc(name?: string, dynamicLogo?: string) {
  if (dynamicLogo) return dynamicLogo;
  const normalized = normalizeProtocolName(name);
  if (normalized && PROTOCOL_LOGO_FALLBACKS[normalized]) return PROTOCOL_LOGO_FALLBACKS[normalized];
  if (normalized && PROTOCOL_LOGO_FALLBACKS_SVG[normalized]) return PROTOCOL_LOGO_FALLBACKS_SVG[normalized];
  const initial = name?.trim().charAt(0).toUpperCase() || '?';
  return svgDataUri(initial, DEFAULT_BG);
}
