import fs from 'fs';
import path from 'path';

// Define the 15 template configurations directly here to ensure easy mapping
const TEMPLATES = [
    {
        id: 'template-01-minimal',
        name: 'Minimal Essence',
        description: 'Clean, spacious, and modern. Perfect for straightforward booking experiences.',
        previewImageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=600&h=400',
        layout: {
            header: 'header/v1', hero: 'hero/v1', about: 'about/v1', services: 'services/v1',
            gallery: 'gallery/v1', testimonials: 'testimonials/v1', contact: 'contact/v1',
            footer: 'footer/v1', bookingWidget: 'booking-widget/v1', pricing: 'pricing/v1',
            faq: 'faq/v1', team: 'team/v1'
        }
    },
    {
        id: 'template-02-dark-glass',
        name: 'Neon Nightscape',
        description: 'A deep dark mode theme featuring frosted glass elements and neon accents.',
        previewImageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600&h=400',
        layout: {
            header: 'header/v2', hero: 'hero/v2', about: 'about/v2', services: 'services/v2',
            gallery: 'gallery/v2', testimonials: 'testimonials/v2', contact: 'contact/v2',
            footer: 'footer/v2', bookingWidget: 'booking-widget/v2', pricing: 'pricing/v2',
            faq: 'faq/v2', team: 'team/v2'
        }
    },
    {
        id: 'template-03-vibrant',
        name: 'Vibrant Horizons',
        description: 'Playful, bright, and colorful styling with dynamic bouncy animations.',
        previewImageUrl: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&q=80&w=600&h=400',
        layout: {
            header: 'header/v3', hero: 'hero/v3', about: 'about/v3', services: 'services/v3',
            gallery: 'gallery/v3', testimonials: 'testimonials/v3', contact: 'contact/v3',
            footer: 'footer/v3', bookingWidget: 'booking-widget/v3', pricing: 'pricing/v3',
            faq: 'faq/v3', team: 'team/v3'
        }
    },
    {
        id: 'template-04-luxury',
        name: 'Opulent Retreat',
        description: 'High-end luxury with serif fonts, gold accents, and slow elegant fade-ins.',
        previewImageUrl: 'https://images.unsplash.com/photo-1542314831-c6a4d14d88e4?auto=format&fit=crop&q=80&w=600&h=400',
        layout: {
            header: 'header/v4', hero: 'hero/v4', about: 'about/v4', services: 'services/v4',
            gallery: 'gallery/v4', testimonials: 'testimonials/v4', contact: 'contact/v4',
            footer: 'footer/v4', bookingWidget: 'booking-widget/v4', pricing: 'pricing/v4',
            faq: 'faq/v4', team: 'team/v4'
        }
    },
    {
        id: 'template-05-modern-contrast',
        name: 'Modern Contrast',
        description: 'High contrast black and white minimal layout with dark glass highlights.',
        previewImageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600&h=400',
        layout: {
            header: 'header/v1', hero: 'hero/v2', about: 'about/v1', services: 'services/v2',
            gallery: 'gallery/v1', testimonials: 'testimonials/v2', contact: 'contact/v1',
            footer: 'footer/v2', bookingWidget: 'booking-widget/v1', pricing: 'pricing/v2',
            faq: 'faq/v1', team: 'team/v1'
        }
    },
    {
        id: 'template-06-creative-pop',
        name: 'Creative Pop',
        description: 'Vibrant and energetic, balanced with clean minimal sections.',
        previewImageUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=600&h=400',
        layout: {
            header: 'header/v3', hero: 'hero/v3', about: 'about/v1', services: 'services/v3',
            gallery: 'gallery/v1', testimonials: 'testimonials/v3', contact: 'contact/v1',
            footer: 'footer/v3', bookingWidget: 'booking-widget/v3', pricing: 'pricing/v1',
            faq: 'faq/v1', team: 'team/v3'
        }
    },
    {
        id: 'template-07-executive',
        name: 'Executive Clean',
        description: 'Minimalist layouts combined with luxury typography and refined colors.',
        previewImageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600&h=400',
        layout: {
            header: 'header/v4', hero: 'hero/v1', about: 'about/v4', services: 'services/v1',
            gallery: 'gallery/v4', testimonials: 'testimonials/v1', contact: 'contact/v4',
            footer: 'footer/v1', bookingWidget: 'booking-widget/v4', pricing: 'pricing/v1',
            faq: 'faq/v4', team: 'team/v1'
        }
    },
    {
        id: 'template-08-midnight-bloom',
        name: 'Midnight Bloom',
        description: 'Dark mode base augmented with playful, vibrant coral and purple accents.',
        previewImageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=600&h=400',
        layout: {
            header: 'header/v2', hero: 'hero/v3', about: 'about/v2', services: 'services/v3',
            gallery: 'gallery/v2', testimonials: 'testimonials/v3', contact: 'contact/v2',
            footer: 'footer/v3', bookingWidget: 'booking-widget/v2', pricing: 'pricing/v3',
            faq: 'faq/v2', team: 'team/v3'
        }
    },
    {
        id: 'template-09-lush-simple',
        name: 'Lush & Simple',
        description: 'Earthy, bright tones utilizing both minimalistic and organic playful components.',
        previewImageUrl: 'https://images.unsplash.com/photo-1416879598056-db797f1ccaf4?auto=format&fit=crop&q=80&w=600&h=400',
        layout: {
            header: 'header/v1', hero: 'hero/v3', about: 'about/v1', services: 'services/v3',
            gallery: 'gallery/v3', testimonials: 'testimonials/v1', contact: 'contact/v3',
            footer: 'footer/v1', bookingWidget: 'booking-widget/v1', pricing: 'pricing/v3',
            faq: 'faq/v1', team: 'team/v3'
        }
    },
    {
        id: 'template-10-dark-elegance',
        name: 'Dark Elegance',
        description: 'Luxury design adapted for dark mode with gold and dark charcoal elements.',
        previewImageUrl: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=600&h=400',
        layout: {
            header: 'header/v4', hero: 'hero/v2', about: 'about/v4', services: 'services/v2',
            gallery: 'gallery/v4', testimonials: 'testimonials/v2', contact: 'contact/v4',
            footer: 'footer/v2', bookingWidget: 'booking-widget/v4', pricing: 'pricing/v2',
            faq: 'faq/v4', team: 'team/v2'
        }
    },
    {
        id: 'template-11-bright-corporate',
        name: 'Bright Corporate',
        description: 'Professional, light theme blending clean structural design with premium feel.',
        previewImageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600&h=400',
        layout: {
            header: 'header/v1', hero: 'hero/v4', about: 'about/v1', services: 'services/v4',
            gallery: 'gallery/v1', testimonials: 'testimonials/v4', contact: 'contact/v1',
            footer: 'footer/v4', bookingWidget: 'booking-widget/v1', pricing: 'pricing/v4',
            faq: 'faq/v1', team: 'team/v4'
        }
    },
    {
        id: 'template-12-tech-innovator',
        name: 'Tech Innovator',
        description: 'Digital-first approach combining sleek dark layouts with structured data minimal sections.',
        previewImageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600&h=400',
        layout: {
            header: 'header/v2', hero: 'hero/v1', about: 'about/v2', services: 'services/v1',
            gallery: 'gallery/v2', testimonials: 'testimonials/v1', contact: 'contact/v2',
            footer: 'footer/v1', bookingWidget: 'booking-widget/v2', pricing: 'pricing/v1',
            faq: 'faq/v2', team: 'team/v1'
        }
    },
    {
        id: 'template-13-playful-premium',
        name: 'Playful Premium',
        description: 'A striking mix of high-end luxury typography with vibrant organic background elements.',
        previewImageUrl: 'https://images.unsplash.com/photo-1541883395982-f384f50993ad?auto=format&fit=crop&q=80&w=600&h=400',
        layout: {
            header: 'header/v3', hero: 'hero/v4', about: 'about/v3', services: 'services/v4',
            gallery: 'gallery/v3', testimonials: 'testimonials/v4', contact: 'contact/v3',
            footer: 'footer/v4', bookingWidget: 'booking-widget/v3', pricing: 'pricing/v4',
            faq: 'faq/v3', team: 'team/v4'
        }
    },
    {
        id: 'template-14-sunset',
        name: 'Sunset Gradient',
        description: 'Vibrant layout variants paired with warm sunset gradient tokens.',
        previewImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600&h=400',
        layout: {
            header: 'header/v3', hero: 'hero/v2', about: 'about/v3', services: 'services/v2',
            gallery: 'gallery/v3', testimonials: 'testimonials/v2', contact: 'contact/v3',
            footer: 'footer/v2', bookingWidget: 'booking-widget/v3', pricing: 'pricing/v2',
            faq: 'faq/v3', team: 'team/v2'
        }
    },
    {
        id: 'template-15-silver',
        name: 'Silver Monolith',
        description: 'Stark, modern monochromatic luxury emphasizing photography and whitespace.',
        previewImageUrl: 'https://images.unsplash.com/photo-1481546252445-56bcda0b9320?auto=format&fit=crop&q=80&w=600&h=400',
        layout: {
            header: 'header/v4', hero: 'hero/v4', about: 'about/v1', services: 'services/v4',
            gallery: 'gallery/v4', testimonials: 'testimonials/v1', contact: 'contact/v4',
            footer: 'footer/v1', bookingWidget: 'booking-widget/v4', pricing: 'pricing/v1',
            faq: 'faq/v4', team: 'team/v1'
        }
    }
];

const mockContents: Record<string, Record<string, any>> = {
    'header': { projectName: 'My Awesome Brand', menu: [{ label: 'Home', href: '/' }, { label: 'Services', href: '#services' }, { label: 'Contact', href: '#contact' }] },
    'hero': { title: 'Welcome to the Future', titleLead: 'Welcome to', rotatingWords: ['the Future', 'Tomorrow', 'Success'], subtitle: 'We build incredible things that scale seamlessly and beautifully.', eyebrow: 'Start Now', ctaTextPrimary: 'Get Started', ctaLinkPrimary: '#', ctaTextSecondary: 'Learn More', ctaLinkSecondary: '#', backgroundImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200' },
    'about': { title: 'Our Story', body: 'We are passionate about creating stunning experiences. Our team spans the globe, dedicated to pushing boundaries and delivering pure excellence.', imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800' },
    'services': { title: 'What We Do', subtitle: 'A comprehensive suite of modern solutions.', showAllServices: true, featuredCount: 3 },
    'gallery': { title: 'Our Work', images: [{ url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800', alt: 'Project 1' }, { url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=800', alt: 'Project 2' }, { url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800', alt: 'Project 3' }] },
    'testimonials': { title: 'What People Say', testimonials: [{ name: 'Alice Smith', role: 'CEO', text: 'Incredible work and attention to detail. Absolute pleasure to work with.' }, { name: 'John Doe', role: 'CTO', text: 'A truly transformative experience for our product.' }] },
    'contact': { title: 'Get In Touch', address: '123 Innovation Drive, Tech City', phone: '+1 (555) 123-4567', email: 'hello@brand.com' },
    'footer': { copyrightText: '© 2026 My Awesome Brand. All rights reserved.', columns: [{ title: 'Links', links: [{ label: 'Home', href: '/' }, { label: 'About', href: '/about' }] }] },
    'booking-widget': { title: 'Book an Appointment', subtitle: 'Select a time that works for you.', ctaText: 'Confirm Booking' },
    'pricing': { title: 'Simple Pricing', tiers: [{ name: 'Starter', price: '$29', period: '/mo', description: 'Perfect for individuals.', ctaText: 'Choose Starter' }, { name: 'Pro', price: '$99', period: '/mo', description: 'Best for teams.', ctaText: 'Choose Pro', highlighted: true }] },
    'faq': { title: 'Common Questions', items: [{ question: 'How do I start?', answer: 'Simply sign up and you can begin immediately.' }, { question: 'Is there a free trial?', answer: 'Yes, we offer a 14-day free trial.' }] },
    'team': { title: 'Meet the Team', members: [{ name: 'Sarah Connor', role: 'Lead Designer', bio: 'Sarah creates stunning visual systems.' }, { name: 'James Holden', role: 'Engineer', bio: 'James builds robust backends.' }] }
};

const generatedTemplates = TEMPLATES.map(template => {
    const sectionsJsonb = Object.entries(template.layout).map(([featureSlug, themeComponentKey]) => {
        return {
            themeComponentKey,
            defaultContent: mockContents[featureSlug] || { title: `Default ${featureSlug}` },
            defaultStyles: {}
        };
    });

    return `
    {
        name: '${template.name}',
        description: '${template.description}',
        previewImageUrl: '${template.previewImageUrl}',
        sectionsJsonb: ${JSON.stringify(sectionsJsonb)},
        isActive: true,
    }`;
});

const fileContent = `
const PAGE_TEMPLATES = [
    ${generatedTemplates.join(',\n')}
];
`;

fs.writeFileSync(path.join(__dirname, 'generated_templates.txt'), fileContent);
console.log('Successfully wrote generated_templates.txt');
