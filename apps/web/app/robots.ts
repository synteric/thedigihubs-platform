import type { MetadataRoute } from 'next';

const SITE_URL = 'https://www.thedigihubs.com';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || SITE_URL).replace(/\/$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/buyer',
          '/supplier',
          '/rfq',
          '/samples',
          '/login',
          '/forgot-password',
          '/reset-password',
          '/verify-email',
          '/documents',
          '/api',
          '/access-denied',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
