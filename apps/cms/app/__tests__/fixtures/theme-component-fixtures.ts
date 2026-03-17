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
    'team/v1': {
        content: {
            title: 'Team',
            members: [{ name: 'Alex', role: 'Founder' }],
        },
    },
    'team/v2': {
        content: {
            title: 'Team V2',
            members: [{ name: 'Jamie', role: 'Lead', bio: 'Builds reliable systems.' }],
        },
        styles: { showBio: true, padding: 'medium' },
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
