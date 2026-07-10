import type { ThemeComponentProps } from '@project-aurora/themes';

export const TEST_TOKENS: ThemeComponentProps['tokens'] = {
    primary: '#2563eb',
    secondary: '#0f766e',
    accent: '#f59e0b',
    text: '#0f172a',
    background: '#ffffff',
    font: 'Roboto, sans-serif',
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
    'header/v13': {
        content: {
            brandName: 'Acquisition Press',
            menu: [{ label: 'Shop', href: '#offers' }],
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
    'hero/v13': {
        content: {
            eyebrow: 'World-record business education',
            title: 'Build a storefront page that feels like a best-selling product launch.',
            subtitle: 'A clean editorial layout for books and flagship offers.',
            primaryCtaText: 'Get The Book',
            primaryCtaLink: '#offers',
            secondaryCtaText: 'See Reviews',
            secondaryCtaLink: '#reviews',
        },
    },
    'about/v13': {
        content: {
            title: 'Built like an authority storefront.',
            body: 'A founder-proof block with image and measurable outcomes.',
            stats: [{ value: '5M+', label: 'Audience reached' }],
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
    'services/v13': {
        content: {
            title: 'A numbered teaching block that reads like a premium table of contents.',
            subtitle: 'Educational breakdown with chapter-style cards.',
            items: [
                {
                    title: 'Start here',
                    description: 'Introduce the promise and frame what the reader gets.',
                },
            ],
        },
    },
    'product/v13': {
        content: {
            title: 'Storefront product grid',
            subtitle: 'Three clean buying paths.',
            items: [
                {
                    title: 'Demand Blueprint',
                    subtitle: 'Hardcover Edition',
                    price: '$29.99',
                    ctaText: 'Get The Book',
                    ctaLink: '#top',
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
    'testimonials/v13': {
        content: {
            title: 'Dense proof blocks that feel editorial.',
            testimonials: [
                {
                    quote: 'This reads like a premium product page instead of a generic marketing theme.',
                    author: 'Liam Hart',
                    role: 'Verified Customer',
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
    'faq/v13': {
        content: {
            title: 'Frequently asked questions',
            faqs: [{ q: 'Can I edit this later?', a: 'Yes, in the builder.' }],
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
    'blog/v1': {
        content: {
            title: 'Latest Posts',
            subtitle: 'Fresh updates from the team.',
            showAllPosts: false,
            featuredCount: 2,
            postsList: [
                {
                    title: 'Fixture post',
                    slug: 'fixture-post',
                    excerpt: 'Fixture excerpt',
                },
            ],
        },
    },
    'header/v15': {
        content: {
            businessName: 'train of thought',
            menu: [{ label: 'Blog', href: '/blog' }],
            ctaText: 'Subscribe',
            ctaLink: '/blog',
        },
    },
    'hero/v15': {
        content: {
            title: 'Train of Thought',
            subtitle: 'A personal space for observations, stories, and slow ideas.',
            ctaText: 'Read the Blog',
            ctaLink: '/blog',
        },
    },
    'blog/v15': {
        content: {
            title: 'latest posts',
            subtitle: 'Stories, notes, and ideas from the journal.',
            showAllPosts: false,
            featuredCount: 2,
            ctaText: 'View all posts',
            ctaLink: '/blog',
            postsList: [
                {
                    title: 'Fixture editorial post',
                    slug: 'fixture-editorial-post',
                    excerpt: 'Fixture excerpt',
                    category: 'Journal',
                },
            ],
        },
    },
    'about/v15': {
        content: {
            title: 'about this journal',
            body: 'Fixture body for editorial about section.',
        },
    },
    'contact/v15': {
        content: {
            title: 'stay in touch',
            subtitle: 'Send a short message.',
            email: 'hello@example.com',
            phone: '+1 555 111 2222',
            ctaText: 'Send Message',
        },
    },
    'footer/v15': {
        content: {
            businessName: 'train of thought',
            text: 'Notes on writing, work, and everyday life.',
            copyrightText: '© 2026 train of thought',
            links: [{ label: 'Blog', href: '/blog' }],
        },
    },
    'blog-post-detail/v2': {
        content: {},
        styles: {
            backgroundColor: '#f7f6f3',
            textColor: '#1b1b1b',
        },
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
    'footer/v13': {
        content: {
            brandName: 'Acquisition Press',
            heading: 'A footer that closes like a premium catalog page.',
            body: 'Editorial brand summary and two series cards.',
            ctaText: 'Read The Series',
            ctaLink: '#offers',
            cards: [
                {
                    title: 'Offer Architecture',
                    subtitle: 'Structure a product so the buying decision feels obvious.',
                    ctaText: 'Buy The Book',
                    ctaLink: '#offers',
                },
            ],
        },
    },
    'logos/v13': {
        content: {
            highlights: [{ label: 'Sold over 800,000+ copies worldwide' }, { label: 'Rated 4.9 / 5 by readers' }],
        },
    },
    'team/v13': {
        content: {
            title: 'Three audience cards',
            cards: [
                {
                    title: 'For operators',
                    headline: 'Fast-track the buying story',
                    description: 'Package a flagship offer into a clear visual buying flow.',
                },
            ],
        },
    },
    'header/v14': {
        content: {
            menu: [{ label: 'Shop', href: '#offers' }],
            currencyLabel: 'USD',
            cartCount: '0',
        },
    },
    'hero/v14': {
        content: {
            title: 'World-Record Breaking - $100M Money Models',
            primaryCtaText: 'Get $100M Money Models',
            primaryCtaLink: '#offers',
        },
    },
    'testimonials/v14': {
        content: {
            variant: 'cards',
            title: 'WHAT ENTREPRENEURS Say about $100m LEADS',
            testimonials: [
                {
                    imageUrl: 'https://shop.acquisition.com/cdn/shop/files/81rIBlL_TWL_400x400a25b.jpg?v=1696404122',
                    quote: 'This book is an absolute masterclass in how to get leads.',
                    author: 'Lance Watson',
                    role: 'Verified Customer',
                },
            ],
        },
    },
    'about/v14': {
        content: {
            variant: 'promo',
            title: 'Read these 273-pages if you want 2x, 5x or 100x your leads within the next 12 months',
            body: 'Use the tactics in this book and you’ll force leads to find you.',
            ctaText: 'DISCOVER $100m leads',
            ctaLink: '#offers',
        },
    },
    'product/v14': {
        content: {
            variant: 'packs',
            title: 'LEArn how to GET STRANGERS to BUY YOUR STUFF',
            items: [
                {
                    title: '$100M Leads Hardcover Edition (Single)',
                    description: '$29.99',
                    price: '$29.99',
                    ctaText: 'GET THE BOOK',
                    ctaLink: '#top',
                },
            ],
        },
    },
    'services/v14': {
        content: {
            title: 'What $100m leads will teach you',
            items: [
                {
                    number: '1',
                    title: 'Start here',
                    description: 'A numbered playbook card.',
                },
            ],
        },
    },
    'team/v14': {
        content: {
            title: 'PERFECT FOR business owners, New entrepreneurs & marketeers',
            cards: [
                {
                    title: 'For business owners',
                    description: 'Fast-track success with proven lead-gen playbooks.',
                },
            ],
        },
    },
    'contact/v14': {
        content: {
            title: 'keep updated with new free value pieces and book releases',
            subtitle: 'Sign up to our monthly newsletter.',
            buttonText: 'Sign up',
        },
    },
    'footer/v14': {
        content: {
            helpText: "Questions? We're here to help!",
            helpEmail: 'support@acquisition.com',
            copyrightText: 'Copyright 2026 Acquisition.com',
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
