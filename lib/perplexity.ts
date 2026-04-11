import { RawMention, AnalyzedMention, Sentiment, Context, ImportanceLevel } from './types';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

function defaultAnalysis(mention: RawMention): AnalyzedMention {
  return {
    ...mention,
    analysis: {
      sentiment: 'neutral' as Sentiment,
      confidence: 50,
      summary: mention.content.slice(0, 100) + (mention.content.length > 100 ? '...' : ''),
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
    if (!apiKey || apiKey.includes('VOTRE_CLE') || apiKey.length < 20) {
      return defaultAnalysis(mention);
    }

    const prompt = `Analyse cette mention sur les r\u00e9seaux sociaux et retourne UNIQUEMENT un objet JSON valide (sans markdown, sans code block) avec les champs suivants:\n- sentiment: "positive", "negative" ou "neutral"\n- confidence: nombre entier entre 0 et 100\n- summary: r\u00e9sum\u00e9 en 1 phrase courte\n- context: "customer_service", "product_feedback", "brand_mention", "crisis", "professional" ou "other"\n- importance: "critical", "high", "medium" ou "low"\n- language: code ISO 2 lettres ("fr" ou "en")\n\nMention: "${mention.content.slice(0, 300)}"\nPlateforme: ${mention.platform}\nAuteur: ${mention.author || 'inconnu'}`;

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content:
              'Tu es R\u00eami, expert en analyse de sentiment. R\u00e9ponds uniquement en JSON valide sans aucun markdown ni explication.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      console.error('Perplexity API error:', response.status, await response.text());
      return defaultAnalysis(mention);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '{}';
    // Clean possible markdown
    const cleaned = raw.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      ...mention,
      analysis: {
        sentiment: (parsed.sentiment as Sentiment) || 'neutral',
        confidence: Number(parsed.confidence) || 50,
        summary: parsed.summary || mention.content.slice(0, 100),
        context: (parsed.context as Context) || 'other',
        importance: (parsed.importance as ImportanceLevel) || 'low',
        language: parsed.language || 'fr',
      },
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('R\u00eami analysis error:', error);
    return defaultAnalysis(mention);
  }
}

export async function analyzeMentions(
  apiKey: string,
  mentions: RawMention[]
): Promise<AnalyzedMention[]> {
  // Pour ne pas surcharger l'API, on limite a 5 appels en parallele
  const results: AnalyzedMention[] = [];
  const chunkSize = 5;
  for (let i = 0; i < mentions.length; i += chunkSize) {
    const chunk = mentions.slice(i, i + chunkSize);
    const analyzed = await Promise.all(chunk.map((m) => analyzeSingleMention(apiKey, m)));
    results.push(...analyzed);
  }
  return results;
}
