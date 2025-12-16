import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const urls = [
    'https://edufyuzbekistan.com/',
    'https://edufyuzbekistan.com/blog',
    'https://edufyuzbekistan.com/about',
    'https://edufyuzbekistan.com/contact',
    'https://edufyuzbekistan.com/faq',
    'https://edufyuzbekistan.com/team',
    'https://edufyuzbekistan.com/careers',
    'https://edufyuzbekistan.com/reviews',
    'https://edufyuzbekistan.com/privacy-policy',
    'https://edufyuzbekistan.com/terms-of-service',
    'https://edufyuzbekistan.com/cookies-policy',
  ];

  return urls.map((url) => ({
    url,
    lastModified: now,
  }));
}
