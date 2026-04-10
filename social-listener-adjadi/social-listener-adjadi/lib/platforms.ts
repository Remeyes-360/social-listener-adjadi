import { PlatformConfig } from './types';

export const SUBJECT_NAME = 'Olushegun ADJADI BAKARI';

export const PLATFORMS: PlatformConfig[] = [
  {
    id: 'twitter',
    label: 'Twitter / X',
    query: `site:twitter.com OR site:x.com "${SUBJECT_NAME}"`,
    color: '#1DA1F2',
    bgColor: 'rgba(29,161,242,0.1)',
    textColor: '#1DA1F2',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    query: `site:instagram.com "${SUBJECT_NAME}"`,
    color: '#E1306C',
    bgColor: 'rgba(225,48,108,0.1)',
    textColor: '#E1306C',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    query: `site:facebook.com "${SUBJECT_NAME}"`,
    color: '#1877F2',
    bgColor: 'rgba(24,119,242,0.1)',
    textColor: '#1877F2',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    query: `site:linkedin.com "${SUBJECT_NAME}"`,
    color: '#0A66C2',
    bgColor: 'rgba(10,102,194,0.1)',
    textColor: '#0A66C2',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    query: `site:tiktok.com "${SUBJECT_NAME}"`,
    color: '#FF0050',
    bgColor: 'rgba(255,0,80,0.1)',
    textColor: '#FF0050',
  },
];

export const getPlatformConfig = (id: string): PlatformConfig | undefined =>
  PLATFORMS.find((p) => p.id === id);
