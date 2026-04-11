import { RawMention, AnalyzedMention, Sentiment, Context, ImpressionLevel as ImportanceLevel } from './types';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

export async function analyzeSingleMention(
  apiKey: string,
  mention: RawMention
): Promise<Omit<AnalyzedMention, keyof RawMention>> {
  const defaultAnalysis = {
    sentiment: 'neutral' as Sentiment,
    confidence: 50,
    summary: 'Analyse non disponible',
    context: 'other' as Context,
    importance: 'low' as ImportanceLevel,
    language: 'fr',
  };

  try {
    const prompt = `Analyse cette mention sur les r\u00e9seaux sociaux et retourne un JSON avec les champs suivants:
- sentiment: "positive", "negative" ou "neutral"
- confidence: nombre entre 0 et 100
- summary: r\u00e9sum\u00e9 en 1 phrase
- context: "customer_service", "product_feedback", "brand_mention", "crisis" ou "other"
- importance: "high", "medium" ou "low"
- language: code ISO 2 lettres (ex: "fr", "en")

Mention: "${mention.content}"
Plateforme: ${mention.platform}
Auteur: ${mention.author}`;

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'Tu es R\u00eami, un assistant expert en analyse de sentiment et social listening. R\u00e9ponds uniquement en JSON valide sans markdown.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return {
      sentiment: parsed.sentiment || 'neutral',
      confidence: parsed.confidence || 50,
      summary: parsed.summary || 'Analyse non disponible',
      context: parsed.context || 'other',
      importance: parsed.importance || 'low',
      language: parsed.language || 'fr',
    };
  } catch (error) {
    console.error('R\u00eami analysis error:', error);
    return defaultAnalysis;
  }
}

export async function analyzeMentions(
  apiKey: string,
  mentions: RawMention[]
): Promise<AnalyzedMention[]> {
  const results = await Promise.allSettled(
    mentions.map((mention) => analyzeSingleMention(apiKey, mention))
  );

  return mentions.map((mention, index) => {
    const result = results[index];
    const analysis =
      result.status === 'fulfilled'
        ? result.value
        : {
            sentiment: 'neutral' as Sentiment,
            confidence: 50,
            summary: 'Analyse non disponible',
            context: 'other' as Context,
            importance: 'low' as ImportanceLevel,
            language: 'fr',
          };

    return {
      ...mention,
      ...analysis,
    };
  });
}
