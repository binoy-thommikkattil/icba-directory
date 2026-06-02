import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Strictly block Google from scanning your private app pages and backend APIs
      disallow: ['/dashboard/', '/waiting-room/', '/api/'],
    },
    // Points Google directly to your sitemap
    sitemap: 'https://immanuel-assembly.com/sitemap.xml',
  };
}