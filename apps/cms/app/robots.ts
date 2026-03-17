import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/dashboard/', '/api/'],
        },
        sitemap: `${process.env.CMS_URL || 'https://buildmyonlineweb.site'}/sitemap.xml`,
    };
}
