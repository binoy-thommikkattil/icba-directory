import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Block Google from crawling your private directory pages!
      disallow: ['/dashboard/', '/directory/', '/meetings/', '/waiting-room/'],
    },
    sitemap: 'https://immanuel-assembly.com/sitemap.xml',
  };
}