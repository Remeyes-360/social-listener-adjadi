import { NextRequest, NextResponse } from 'next/server';
import { Platform } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function getMockMentions(platform: Platform | null) {
  const now = new Date();
  const allMentions = [
    {
      id: 'tw-001',
      platform: 'twitter' as Platform,
      author: '@adjadi_fans',
      content: 'Olushegun ADJADI BAKARI vient de publier une analyse brillante sur les tendances du marché africain. Thread incontournable ! 🔥 #business #afrique',
      url: 'https://twitter.com/adjadi_fans/status/1',
      timestamp: new Date(now.getTime() - 15 * 60000).toISOString(),
      sentiment: 'positive' as const,
      importance: 'high' as const,
      context: 'mention' as const,
      engagement: { likes: 342, shares: 87, comments: 56 },
      author_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=adjadi1',
    },
    {
      id: 'tw-002',
      platform: 'twitter' as Platform,
      author: '@tech_africa',
      content: 'Interview exclusive avec Olushegun ADJADI BAKARI sur l\'innovation technologique en Afrique de l\'Ouest. Une vision inspirante du futur numérique. #tech #innovation',
      url: 'https://twitter.com/tech_africa/status/2',
      timestamp: new Date(now.getTime() - 45 * 60000).toISOString(),
      sentiment: 'positive' as const,
      importance: 'high' as const,
      context: 'mention' as const,
      engagement: { likes: 218, shares: 63, comments: 31 },
      author_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=adjadi2',
    },
    {
      id: 'ig-001',
      platform: 'instagram' as Platform,
      author: '@lifestyle_dakar',
      content: 'Rencontré Olushegun ADJADI BAKARI lors du sommet économique de Dakar. Sa présentation sur l\'entrepreneuriat africain était absolument captivante ! 👏',
      url: 'https://instagram.com/p/example1',
      timestamp: new Date(now.getTime() - 2 * 3600000).toISOString(),
      sentiment: 'positive' as const,
      importance: 'medium' as const,
      context: 'mention' as const,
      engagement: { likes: 1247, shares: 89, comments: 143 },
      author_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=adjadi3',
    },
    {
      id: 'ig-002',
      platform: 'instagram' as Platform,
      author: '@business_abidjan',
      content: 'Les conseils d\'Olushegun ADJADI BAKARI sur la finance personnelle ont transformé ma façon de voir l\'investissement. Merci pour cette sagesse partagée ! 💡💰',
      url: 'https://instagram.com/p/example2',
      timestamp: new Date(now.getTime() - 4 * 3600000).toISOString(),
      sentiment: 'positive' as const,
      importance: 'medium' as const,
      context: 'post' as const,
      engagement: { likes: 876, shares: 45, comments: 92 },
      author_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=adjadi4',
    },
    {
      id: 'fb-001',
      platform: 'facebook' as Platform,
      author: 'Communauté Business Afrique',
      content: 'ADJADI BAKARI Olushegun partage ses réflexions sur le développement économique durable. Un message fort pour la nouvelle génération d\'entrepreneurs africains.',
      url: 'https://facebook.com/posts/example1',
      timestamp: new Date(now.getTime() - 6 * 3600000).toISOString(),
      sentiment: 'positive' as const,
      importance: 'high' as const,
      context: 'share' as const,
      engagement: { likes: 543, shares: 234, comments: 78 },
      author_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=adjadi5',
    },
    {
      id: 'fb-002',
      platform: 'facebook' as Platform,
      author: 'Réseau des Entrepreneurs Francophones',
      content: 'Débat animé suite au dernier article d\'Olushegun ADJADI BAKARI sur les politiques fiscales en Afrique. Des opinions partagées mais toujours constructives.',
      url: 'https://facebook.com/posts/example2',
      timestamp: new Date(now.getTime() - 8 * 3600000).toISOString(),
      sentiment: 'neutral' as const,
      importance: 'medium' as const,
      context: 'mention' as const,
      engagement: { likes: 187, shares: 56, comments: 203 },
      author_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=adjadi6',
    },
    {
      id: 'li-001',
      platform: 'linkedin' as Platform,
      author: 'Amadou Diallo',
      content: 'La conférence d\'Olushegun ADJADI BAKARI sur la transformation digitale des PME africaines était un moment clé. Des insights précieux pour notre secteur. Recommandé à tous les professionnels.',
      url: 'https://linkedin.com/posts/example1',
      timestamp: new Date(now.getTime() - 10 * 3600000).toISOString(),
      sentiment: 'positive' as const,
      importance: 'high' as const,
      context: 'mention' as const,
      engagement: { likes: 892, shares: 167, comments: 94 },
      author_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=adjadi7',
    },
    {
      id: 'li-002',
      platform: 'linkedin' as Platform,
      author: 'Fatou Ndiaye',
      content: 'Je cite souvent ADJADI BAKARI dans mes formations sur l\'investissement responsable. Sa méthodologie d\'analyse des marchés émergents est une référence dans notre domaine.',
      url: 'https://linkedin.com/posts/example2',
      timestamp: new Date(now.getTime() - 14 * 3600000).toISOString(),
      sentiment: 'positive' as const,
      importance: 'medium' as const,
      context: 'mention' as const,
      engagement: { likes: 456, shares: 78, comments: 45 },
      author_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=adjadi8',
    },
    {
      id: 'tt-001',
      platform: 'tiktok' as Platform,
      author: '@youngentrepreneur_africa',
      content: 'J\'ai appliqué les 5 règles d\'Olushegun ADJADI BAKARI pour développer mon business et les résultats sont incroyables ! 🚀 Regardez ma transformation en 30 jours #entrepreneur #success',
      url: 'https://tiktok.com/@example/video/1',
      timestamp: new Date(now.getTime() - 3 * 3600000).toISOString(),
      sentiment: 'positive' as const,
      importance: 'high' as const,
      context: 'mention' as const,
      engagement: { likes: 15420, shares: 2340, comments: 876 },
      author_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=adjadi9',
    },
    {
      id: 'tt-002',
      platform: 'tiktok' as Platform,
      author: '@finance_jeunes',
      content: 'Réaction à la vidéo virale d\'ADJADI BAKARI sur l\'épargne intelligente. Il a raison sur tout ! La génération Z a besoin d\'entendre ces conseils financiers. 💯',
      url: 'https://tiktok.com/@example/video/2',
      timestamp: new Date(now.getTime() - 5 * 3600000).toISOString(),
      sentiment: 'positive' as const,
      importance: 'medium' as const,
      context: 'reaction' as const,
      engagement: { likes: 8930, shares: 1240, comments: 543 },
      author_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=adjadi10',
    },
  ];

  if (platform && platform !== 'all') {
    return allMentions.filter(m => m.platform === platform);
  }
  return allMentions;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform') as Platform | null;

  try {
    // Toujours retourner les données mock pour la démo
    const mentions = getMockMentions(platform);

    return NextResponse.json({
      mentions,
      platform: platform || 'all',
      timestamp: new Date().toISOString(),
      source: 'remi-demo',
      total: mentions.length,
    });
  } catch (error) {
    console.error('Mentions API error:', error);
    return NextResponse.json(
      {
        error: String(error),
        mentions: [],
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
