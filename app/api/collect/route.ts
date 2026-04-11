import { NextRequest, NextResponse } from 'next/server';
import { fetchAllPlatformMentions, getConfiguredPlatforms } from '@/lib/connectors/index';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Endpoint de collecte périodique des mentions
 * Appelé par les crons Vercel : 1h / 6h / 24h
 * Sécurisé par CRON_SECRET
 */
export async function GET(request: NextRequest) {
  // Vérification du secret cron
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const frequency = searchParams.get('freq') || '1h'; // 1h, 6h, 24h, 7d, 30d
  const limit = getLimit(frequency);

  const configuredPlatforms = getConfiguredPlatforms();

  if (configuredPlatforms.length === 0) {
    return NextResponse.json({
      success: false,
      message: 'Aucune plateforme configurée',
      configuredPlatforms: [],
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const startTime = Date.now();
    const mentions = await fetchAllPlatformMentions(limit);
    const duration = Date.now() - startTime;

    // Répartition par plateforme
    const byPlatform = mentions.reduce(
      (acc, m) => {
        acc[m.platform] = (acc[m.platform] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      success: true,
      frequency,
      totalMentions: mentions.length,
      byPlatform,
      configuredPlatforms,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron collect error:', error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

function getLimit(frequency: string): number {
  switch (frequency) {
    case '1h': return 10;   // 10 mentions par plateforme par heure
    case '6h': return 25;   // 25 par plateforme toutes les 6h
    case '24h': return 50;  // 50 par plateforme par jour
    case '7d': return 100;  // 100 par plateforme par semaine
    case '30d': return 200; // 200 par plateforme par mois
    default: return 20;
  }
}
