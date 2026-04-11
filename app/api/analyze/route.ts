import { NextRequest, NextResponse } from 'next/server';
import { analyzeMentions } from '@/lib/perplexity';
import { RawMention } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'PERPLEXITY_API_KEY not configured', mentions: [], timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const mentions: RawMention[] = body.mentions || [];

    if (mentions.length === 0) {
      return NextResponse.json({ mentions: [], timestamp: new Date().toISOString() });
    }

    const analyzed = await analyzeMentions(apiKey, mentions);

    return NextResponse.json({
      mentions: analyzed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Social listening analyze API error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse Social listening', mentions: [], timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
