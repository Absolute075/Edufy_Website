import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: 'https://edufyuzbekistan.com/sitemap.xml',
    host: 'https://edufyuzbekistan.com',
  };
}
