import { PlatformConfig } from './types';

export const SUBJECT_NAME = 'Olushegun ADJADI BAKARI';

// Les 4 variantes de noms a surveiller (filtrage cote serveur)
export const SUBJECT_VARIANTS = [
  'Olushegun Adjadi Bakari',
  'Shegun Bakari',
  'Shegun Adjadi Bakari',
  'Ministre des Affaires etrangeres du Benin',
];

// Query globale : toutes les variantes en OR
export const SEARCH_QUERY = SUBJECT_VARIANTS.map((v) => `"${v}"`).join(' OR ');

export const PLATFORMS: PlatformConfig[] = [
  {
    id: 'twitter',
    label: 'Twitter / X',
    query: SEARCH_QUERY,
    domains: ['twitter.com', 'x.com'],
    color: '#1DA1F2',
    bgColor: 'rgba(29,161,242,0.1)',
    textColor: '#1DA1F2',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    query: SEARCH_QUERY,
    domains: ['instagram.com'],
    color: '#E1306C',
    bgColor: 'rgba(225,48,108,0.1)',
    textColor: '#E1306C',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    query: SEARCH_QUERY,
    domains: ['facebook.com'],
    color: '#1877F2',
    bgColor: 'rgba(24,119,242,0.1)',
    textColor: '#1877F2',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    query: SEARCH_QUERY,
    domains: ['linkedin.com'],
    color: '#0A66C2',
    bgColor: 'rgba(10,102,194,0.1)',
    textColor: '#0A66C2',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    query: SEARCH_QUERY,
    domains: ['tiktok.com'],
    color: '#010101',
    bgColor: 'rgba(1,1,1,0.1)',
    textColor: '#69C9D0',
  },
];


export const getPlatformConfig = (id: string): PlatformConfig | undefined =>
  PLATFORMS.find((p) => p.id === id);
