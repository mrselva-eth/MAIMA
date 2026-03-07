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
The app supports swapping and bridging across multiple EVM networks (Ethereum, Polygon, Arbitrum, Optimism, Base, BSC, Avalanche).

Analyze the user's natural language prompt and extract their intent.
Respond ONLY with a valid JSON object and nothing else. No markdown, no explanation.

JSON schema:
{
  "type": "swap" | "bridge" | "unsupported",
  "fromToken": string | null,   // e.g. "ETH", "USDC", "USDT", "DAI", "LINK", "WBTC"
  "toToken": string | null,     // e.g. "ETH", "USDC", "USDT", "DAI", "LINK", "WBTC"
  "amount": string | null,      // numeric string e.g. "100"
  "fromChain": string | null,   // e.g. "ethereum", "polygon", "arbitrum", "optimism", "base", "bsc", "avalanche"
  "toChain": string | null,     // e.g. "ethereum", "polygon", "arbitrum", "optimism", "base", "bsc", "avalanche"
  "isValid": boolean,           // true if this app can likely handle the request
  "reason": string,             // short human-readable summary of detected intent
  "errorMessage": string | null // friendly error if unsupported, else null
}

Rules:
- We support MAINNET operations on Ethereum, Polygon, Arbitrum, Optimism, Base, BSC, and Avalanche.
- If the user mentions any testnet (sepolia, goerli, mumbai, fuji, "testnet", "test network"), set type="unsupported", isValid=false, errorMessage="MAIMA only supports mainnet networks."
- type=swap: involves tokens on the SAME chain. Assume Base if no chain is specified but it looks like a swap.
- type=bridge: involves moving tokens cross-chain. 
- Only set isValid=false if: testnet is mentioned, OR the request involves completely unknown chains (Solana, Bitcoin), OR you genuinely cannot detect any DeFi intent.
- Be lenient: "exchange"/"convert"/"swap" = swap intent; "transfer"/"move"/"send"/"bridge"/"across" = bridge intent.
- Always fill in what you can detect; use null for unknown fields.`;

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
            errorMessage: 'MAIMA only supports mainnet networks.',
        };
    }
    const isSwap = /swap|convert|exchange/.test(p);
    const isBridge = /bridge|cross.chain|transfer|move.*to|send.*to/.test(p);
    const amount = prompt.match(/\d+(\.\d+)?/)?.[0] ?? null;

    if (isBridge) {
        return {
            type: 'bridge', fromToken: 'ETH', toToken: 'ETH',
            amount, fromChain: 'ethereum', toChain: 'polygon', isValid: true,
            reason: 'Bridge detection (fallback)', errorMessage: null,
        };
    }
    if (isSwap) {
        return {
            type: 'swap', fromToken: 'ETH', toToken: 'USDC',
            amount, fromChain: 'base', toChain: 'base', isValid: true,
            reason: 'Swap detection (fallback)', errorMessage: null,
        };
    }
    return {
        type: 'unsupported', fromToken: null, toToken: null, amount: null,
        fromChain: null, toChain: null, isValid: false,
        reason: 'Could not determine intent',
        errorMessage: "I didn't recognize that request. Try: 'Swap 10 USDC to ETH on Polygon' or 'Bridge 1 ETH from Ethereum to Base'.",
    };
}
