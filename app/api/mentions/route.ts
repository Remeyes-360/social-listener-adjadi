import { NextRequest, NextResponse } from 'next/server';
import { RawMention, Platform } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function getMockMentions(platform: Platform | null): RawMention[] {
  const now = new Date();
  const allMentions: RawMention[] = [
    {
      id: 'tw-001',
      platform: 'twitter',
      author: '@adjadi_fans',
      content: 'Olushegun ADJADI BAKARI vient de publier une analyse brillante sur les tendances du march\u00e9 africain. Thread incontournable ! #business #afrique',
      url: 'https://twitter.com/adjadi_fans/status/1',
      publishedAt: new Date(now.getTime() - 15 * 60000).toISOString(),
      engagement: { likes: 342, shares: 87, comments: 56 },
    },
    {
      id: 'tw-002',
      platform: 'twitter',
      author: '@tech_africa',
      content: 'Interview exclusive avec Olushegun ADJADI BAKARI sur l\'innovation technologique en Afrique de l\'Ouest. Une vision inspirante du futur num\u00e9rique. #tech #innovation',
      url: 'https://twitter.com/tech_africa/status/2',
      publishedAt: new Date(now.getTime() - 45 * 60000).toISOString(),
      engagement: { likes: 218, shares: 63, comments: 31 },
    },
    {
      id: 'tw-003',
      platform: 'twitter',
      author: '@critique_eco',
      content: 'Les analyses d\'ADJADI BAKARI sont souvent trop optimistes sur le march\u00e9 africain. Manque de rigueur sur les donn\u00e9es macro-\u00e9conomiques. #\u00e9conomie',
      url: 'https://twitter.com/critique_eco/status/3',
      publishedAt: new Date(now.getTime() - 90 * 60000).toISOString(),
      engagement: { likes: 45, shares: 12, comments: 78 },
    },
    {
      id: 'ig-001',
      platform: 'instagram',
      author: '@lifestyle_dakar',
      content: 'Rencontr\u00e9 Olushegun ADJADI BAKARI lors du sommet \u00e9conomique de Dakar. Sa pr\u00e9sentation sur l\'entrepreneuriat africain \u00e9tait absolument captivante !',
      url: 'https://instagram.com/p/example1',
      publishedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
      engagement: { likes: 1247, shares: 89, comments: 143 },
    },
    {
      id: 'ig-002',
      platform: 'instagram',
      author: '@business_abidjan',
      content: 'Les conseils d\'Olushegun ADJADI BAKARI sur la finance personnelle ont transform\u00e9 ma fa\u00e7on de voir l\'investissement. Merci pour cette sagesse partag\u00e9e !',
      url: 'https://instagram.com/p/example2',
      publishedAt: new Date(now.getTime() - 4 * 3600000).toISOString(),
      engagement: { likes: 876, shares: 45, comments: 92 },
    },
    {
      id: 'fb-001',
      platform: 'facebook',
      author: 'Communaut\u00e9 Business Afrique',
      content: 'ADJADI BAKARI Olushegun partage ses r\u00e9flexions sur le d\u00e9veloppement \u00e9conomique durable. Un message fort pour la nouvelle g\u00e9n\u00e9ration d\'entrepreneurs africains.',
      url: 'https://facebook.com/posts/example1',
      publishedAt: new Date(now.getTime() - 6 * 3600000).toISOString(),
      engagement: { likes: 543, shares: 234, comments: 78 },
    },
    {
      id: 'fb-002',
      platform: 'facebook',
      author: 'R\u00e9seau des Entrepreneurs Francophones',
      content: 'D\u00e9bat anim\u00e9 suite au dernier article d\'Olushegun ADJADI BAKARI sur les politiques fiscales en Afrique. Des opinions partag\u00e9es mais toujours constructives.',
      url: 'https://facebook.com/posts/example2',
      publishedAt: new Date(now.getTime() - 8 * 3600000).toISOString(),
      engagement: { likes: 187, shares: 56, comments: 203 },
    },
    {
      id: 'li-001',
      platform: 'linkedin',
      author: 'Amadou Diallo',
      content: 'La conf\u00e9rence d\'Olushegun ADJADI BAKARI sur la transformation digitale des PME africaines \u00e9tait un moment cl\u00e9. Des insights pr\u00e9cieux pour notre secteur. Recommand\u00e9 \u00e0 tous les professionnels.',
      url: 'https://linkedin.com/posts/example1',
      publishedAt: new Date(now.getTime() - 10 * 3600000).toISOString(),
      engagement: { likes: 892, shares: 167, comments: 94 },
    },
    {
      id: 'li-002',
      platform: 'linkedin',
      author: 'Fatou Ndiaye',
      content: 'Critique constructive : la m\u00e9thodologie d\'ADJADI BAKARI m\u00e9rite d\'\u00eatre mise \u00e0 jour. Ses analyses datent de 2022 et le contexte \u00e9conomique a chang\u00e9.',
      url: 'https://linkedin.com/posts/example2',
      publishedAt: new Date(now.getTime() - 14 * 3600000).toISOString(),
      engagement: { likes: 156, shares: 23, comments: 89 },
    },
    {
      id: 'tt-001',
      platform: 'tiktok',
      author: '@youngentrepreneur_africa',
      content: 'J\'ai appliqu\u00e9 les 5 r\u00e8gles d\'Olushegun ADJADI BAKARI pour d\u00e9velopper mon business et les r\u00e9sultats sont incroyables ! Regardez ma transformation en 30 jours #entrepreneur #success',
      url: 'https://tiktok.com/@example/video/1',
      publishedAt: new Date(now.getTime() - 3 * 3600000).toISOString(),
      engagement: { likes: 15420, shares: 2340, comments: 876 },
    },
    {
      id: 'tt-002',
      platform: 'tiktok',
      author: '@finance_jeunes',
      content: 'R\u00e9action \u00e0 la vid\u00e9o virale d\'ADJADI BAKARI sur l\'\u00e9pargne intelligente. Il a raison sur tout ! La g\u00e9n\u00e9ration Z a besoin d\'entendre ces conseils financiers.',
      url: 'https://tiktok.com/@example/video/2',
      publishedAt: new Date(now.getTime() - 5 * 3600000).toISOString(),
      engagement: { likes: 8930, shares: 1240, comments: 543 },
    },
    {
      id: 'tt-003',
      platform: 'tiktok',
      author: '@vrai_debat_afrique',
      content: 'ADJADI BAKARI sur TikTok c\'est du contenu recycl\u00e9. Rien de nouveau, des conseils g\u00e9n\u00e9riques qu\'on trouve partout. Pourquoi autant de buzz ? #critique',
      url: 'https://tiktok.com/@example/video/3',
      publishedAt: new Date(now.getTime() - 7 * 3600000).toISOString(),
      engagement: { likes: 2100, shares: 890, comments: 1240 },
    },
  ];

  if (platform && platform !== 'all') {
    return allMentions.filter((m) => m.platform === platform);
  }
  return allMentions;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform') as Platform | null;

  try {
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
