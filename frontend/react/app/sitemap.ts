import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: 'https://edufyuzbekistan.com/',
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://edufyuzbekistan.com/about',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://edufyuzbekistan.com/contact',
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.6,
    },
    {
      url: 'https://edufyuzbekistan.com/faq',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://edufyuzbekistan.com/team',
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: 'https://edufyuzbekistan.com/careers',
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: 'https://edufyuzbekistan.com/reviews',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://edufyuzbekistan.com/privacy-policy',
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: 'https://edufyuzbekistan.com/terms-of-service',
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: 'https://edufyuzbekistan.com/cookies-policy',
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];

  return staticPages;
}
