import { RawMention, Platform } from '../types';
import { SUBJECT_NAME } from '../platforms';
import { searchTwitter } from './twitter';
import { searchFacebook, fetchPagePosts } from './facebook';
import { fetchInstagramMedia, searchInstagramHashtag } from './instagram';
import { fetchLinkedInOrgPosts } from './linkedin';
import { searchTikTokVideos, fetchMyTikTokVideos } from './tiktok';

// Configuration des credentials depuis les variables d'environnement
const config = {
  twitter: {
    bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
  },
  facebook: {
    accessToken: process.env.FACEBOOK_ACCESS_TOKEN || '',
    pageId: process.env.FACEBOOK_PAGE_ID || '',
  },
  instagram: {
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || '',
    igUserId: process.env.INSTAGRAM_USER_ID || '',
  },
  linkedin: {
    accessToken: process.env.LINKEDIN_ACCESS_TOKEN || '',
    organizationId: process.env.LINKEDIN_ORGANIZATION_ID || '',
  },
  tiktok: {
    accessToken: process.env.TIKTOK_ACCESS_TOKEN || '',
    clientKey: process.env.TIKTOK_CLIENT_KEY || '',
    researchToken: process.env.TIKTOK_RESEARCH_TOKEN || '',
  },
};

// Charge les mentions pour une plateforme spécifique
export async function fetchPlatformMentions(
  platform: Platform,
  limit: number = 20
): Promise<RawMention[]> {
  const subject = SUBJECT_NAME;

  switch (platform) {
    case 'twitter': {
      if (!config.twitter.bearerToken) return [];
      return searchTwitter(config.twitter.bearerToken, subject, limit);
    }

    case 'facebook': {
      if (!config.facebook.accessToken) return [];
      const results: RawMention[] = [];
      // Recherche publique + posts de la page
      const [searchResults, pageResults] = await Promise.allSettled([
        searchFacebook(config.facebook.accessToken, subject, limit),
        config.facebook.pageId
          ? fetchPagePosts(config.facebook.pageId, config.facebook.accessToken, limit)
          : Promise.resolve([]),
      ]);
      if (searchResults.status === 'fulfilled') results.push(...searchResults.value);
      if (pageResults.status === 'fulfilled') results.push(...pageResults.value);
      return results;
    }

    case 'instagram': {
      if (!config.instagram.accessToken || !config.instagram.igUserId) return [];
      const [ownMedia, hashtagResults] = await Promise.allSettled([
        fetchInstagramMedia(config.instagram.igUserId, config.instagram.accessToken, limit),
        searchInstagramHashtag(
          config.instagram.igUserId,
          config.instagram.accessToken,
          subject.split(' ')[1] || subject, // ex: "ADJADI"
          limit
        ),
      ]);
      const results: RawMention[] = [];
      if (ownMedia.status === 'fulfilled') results.push(...ownMedia.value);
      if (hashtagResults.status === 'fulfilled') results.push(...hashtagResults.value);
      return results;
    }

    case 'linkedin': {
      if (!config.linkedin.accessToken || !config.linkedin.organizationId) return [];
      return fetchLinkedInOrgPosts(
        config.linkedin.organizationId,
        config.linkedin.accessToken,
        limit
      );
    }

    case 'tiktok': {
      if (!config.tiktok.accessToken) return [];
      // Priorité Research API si token disponible, sinon Display API
      if (config.tiktok.researchToken) {
        return searchTikTokVideos(
          config.tiktok.clientKey,
          config.tiktok.researchToken,
          subject,
          limit
        );
      }
      return fetchMyTikTokVideos(config.tiktok.accessToken, limit);
    }

    default:
      return [];
  }
}

// Charge toutes les plateformes en parallèle
export async function fetchAllPlatformMentions(
  limit: number = 20
): Promise<RawMention[]> {
  const platforms: Platform[] = ['twitter', 'facebook', 'instagram', 'linkedin', 'tiktok'];

  const results = await Promise.allSettled(
    platforms.map((p) => fetchPlatformMentions(p, limit))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<RawMention[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);
}

// Vérifie quelles plateformes sont configurées
export function getConfiguredPlatforms(): Platform[] {
  const configured: Platform[] = [];
  if (config.twitter.bearerToken) configured.push('twitter');
  if (config.facebook.accessToken) configured.push('facebook');
  if (config.instagram.accessToken && config.instagram.igUserId) configured.push('instagram');
  if (config.linkedin.accessToken && config.linkedin.organizationId) configured.push('linkedin');
  if (config.tiktok.accessToken) configured.push('tiktok');
  return configured;
}
