import type { ThemeComponentProps } from '@booking-engine/themes';

export const TEST_TOKENS: ThemeComponentProps['tokens'] = {
    primary: '#2563eb',
    secondary: '#0f766e',
    accent: '#f59e0b',
    text: '#0f172a',
    background: '#ffffff',
    font: 'Manrope',
};

export const TEST_CONTEXT: NonNullable<ThemeComponentProps['context']> = {
    tenantId: 'test-tenant-id',
    instanceId: 'test-instance-id',
    pageSlug: '/',
};

type SectionFixture = {
    content: Record<string, unknown>;
    styles?: Record<string, unknown>;
};

const SECTION_FIXTURES: Record<string, SectionFixture> = {
    'header/v1': {
        content: {
            projectName: 'Acme Studio',
            menu: [{ label: 'Home', href: '/' }],
        },
    },
    'header/v5': {
        content: {
            projectName: 'Signal Horizon',
            menu: [{ label: 'Overview', href: '#hero' }],
            ctaText: 'Get Started',
            ctaLink: '#hero',
        },
    },
    'header/v6': {
        content: {
            projectName: 'Velocity VSL',
            menu: [{ label: 'Offer', href: '#hero' }],
            ctaText: 'Watch The Training',
            ctaLink: '#video',
        },
    },
    'hero/v1': {
        content: {
            title: 'Test Hero',
            subtitle: 'A baseline hero for smoke coverage.',
            ctaText: 'Book',
            ctaLink: '/booking',
        },
    },
    'hero/v2': {
        content: {
            title: 'Split Hero',
            subtitle: 'Reliable two-column hero.',
            ctaTextPrimary: 'Start',
            ctaLinkPrimary: '/booking',
        },
        styles: { layout: 'image-right', padding: 'medium' },
    },
    'hero/v3': {
        content: {
            titleLead: 'Grow with',
            rotatingWords: ['clarity'],
            subtitle: 'Animated hero baseline.',
        },
        styles: { showOrbs: true, glassCard: true },
    },
    'hero/v5': {
        content: {
            eyebrow: 'Flexible growth workspace',
            title: 'Launch with a clearer story.',
            subtitle: 'A modern hero with video support and dual calls to action.',
            primaryCtaText: 'Start Free',
            primaryCtaLink: '#features',
            secondaryCtaText: 'See Demo',
            secondaryCtaLink: '#video',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        },
    },
    'hero/v6': {
        content: {
            eyebrow: 'Marketing Video Sales Letter',
            title: 'Turn a single page into a focused conversion system.',
            subtitle: 'A VSL-style hero with one video and one next step.',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            primaryCtaText: 'Get Instant Access',
            primaryCtaLink: '#features',
            secondaryCtaText: 'See What Is Included',
            secondaryCtaLink: '#proof',
        },
    },
    'about/v1': {
        content: {
            title: 'About',
            body: 'Baseline content for test rendering.',
        },
    },
    'about/v2': {
        content: {
            title: 'About Stats',
            body: 'Baseline copy for stats section.',
        },
    },
    'about/v3': {
        content: {
            title: 'About Timeline',
            body: 'Story-driven about section with timeline content.',
            storyPoints: [
                { year: '2020', title: 'Started', description: 'We began with a clear mission.' },
            ],
        },
    },
    'services/v1': {
        content: {
            title: 'Services',
            showAllServices: false,
            featuredCount: 3,
            showSelectButton: true,
        },
    },
    'services/v2': {
        content: {
            title: 'Services Spotlight',
            featuredCount: 3,
            showSelectButton: true,
        },
        styles: { autoRotate: true },
    },
    'services/v5': {
        content: {
            title: 'Feature by feature',
            subtitle: 'Explain the offer in clear modular cards.',
            items: [
                {
                    title: 'Clear messaging blocks',
                    description: 'Focused explanation cards.',
                    stat: 'Fast scan',
                },
            ],
        },
    },
    'services/v6': {
        content: {
            title: 'What this funnel page helps you do',
            subtitle: 'Explain the promise and drive the response.',
            items: [
                {
                    title: 'Clarify the core promise',
                    description: 'Lead with one big result.',
                    result: 'Sharper positioning',
                },
            ],
        },
    },
    'gallery/v1': {
        content: {
            title: 'Gallery',
            images: [
                {
                    url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
                    alt: 'Gallery sample',
                },
            ],
        },
    },
    'testimonials/v1': {
        content: {
            title: 'Testimonials',
            testimonials: [
                {
                    name: 'Ava',
                    text: 'Excellent service.',
                    role: 'Customer',
                },
            ],
        },
    },
    'testimonials/v5': {
        content: {
            title: 'What people are saying',
            testimonials: [
                {
                    quote: 'The layout is easy to understand.',
                    author: 'Avery',
                    role: 'Product lead',
                },
            ],
        },
    },
    'testimonials/v6': {
        content: {
            title: 'Proof that supports the promise',
            testimonials: [
                {
                    quote: 'The flow feels focused and clear.',
                    author: 'Jordan',
                    role: 'Strategist',
                },
            ],
        },
    },
    'contact/v1': {
        content: {
            title: 'Contact',
            showForm: true,
            phone: '+1 555 111 2222',
            email: 'hello@example.com',
        },
        styles: { showMap: false },
    },
    'footer/v1': {
        content: {
            copyrightText: '© 2026 Acme Studio.',
        },
    },
    'booking-widget/v1': {
        content: {
            title: 'Book Appointment',
            showDatePicker: false,
        },
    },
    'booking-widget/v2': {
        content: {
            title: 'Book Split',
            showDatePicker: false,
        },
    },
    'booking-widget/v3': {
        content: {
            title: 'Book Compact',
            showDatePicker: false,
        },
    },
    'pricing/v1': {
        content: {
            title: 'Pricing',
            tiers: [
                {
                    name: 'Starter',
                    price: '$19',
                    period: '/mo',
                    features: ['Feature A'],
                },
            ],
        },
    },
    'faq/v1': {
        content: {
            title: 'FAQ',
            items: [{ question: 'How does this work?', answer: 'It works well.' }],
        },
    },
    'faq/v5': {
        content: {
            title: 'Questions, answered clearly',
            faqs: [{ q: 'Can this be edited later?', a: 'Yes, from the builder.' }],
        },
    },
    'faq/v6': {
        content: {
            title: 'Handle the last objections before the CTA',
            faqs: [{ q: 'Can I replace the video?', a: 'Yes.' }],
        },
    },
    'team/v1': {
        content: {
            title: 'Team',
            members: [{ name: 'Alex', role: 'Founder' }],
        },
    },
    'team/v2': {
        content: {
            title: 'Team V2',
            teamMembers: [{ name: 'Jamie', role: 'Lead', bio: 'Builds reliable systems.' }],
        },
        styles: { showBio: true, padding: 'medium' },
    },
    'footer/v5': {
        content: {
            businessName: 'Signal Horizon',
            text: 'A polished free landing page theme.',
            copyrightText: 'Copyright 2026 Signal Horizon. All rights reserved.',
            columns: [
                {
                    title: 'Explore',
                    links: [{ label: 'Overview', href: '#hero' }],
                },
            ],
        },
    },
    'footer/v6': {
        content: {
            businessName: 'Velocity VSL',
            text: 'A direct-response VSL template.',
            ctaText: 'Go Back To The Offer',
            ctaLink: '#hero',
            links: [{ label: 'Watch', href: '#video' }],
        },
    },
};

export function buildFixtureForComponent(
    componentKey: string,
    overrides?: Partial<Pick<ThemeComponentProps, 'content' | 'styles' | 'tokens' | 'context' | 'isEditor'>>
): ThemeComponentProps {
    const fixture = SECTION_FIXTURES[componentKey] || { content: {}, styles: {} };

    return {
        content: {
            ...fixture.content,
            ...(overrides?.content || {}),
        },
        styles: {
            ...(fixture.styles || {}),
            ...(overrides?.styles || {}),
        },
        tokens: overrides?.tokens || TEST_TOKENS,
        context: overrides?.context || TEST_CONTEXT,
        isEditor: overrides?.isEditor,
    };
}
