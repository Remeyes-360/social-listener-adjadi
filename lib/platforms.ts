import { PlatformConfig } from './types';

export const SUBJECT_NAME = 'Olushegun ADJADI BAKARI';

// Toutes les variantes de noms à surveiller
export const SUBJECT_VARIANTS = [
  'Olushegun Adjadi Bakari',
  'Shegun Bakari',
  'Shegun Adjadi Bakari',
  'Ministre des Affaires étrangères du Bénin',
];

// Query Perplexity Search avec toutes les variantes pour une plateforme donnée
function buildQuery(site: string): string {
  const variants = SUBJECT_VARIANTS.map((v) => `"${v}"`).join(' OR ');
  return `${site} (${variants})`;
}

export const PLATFORMS: PlatformConfig[] = [
  {
    id: 'twitter',
    label: 'Twitter / X',
    query: buildQuery('site:twitter.com OR site:x.com'),
    color: '#1DA1F2',
    bgColor: 'rgba(29,161,242,0.1)',
    textColor: '#1DA1F2',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    query: buildQuery('site:instagram.com'),
    color: '#E1306C',
    bgColor: 'rgba(225,48,108,0.1)',
    textColor: '#E1306C',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    query: buildQuery('site:facebook.com'),
    color: '#1877F2',
    bgColor: 'rgba(24,119,242,0.1)',
    textColor: '#1877F2',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    query: buildQuery('site:linkedin.com'),
    color: '#0A66C2',
    bgColor: 'rgba(10,102,194,0.1)',
    textColor: '#0A66C2',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    query: buildQuery('site:tiktok.com'),
    color: '#FF0050',
    bgColor: 'rgba(255,0,80,0.1)',
    textColor: '#FF0050',
  },
];

export const getPlatformConfig = (id: string): PlatformConfig | undefined =>
  PLATFORMS.find((p) => p.id === id);
