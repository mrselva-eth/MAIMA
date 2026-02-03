import { NextRequest, NextResponse } from 'next/server';
import { AIIntentParseRequest, AIIntentParseResponse, Intent } from '@/lib/types';

/** OpenRouter API (optional). If set, used for intent parsing instead of OpenAI. */
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Parse user intent using AI (OpenRouter or OpenAI).
 * AI is used ONLY for: intent parsing, constraint normalization, user intent → structured intent.
 * AI does NOT execute transactions or hold keys.
 */
export async function POST(request: NextRequest): Promise<NextResponse<AIIntentParseResponse>> {
  try {
    const body = (await request.json()) as AIIntentParseRequest;
    const { userInput, walletAddress } = body;

    if (!userInput || !walletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: userInput, walletAddress',
        },
        { status: 400 }
      );
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const useOpenRouter = Boolean(openRouterKey);

    if (!openRouterKey && !openaiKey) {
      console.log('[intent-parse] No OPENROUTER_API_KEY or OPENAI_API_KEY configured');
      return NextResponse.json(
        {
          success: false,
          error: 'AI service not configured. Set OPENROUTER_API_KEY or OPENAI_API_KEY in .env',
        },
        { status: 500 }
      );
    }

    const prompt = `You are an expert blockchain analyst. Parse the following user intent and convert it into a structured intent object.

User Intent: "${userInput}"

Return a JSON object with the following structure:
{
  "type": "swap" | "stake" | "bridge" | "yield" | "rebalance" | "custom",
  "description": "Clear description of what the user wants",
  "tokenIn": "token symbol or address (if applicable)",
  "tokenOut": "target token symbol or address (if applicable)",
  "amount": "numerical amount as string",
  "constraints": [
    {
      "type": "minAmount" | "maxAmount" | "priceLimit" | "timeWindow" | "slippage",
      "value": "constraint value",
      "unit": "optional unit"
    }
  ],
  "fallback": "what to do if conditions are not met"
}

Only include relevant fields based on intent type. Return valid JSON only.`;

    const model = useOpenRouter
      ? (process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini')
      : 'gpt-4o-mini';
    const apiUrl = useOpenRouter ? OPENROUTER_BASE : 'https://api.openai.com/v1/chat/completions';
    const apiKey = useOpenRouter ? openRouterKey : openaiKey;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a blockchain intent parser. Always return valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.log('[intent-parse] AI API error:', response.status, errText?.slice(0, 200));
      throw new Error('AI parsing failed');
    }

    const aiResponse = await response.json() as any;
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }

    const parsedIntent = JSON.parse(jsonMatch[0]) as Intent;

    return NextResponse.json({
      success: true,
      intent: {
        ...parsedIntent,
        id: `intent_${Date.now()}`,
        status: 'created',
        createdAt: new Date().toISOString(),
      },
      confidence: 0.85, // Confidence score
    });
  } catch (error) {
    console.log('[intent-parse] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse intent',
      },
      { status: 500 }
    );
  }
}
