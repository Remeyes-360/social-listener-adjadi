import { RawMention, AnalyzedMention, Sentiment, ImportanceLevel, Context } from './types';
import { SUBJECT_NAME } from './platforms';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

interface ClaudeAnalysis {
  sentiment: Sentiment;
  confidence: number;
  summary: string;
  context: Context;
  importance: ImportanceLevel;
  language: string;
}

function buildAnalysisPrompt(mention: RawMention): string {
  return `You are an expert social media analyst. Analyze this mention of "${SUBJECT_NAME}" from the web.

URL: ${mention.url}
Title: ${mention.title}
Content: ${mention.content.slice(0, 800)}

Respond ONLY with a valid JSON object (no markdown, no explanation):
{
  "sentiment": "positive" | "neutral" | "negative",
  "confidence": <integer 0-100>,
  "summary": "<one impactful sentence in the detected language summarizing this mention>",
  "context": "political" | "professional" | "media" | "personal" | "other",
    "importance": "critical" | "high" | "medium" | "low",
  "language": "<ISO 639-1 code, e.g. fr, en, es>"
}

Rules:
- sentiment: overall tone toward ${SUBJECT_NAME}
- confidence: how certain you are (0-100)
- summary: punchy 1-sentence synthesis
- context: the main domain/context of this mention
- importance: critical=viral/major news, high=relevant mention, medium=moderate interest, low=minor reference
- language: language of the content`;
}

async function analyzeSingleMention(apiKey: string, mention: RawMention): Promise<ClaudeAnalysis> {
  const defaultAnalysis: ClaudeAnalysis = {
    sentiment: 'neutral',
    confidence: 50,
    summary: 'Analyse non disponible',
    context: 'other',
    importance: 'low',
    language: 'fr',
  };

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: buildAnalysisPrompt(mention) }],
      }),
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status);
      return defaultAnalysis;
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    // Strip potential markdown fences
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean) as ClaudeAnalysis;

    return {
      sentiment: ['positive', 'neutral', 'negative'].includes(parsed.sentiment)
        ? parsed.sentiment
        : 'neutral',
      confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 50)),
      summary: parsed.summary || 'Résumé non disponible',
      context: ['political', 'professional', 'media', 'personal', 'other'].includes(parsed.context)
        ? parsed.context
        : 'other',
      importance: ['critical', 'notable', 'low'].includes(parsed.importance)
        ? parsed.importance
        : 'low',
      language: parsed.language || 'fr',
    };
  } catch (error) {
    console.error('Claude analysis error:', error);
    return defaultAnalysis;
  }
}

export async function analyzeMentions(
  apiKey: string,
  mentions: RawMention[]
): Promise<AnalyzedMention[]> {
  const now = new Date().toISOString();

  // Analyze in batches of 5 to avoid rate limits
  const batchSize = 5;
  const results: AnalyzedMention[] = [];

  for (let i = 0; i < mentions.length; i += batchSize) {
    const batch = mentions.slice(i, i + batchSize);
    const analyzed = await Promise.all(
      batch.map(async (mention) => {
        const analysis = await analyzeSingleMention(apiKey, mention);
        return { ...mention, analysis, analyzedAt: now } as AnalyzedMention;
      })
    );
    results.push(...analyzed);
  }

  return results;
}
