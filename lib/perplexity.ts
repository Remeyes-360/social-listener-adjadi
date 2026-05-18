import { RawMention, AnalyzedMention, Sentiment, Context, ImportanceLevel } from './types';
import { SUBJECT_NAME } from './platforms';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

function defaultAnalysis(mention: RawMention): AnalyzedMention {
  return {
    ...mention,
    analysis: {
      sentiment: 'neutral' as Sentiment,
      confidence: 50,
      summary: mention.content?.slice(0, 100) + (mention.content?.length > 100 ? '...' : ''),
      context: 'other' as Context,
      importance: 'low' as ImportanceLevel,
      language: 'fr',
    },
    analyzedAt: new Date().toISOString(),
  };
}

async function analyzeSingleMention(
  apiKey: string,
  mention: RawMention
): Promise<AnalyzedMention> {
  try {
    if (!apiKey || apiKey.length < 20) {
      return defaultAnalysis(mention);
    }

    const prompt = `You are an expert social media analyst for "${SUBJECT_NAME}". Analyze this mention and return ONLY a valid JSON object with no markdown, no code block, no explanation.

Mention URL: ${mention.url}
Title: ${mention.title}
Content: ${mention.content?.slice(0, 400)}
Platform: ${mention.platform}
Author: ${mention.author || 'unknown'}

Return JSON with exactly these fields:
- sentiment: "positive", "negative", or "neutral"
- confidence: integer 0-100
- summary: one impactful sentence summarizing this mention
- context: "political", "professional", "media", "personal", or "other"
- importance: "critical" (viral/major news), "high" (relevant), "medium" (moderate), or "low" (minor)
- language: ISO 639-1 code (e.g. "fr", "en")`;

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert in social listening and sentiment analysis for public figures and political leaders. Respond ONLY in valid JSON, no markdown, no explanation.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.error(`Perplexity analysis error: ${response.status}`);
      return defaultAnalysis(mention);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return defaultAnalysis(mention);

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      ...mention,
      analysis: {
        sentiment: (['positive', 'negative', 'neutral'].includes(parsed.sentiment)
          ? parsed.sentiment
          : 'neutral') as Sentiment,
        confidence: Number(parsed.confidence) || 50,
        summary: parsed.summary || mention.content?.slice(0, 100) || '',
        context: (['political', 'professional', 'media', 'personal', 'other'].includes(parsed.context)
          ? parsed.context
          : 'other') as Context,
        importance: (['critical', 'high', 'medium', 'low'].includes(parsed.importance)
          ? parsed.importance
          : 'low') as ImportanceLevel,
        language: parsed.language || 'fr',
      },
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error analyzing mention:', error);
    return defaultAnalysis(mention);
  }
}

export async function analyzeMentions(
  apiKey: string,
  mentions: RawMention[]
): Promise<AnalyzedMention[]> {
  const results: AnalyzedMention[] = [];
  // Process in batches of 5 (faster with sonar model)
  const batchSize = 5;
  for (let i = 0; i < mentions.length; i += batchSize) {
    const batch = mentions.slice(i, i + batchSize);
    const analyzed = await Promise.all(batch.map((m) => analyzeSingleMention(apiKey, m)));
    results.push(...analyzed);
    // Small delay between batches to avoid rate limits
    if (i + batchSize < mentions.length) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  return results;
}
