import type { MetadataRoute } from 'next';

const SITE_URL = 'https://www.thedigihubs.com';

const publicPaths = [
  '/',
  '/platform',
  '/resources',
  '/partners',
  '/solutions/buyers',
  '/solutions/suppliers',
  '/register',
  '/subscribe',
  '/contact',
  '/marketplace',
  '/privacy-policy',
  '/terms-and-conditions',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || SITE_URL).replace(/\/$/, '');

  return publicPaths.map((path) => ({
    url: new URL(path, baseUrl).toString(),
    lastModified: new Date(),
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : 0.7,
  }));
}
