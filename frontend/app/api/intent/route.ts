/**
 * AI Intent Analysis API
 * POST /api/intent
 * Body: { prompt: string }
 * Returns structured intent parsed by GPT-4o-mini via OpenRouter.
 */

import { NextRequest, NextResponse } from 'next/server';

export type IntentResult = {
    type: 'swap' | 'bridge' | 'unsupported';
    fromToken: string | null;
    toToken: string | null;
    amount: string | null;
    fromChain: string | null;
    toChain: string | null;
    isValid: boolean;
    reason: string;
    errorMessage: string | null;
};

const SYSTEM_PROMPT = `You are an intent parser for a DeFi application called MAIMA.
The app currently supports two operations:
1. SWAP: Swapping between ETH and USDC on Base network only.
2. BRIDGE: Bridging ETH between Base and Arbitrum networks only.

Analyze the user's natural language prompt and extract their intent.
Respond ONLY with a valid JSON object and nothing else. No markdown, no explanation.

JSON schema:
{
  "type": "swap" | "bridge" | "unsupported",
  "fromToken": string | null,   // e.g. "ETH", "USDC"
  "toToken": string | null,     // e.g. "ETH", "USDC"
  "amount": string | null,      // numeric string e.g. "100"
  "fromChain": string | null,   // e.g. "base", "arbitrum"
  "toChain": string | null,     // e.g. "base", "arbitrum"
  "isValid": boolean,           // true only if this app can handle the request
  "reason": string,             // short human-readable summary of detected intent
  "errorMessage": string | null // friendly error if unsupported, else null
}

Rules:
- IMPORTANT: We only support MAINNET operations. If the user mentions any testnet (sepolia, goerli, mumbai, fuji, "testnet", "test network"), set type="unsupported", isValid=false, errorMessage="MAIMA only supports mainnet. Please use Base mainnet for swaps or Base→Arbitrum mainnet for bridges."
- type=swap: involves ETH<->USDC. Set isValid=true if user mentions ETH and USDC. Assume Base mainnet chain.
- type=bridge: involves moving ETH cross-chain. We ONLY support Base<->Arbitrum mainnet, so:
  * If user mentions Arbitrum (even without Base), infer fromChain=base, toChain=arbitrum, isValid=true
  * If user mentions Base and implies cross-chain, infer toChain=arbitrum, isValid=true
  * Phrases like "across to Arbitrum", "move to Arbitrum", "send to Arb", "bridge to Arbitrum" are ALL valid bridge requests
- Only set isValid=false if: testnet is mentioned, OR the request involves completely different chains (Solana, BNB, Polygon, Ethereum mainnet), OR completely different tokens (BTC, LINK, etc.), OR you genuinely cannot detect any DeFi intent
- Be lenient: "exchange"/"convert"/"swap" = swap intent; "transfer"/"move"/"send"/"bridge"/"across" = bridge intent
- Always fill in what you can detect; use null for unknown fields`;

export async function POST(req: NextRequest) {
    let body: { prompt?: string } = {};
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const prompt = (body.prompt ?? '').trim();
    if (!prompt) {
        return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

    if (!apiKey) {
        // Graceful fallback to keyword analysis if no API key
        return NextResponse.json(keywordFallback(prompt));
    }

    try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://maima.app',
                'X-Title': 'MAIMA DeFi Intent Parser',
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: prompt },
                ],
                temperature: 0,
                max_tokens: 300,
            }),
        });

        if (!res.ok) {
            console.error('[intent API] OpenRouter error', res.status);
            return NextResponse.json(keywordFallback(prompt));
        }

        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content ?? '';

        // Strip any accidental markdown code fences
        const cleaned = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        const parsed: IntentResult = JSON.parse(cleaned);

        return NextResponse.json(parsed);
    } catch (err) {
        console.error('[intent API] Failed to parse AI response:', err);
        // Fallback gracefully
        return NextResponse.json(keywordFallback(prompt));
    }
}

/** Keyword-based fallback if OpenRouter is unavailable */
function keywordFallback(prompt: string): IntentResult {
    const p = prompt.toLowerCase();

    // Reject testnets immediately
    if (/sepolia|goerli|mumbai|fuji|testnet|test.network/.test(p)) {
        return {
            type: 'unsupported', fromToken: null, toToken: null, amount: null,
            fromChain: null, toChain: null, isValid: false,
            reason: 'Testnet network detected',
            errorMessage: 'MAIMA only supports mainnet. Please use Base mainnet for swaps or Base→Arbitrum mainnet for bridges.',
        };
    }
    const isSwap = /swap|convert|exchange/.test(p);
    const isBridge = /bridge|cross.chain|transfer|move.*to|send.*to/.test(p);
    const hasEth = p.includes('eth');
    const hasUsdc = p.includes('usdc');
    const hasBase = p.includes('base');
    const hasArb = p.includes('arbitrum') || p.includes('arb');

    if (isSwap && hasEth && hasUsdc) {
        return {
            type: 'swap', fromToken: hasUsdc ? 'USDC' : 'ETH', toToken: hasUsdc ? 'ETH' : 'USDC',
            amount: prompt.match(/\d+(\.\d+)?/)?.[0] ?? null,
            fromChain: 'base', toChain: 'base', isValid: true,
            reason: 'Swap ETH ↔ USDC on Base', errorMessage: null,
        };
    }
    if (isBridge && hasBase && hasArb) {
        return {
            type: 'bridge', fromToken: 'ETH', toToken: 'ETH',
            amount: prompt.match(/\d+(\.\d+)?/)?.[0] ?? null,
            fromChain: 'base', toChain: 'arbitrum', isValid: true,
            reason: 'Bridge ETH from Base to Arbitrum', errorMessage: null,
        };
    }
    return {
        type: 'unsupported', fromToken: null, toToken: null, amount: null,
        fromChain: null, toChain: null, isValid: false,
        reason: 'Could not determine intent',
        errorMessage: "I didn't recognize that request. Try: 'Swap 100 USDC to ETH' or 'Bridge 1 ETH from Base to Arbitrum'.",
    };
}
