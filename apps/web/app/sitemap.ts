import type { MetadataRoute } from 'next';

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
  '/samples',
  '/marketplace',
  '/privacy-policy',
  '/terms-and-conditions',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return publicPaths.map((path) => ({
    url: new URL(path, baseUrl).toString(),
    lastModified: new Date(),
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : 0.7,
  }));
}
