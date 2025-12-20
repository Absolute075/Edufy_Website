import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/billing',
          '/dashboard',
          '/leaderboard',
          '/login',
          '/mentor',
          '/notifications',
          '/payment',
          '/profile',
          '/register',
          '/report',
          '/resources',
          '/schedule',
          '/settings',
          '/reset-password',
        ],
      },
    ],
    sitemap: 'https://edufyuzbekistan.com/sitemap.xml',
    host: 'https://edufyuzbekistan.com',
  };
}
