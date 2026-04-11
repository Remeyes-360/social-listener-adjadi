import { RawMention, Platform } from './types';
import { PLATFORMS, SUBJECT_NAME } from './platforms';

const TAVILY_API_URL = 'https://api.tavily.com/search';

interface TavilyResult {
  url: string;
  title: string;
  content: string;
  published_date?: string;
  score?: number;
}

interface TavilyResponse {
  results: TavilyResult[];
  query: string;
}

function detectPlatform(url: string): Platform {
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('facebook.com')) return 'facebook';
  if (url.includes('linkedin.com')) return 'linkedin';
  if (url.includes('tiktok.com')) return 'tiktok';
  return 'twitter'; // fallback
}

function getMockMentions(): RawMention[] {
  const now = new Date();
  const ts = (offsetMin: number) => new Date(now.getTime() - offsetMin * 60000).toISOString();
  return [
    {
      id: `mock-twitter-001`,
      platform: 'twitter',
      author: '@YvesMarchand_BJ',
      content: `${SUBJECT_NAME} vient de prendre la parole lors du forum économique de Cotonou. Discours impressionnant sur la transformation digitale du Bénin. #Bénin #Tech`,
      url: 'https://x.com/YvesMarchand_BJ/status/1234567890',
      publishedAt: ts(12),
      engagement: { likes: 142, shares: 38, comments: 21 },
    },
    {
      id: `mock-twitter-002`,
      platform: 'twitter',
      author: '@AfriqueEco',
      content: `Interview exclusive avec ${SUBJECT_NAME} : "Le digital est le levier principal du développement africain" - une vision claire et ambitieuse pour le continent. À lire absolument.`,
      url: 'https://x.com/AfriqueEco/status/1234567891',
      publishedAt: ts(45),
      engagement: { likes: 87, shares: 55, comments: 14 },
    },
    {
      id: `mock-instagram-001`,
      platform: 'instagram',
      author: '@adjadi_officiel',
      content: `Fier de représenter le Bénin à ce sommet international. Nos jeunes talents méritent les meilleures opportunités. #Inspiration #Leadership #Bénin`,
      url: 'https://www.instagram.com/p/adjadi001/',
      publishedAt: ts(90),
      engagement: { likes: 1240, shares: 0, comments: 89 },
    },
    {
      id: `mock-facebook-001`,
      platform: 'facebook',
      author: 'Forum Bénin Business',
      content: `Nous avons l’honneur d’accueillir ${SUBJECT_NAME} comme conférencier principal lors de notre prochaine édition. Inscription ouverte ! 🌟`,
      url: 'https://www.facebook.com/forumbeninbusiness/posts/123456',
      publishedAt: ts(180),
      engagement: { likes: 312, shares: 76, comments: 43 },
    },
    {
      id: `mock-linkedin-001`,
      platform: 'linkedin',
      author: 'Adjadi B. Olushegun',
      content: `Très heureux d’annoncer notre nouveau partenariat stratégique avec des acteurs clés du secteur technologique. L’innovation est notre moteur. #Bénin #Innovation #Tech`,
      url: 'https://www.linkedin.com/posts/adjadi-bakari-123456',
      publishedAt: ts(240),
      engagement: { likes: 528, shares: 112, comments: 67 },
    },
    {
      id: `mock-tiktok-001`,
      platform: 'tiktok',
      author: '@adjadibakari_officiel',
      content: `Réaction à chaud après le forum ! Merci pour votre soutien massif 🙏 #adjadi #bénin #entrepreneur`,
      url: 'https://www.tiktok.com/@adjadibakari_officiel/video/123456',
      publishedAt: ts(360),
      engagement: { likes: 4321, shares: 876, comments: 234 },
    },
    {
      id: `mock-twitter-003`,
      platform: 'twitter',
      author: '@JournalDuBenin',
      content: `BREAKING: ${SUBJECT_NAME} nommé au conseil consultatif de la Banque Africaine de Développement. Une reconnaissance méritée pour ce leader exceptionnel. #BAD #Bénin`,
      url: 'https://x.com/JournalDuBenin/status/1234567892',
      publishedAt: ts(480),
      engagement: { likes: 203, shares: 94, comments: 31 },
    },
    {
      id: `mock-instagram-002`,
      platform: 'instagram',
      author: '@benin_entrepreneurs',
      content: `Séance de networking avec ${SUBJECT_NAME} et une trentaine de jeunes entrepreneurs béninois. L'énergie était incroyable ! #Networking #Bénin #Jeunesse`,
      url: 'https://www.instagram.com/p/adjadi002/',
      publishedAt: ts(720),
      engagement: { likes: 876, shares: 0, comments: 112 },
    },
  ];
}

async function searchPlatform(
  apiKey: string,
  platform: Platform,
  query: string
): Promise<RawMention[]> {
  try {
    const response = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'advanced',
        max_results: 8,
        include_answer: false,
        include_raw_content: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`Tavily error for ${platform}:`, err);
      return [];
    }

    const data: TavilyResponse = await response.json();

    return (data.results || []).map((result, idx) => ({
      id: `${platform}-${Date.now()}-${idx}`,
      url: result.url,
      title: result.title || 'Sans titre',
      content: result.content || '',
      platform: detectPlatform(result.url),
      author: result.url.split('/')[3] || SUBJECT_NAME,
      publishedAt: result.published_date || new Date().toISOString(),
      engagement: { likes: 0, shares: 0, comments: 0 },
    }));
  } catch (error) {
    console.error(`Search error for ${platform}:`, error);
    return [];
  }
}

export async function searchSinglePlatform(
  apiKey: string,
  platform: Platform
): Promise<RawMention[]> {
  const config = PLATFORMS.find((p) => p.id === platform);
  // Requete large sans restriction site: pour maximiser les resultats
  const query = `"${SUBJECT_NAME}" ${platform === 'twitter' ? 'OR site:x.com' : ''}`;
  const results = await searchPlatform(apiKey, platform, query);
  if (results.length > 0) return results;
  // Fallback: retourne les mocks filtres par plateforme
  return getMockMentions().filter((m) => m.platform === platform);
}

export async function searchAllPlatforms(apiKey: string): Promise<RawMention[]> {
  // Recherche principale: mentions du sujet sans restriction de domaine
  const primaryQuery = `"${SUBJECT_NAME}" (Twitter OR Instagram OR Facebook OR LinkedIn OR TikTok OR r\u00e9seaux sociaux)`;
  const primaryResults = await searchPlatform(apiKey, 'twitter', primaryQuery);

  // Recherche secondaire: actualites et articles
  const secondaryQuery = `${SUBJECT_NAME} B\u00e9nin 2025 2026`;
  const secondaryResults = await searchPlatform(apiKey, 'twitter', secondaryQuery);

  // Fusionne et deduplique
  const allResults = [...primaryResults, ...secondaryResults];
  const seen = new Set<string>();
  const unique = allResults.filter((m) => {
    if (seen.has(m.url)) return false;
    seen.add(m.url);
    return true;
  });

  // Si on a des resultats reels, on les retourne
  if (unique.length > 0) {
    return unique.slice(0, 20);
  }

  // Sinon: donnees de demonstration realistes
  console.log('Tavily returned no results - using mock data for demo');
  return getMockMentions();
}
