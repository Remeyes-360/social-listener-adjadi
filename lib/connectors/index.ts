import { RawMention, Platform } from '../types';
import { SUBJECT_VARIANTS } from '../platforms';
import { searchTwitter } from './twitter';
import { searchFacebook } from './facebook';
import { searchInstagram } from './instagram';
import { searchLinkedIn } from './linkedin';
import { searchTikTok } from './tiktok';

// =====================================================================
// Configuration des credentials depuis les variables d'environnement
// Supporte le fallback App Token pour Facebook (AppID|AppSecret)
// et le Client Credentials Flow pour LinkedIn
// =====================================================================
const config = {
  twitter: {
    bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
  },
  facebook: {
    // Utilise l'Access Token si disponible, sinon App Token (AppID|AppSecret)
    accessToken: process.env.FACEBOOK_ACCESS_TOKEN
      || (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET
          ? `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`
          : ''),
    appId: process.env.FACEBOOK_APP_ID || '',
    appSecret: process.env.FACEBOOK_APP_SECRET || '',
  },
  instagram: {
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || '',
    igUserId: process.env.INSTAGRAM_USER_ID || '',
  },
  linkedin: {
    // Supporte Client Credentials (clientId:clientSecret en base64) ou Access Token
    accessToken: process.env.LINKEDIN_ACCESS_TOKEN || '',
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
  },
  tiktok: {
    accessToken: process.env.TIKTOK_ACCESS_TOKEN || '',
    clientKey: process.env.TIKTOK_CLIENT_KEY || '',
    clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
    researchToken: process.env.TIKTOK_RESEARCH_TOKEN || '',
  },
};

// Normalise les variantes pour la recherche
const SEARCH_QUERY = SUBJECT_VARIANTS.map((v) => `"${v}"`).join(' OR ');

// Charge les mentions pour une plateforme specifique
export async function fetchPlatformMentions(
  platform: Platform,
  limit: number = 20
): Promise<RawMention[]> {
  try {
    switch (platform) {
      case 'twitter':
        if (!config.twitter.bearerToken) return [];
        return await searchTwitter(config.twitter.bearerToken, SEARCH_QUERY, limit);

      case 'facebook':
        if (!config.facebook.accessToken) return [];
        return await searchFacebook(config.facebook.accessToken, SEARCH_QUERY, limit);

      case 'instagram':
        if (!config.instagram.accessToken && !config.facebook.accessToken) return [];
        // Instagram Business search uses Graph API - falls back to hashtag search
        return await searchInstagram(
          config.instagram.accessToken || config.facebook.accessToken,
          SEARCH_QUERY,
          limit
        );

      case 'linkedin':
        if (!config.linkedin.accessToken && !config.linkedin.clientId) return [];
        return await searchLinkedIn(
          config.linkedin.accessToken,
          config.linkedin.clientId,
          config.linkedin.clientSecret,
          SEARCH_QUERY,
          limit
        );

      case 'tiktok':
        if (!config.tiktok.clientKey && !config.tiktok.accessToken) return [];
        return await searchTikTok(
          config.tiktok.accessToken,
          config.tiktok.clientKey,
          config.tiktok.clientSecret,
          SEARCH_QUERY,
          limit
        );

      default:
        return [];
    }
  } catch (error) {
    console.error(`Native connector error for ${platform}:`, error);
    return [];
  }
}

// Charge les mentions pour toutes les plateformes en parallele
export async function fetchAllPlatformMentions(
  platformFilter?: Platform
): Promise<RawMention[]> {
  const platforms: Platform[] = platformFilter
    ? [platformFilter]
    : ['twitter', 'facebook', 'instagram', 'linkedin', 'tiktok'];

  const results = await Promise.allSettled(
    platforms.map((p) => fetchPlatformMentions(p, 15))
  );

  const mentions: RawMention[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      mentions.push(...result.value);
    }
  }

  return mentions;
}

// Alias pour compatibilite avec app/api/mentions/route.ts
export const searchAllSocialPlatforms = fetchAllPlatformMentions;

// Retourne les plateformes actuellement configurees
export function getConfiguredPlatforms(): Platform[] {
  const platforms: Platform[] = [];
  if (config.twitter.bearerToken) platforms.push('twitter');
  if (config.facebook.accessToken) platforms.push('facebook');
  if (config.instagram.accessToken || config.facebook.accessToken) platforms.push('instagram');
  if (config.linkedin.accessToken || config.linkedin.clientId) platforms.push('linkedin');
  if (config.tiktok.clientKey || config.tiktok.accessToken) platforms.push('tiktok');
  return platforms;
}
