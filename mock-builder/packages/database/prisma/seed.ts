import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================================
// System permissions (including website builder)
// ============================================================

const PERMISSIONS = [
    // Bookings
    { key: 'bookings.view', name: 'View Bookings', description: 'View booking list and details', module: 'bookings' },
    { key: 'bookings.create', name: 'Create Bookings', description: 'Create new bookings', module: 'bookings' },
    { key: 'bookings.update', name: 'Update Bookings', description: 'Update existing bookings', module: 'bookings' },
    { key: 'bookings.delete', name: 'Delete Bookings', description: 'Cancel or delete bookings', module: 'bookings' },
    { key: 'bookings.confirm', name: 'Confirm Bookings', description: 'Confirm pending bookings', module: 'bookings' },
    { key: 'bookings.complete', name: 'Complete Bookings', description: 'Mark bookings as completed', module: 'bookings' },

    // Services
    { key: 'services.view', name: 'View Services', description: 'View service catalogue', module: 'services' },
    { key: 'services.create', name: 'Create Services', description: 'Create new services', module: 'services' },
    { key: 'services.update', name: 'Update Services', description: 'Update existing services', module: 'services' },
    { key: 'services.delete', name: 'Delete Services', description: 'Deactivate or delete services', module: 'services' },

    // Customers
    { key: 'customers.view', name: 'View Customers', description: 'View customer list and details', module: 'customers' },
    { key: 'customers.create', name: 'Create Customers', description: 'Create new customers', module: 'customers' },
    { key: 'customers.update', name: 'Update Customers', description: 'Update customer details', module: 'customers' },
    { key: 'customers.delete', name: 'Delete Customers', description: 'Delete customers', module: 'customers' },
    { key: 'customers.search', name: 'Search Customers', description: 'Search customer database', module: 'customers' },

    // Inquiries
    { key: 'inquiries.view', name: 'View Inquiries', description: 'View inquiry list and details', module: 'inquiries' },
    { key: 'inquiries.update', name: 'Update Inquiries', description: 'Update inquiry details', module: 'inquiries' },
    { key: 'inquiries.delete', name: 'Delete Inquiries', description: 'Delete inquiries', module: 'inquiries' },
    { key: 'inquiries.update_status', name: 'Update Inquiry Status', description: 'Change inquiry status', module: 'inquiries' },

    // Settings
    { key: 'settings.view', name: 'View Settings', description: 'View tenant settings', module: 'settings' },
    { key: 'settings.update', name: 'Update Settings', description: 'Modify tenant settings', module: 'settings' },

    // Staff
    { key: 'staff.view', name: 'View Staff', description: 'View staff list and details', module: 'staff' },
    { key: 'staff.create', name: 'Create Staff', description: 'Invite or create staff users', module: 'staff' },
    { key: 'staff.update', name: 'Update Staff', description: 'Update staff roles and details', module: 'staff' },
    { key: 'staff.delete', name: 'Delete Staff', description: 'Remove staff from tenant', module: 'staff' },

    // Roles
    { key: 'roles.view', name: 'View Roles', description: 'View role list and details', module: 'roles' },
    { key: 'roles.create', name: 'Create Roles', description: 'Create custom roles', module: 'roles' },
    { key: 'roles.update', name: 'Update Roles', description: 'Update role permissions', module: 'roles' },
    { key: 'roles.delete', name: 'Delete Roles', description: 'Delete custom roles', module: 'roles' },

    // Website Builder
    { key: 'website.view', name: 'View Website Builder', description: 'Access website builder', module: 'website' },
    { key: 'website.edit', name: 'Edit Website', description: 'Edit website pages and sections', module: 'website' },
    { key: 'website.publish', name: 'Publish Website', description: 'Publish website to live', module: 'website' },
    { key: 'website.settings', name: 'Manage Website Settings', description: 'Manage website design settings', module: 'website' },
];

// ============================================================
// Industries
// ============================================================

const INDUSTRIES = [
    { name: 'Salon & Spa', slug: 'salon-spa', icon: 'scissors' },
    { name: 'Restaurant & Cafe', slug: 'restaurant-cafe', icon: 'utensils' },
    { name: 'Fitness & Gym', slug: 'fitness-gym', icon: 'dumbbell' },
    { name: 'Medical & Healthcare', slug: 'medical-healthcare', icon: 'heart-pulse' },
    { name: 'Education & Tutoring', slug: 'education-tutoring', icon: 'graduation-cap' },
    { name: 'Photography & Studio', slug: 'photography-studio', icon: 'camera' },
    { name: 'Consulting & Professional', slug: 'consulting-professional', icon: 'briefcase' },
    { name: 'Events & Entertainment', slug: 'events-entertainment', icon: 'party-popper' },
];

// ============================================================
// Features
// ============================================================

const FEATURES = [
    { name: 'Header', slug: 'header', description: 'Website header with navigation' },
    { name: 'Hero', slug: 'hero', description: 'Hero banner section' },
    { name: 'About', slug: 'about', description: 'About us section' },
    { name: 'Services', slug: 'services', description: 'Services listing section' },
    { name: 'Gallery', slug: 'gallery', description: 'Image gallery section' },
    { name: 'Testimonials', slug: 'testimonials', description: 'Customer testimonials section' },
    { name: 'Contact', slug: 'contact', description: 'Contact information and form' },
    { name: 'Footer', slug: 'footer', description: 'Website footer' },
    { name: 'Booking Widget', slug: 'booking-widget', description: 'Online booking widget' },
    { name: 'Pricing', slug: 'pricing', description: 'Pricing plans and tiers' },
    { name: 'FAQ', slug: 'faq', description: 'Frequently asked questions' },
    { name: 'Team', slug: 'team', description: 'Meet the team members' },
];

// All industries get all features
const INDUSTRY_FEATURE_MAPPING: Record<string, string[]> = {
    'salon-spa': ['header', 'hero', 'about', 'services', 'gallery', 'testimonials', 'contact', 'footer', 'booking-widget', 'pricing', 'team'],
    'restaurant-cafe': ['header', 'hero', 'about', 'services', 'gallery', 'testimonials', 'contact', 'footer', 'booking-widget', 'faq'],
    'fitness-gym': ['header', 'hero', 'about', 'services', 'gallery', 'testimonials', 'contact', 'footer', 'booking-widget', 'pricing', 'faq', 'team'],
    'medical-healthcare': ['header', 'hero', 'about', 'services', 'testimonials', 'contact', 'footer', 'booking-widget', 'faq', 'team'],
    'education-tutoring': ['header', 'hero', 'about', 'services', 'testimonials', 'contact', 'footer', 'booking-widget', 'pricing', 'faq', 'team'],
    'photography-studio': ['header', 'hero', 'about', 'services', 'gallery', 'testimonials', 'contact', 'footer', 'booking-widget', 'pricing', 'faq'],
    'consulting-professional': ['header', 'hero', 'about', 'services', 'testimonials', 'contact', 'footer', 'booking-widget', 'pricing', 'faq', 'team'],
    'events-entertainment': ['header', 'hero', 'about', 'services', 'gallery', 'testimonials', 'contact', 'footer', 'booking-widget', 'pricing', 'faq'],
};

// ============================================================
// Themes (one v1 theme per feature)
// ============================================================

const THEMES = [
    {
        featureSlug: 'header',
        name: 'Classic Header',
        slug: 'header',
        version: 1,
        componentKey: 'header/v1',
        schemaJsonb: {
            type: 'object',
            properties: {
                logoUrl: { type: 'string', title: 'Logo URL' },
                logoAlt: { type: 'string', title: 'Logo Alt Text' },
                menu: {
                    type: 'array', title: 'Navigation Menu',
                    items: {
                        type: 'object',
                                properties: {
                            label: { type: 'string', title: 'Label' },
                            href: { type: 'string', title: 'Link', format: 'page-link' },
                        },
                        required: ['label', 'href'],
                    },
                },
            },
        },
        defaultStylesJsonb: { sticky: true, transparent: false },
    },
    {
        featureSlug: 'hero',
        name: 'Hero Banner',
        slug: 'hero',
        version: 1,
        componentKey: 'hero/v1',
        schemaJsonb: {
            type: 'object',
            properties: {
                title: { type: 'string', title: 'Title' },
                subtitle: { type: 'string', title: 'Subtitle' },
                ctaText: { type: 'string', title: 'Button Text' },
                ctaLink: { type: 'string', title: 'Button Link', format: 'page-link' },
                backgroundImage: { type: 'string', title: 'Background Image URL' },
            },
            required: ['title'],
        },
        defaultStylesJsonb: { fullHeight: true, overlay: true, overlayOpacity: 0.5 },
    },
    {
        featureSlug: 'hero',
        name: 'Split Layout Hero',
        slug: 'hero',
        version: 2,
        componentKey: 'hero/v2',
        schemaJsonb: {
            type: 'object',
            properties: {
                title: { type: 'string', title: 'Title' },
                subtitle: { type: 'string', title: 'Subtitle', format: 'textarea' },
                ctaTextPrimary: { type: 'string', title: 'Primary Button Text' },
                ctaLinkPrimary: { type: 'string', title: 'Primary Button Link', format: 'page-link' },
                ctaTextSecondary: { type: 'string', title: 'Secondary Button Text' },
                ctaLinkSecondary: { type: 'string', title: 'Secondary Button Link', format: 'page-link' },
                imageUrl: { type: 'string', title: 'Side Image URL' },
                imageAlt: { type: 'string', title: 'Image Alt Text' },
            },
            required: ['title'],
        },
        defaultStylesJsonb: { layout: 'image-right', padding: 'large' },
    },
    {
        featureSlug: 'about',
        name: 'About Section',
        slug: 'about',
        version: 1,
        componentKey: 'about/v1',
        schemaJsonb: {
            type: 'object',
            properties: {
                title: { type: 'string', title: 'Title' },
                body: { type: 'string', title: 'Body Text', format: 'textarea' },
                imageUrl: { type: 'string', title: 'Image URL' },
                imageAlt: { type: 'string', title: 'Image Alt Text' },
                ctaText: { type: 'string', title: 'Button Text (Optional)' },
                ctaLink: { type: 'string', title: 'Button Link', format: 'page-link' },
            },
            required: ['title', 'body'],
        },
        defaultStylesJsonb: { imagePosition: 'right', padding: 'large' },
    },
    {
        featureSlug: 'about',
        name: 'About with Stats',
        slug: 'about',
        version: 2,
        componentKey: 'about/v2',
        schemaJsonb: {
            type: 'object',
            properties: {
                title: { type: 'string', title: 'Title' },
                body: { type: 'string', title: 'Body Text', format: 'textarea' },
                ctaText: { type: 'string', title: 'Button Text (Optional)' },
                ctaLink: { type: 'string', title: 'Button Link', format: 'page-link' },
                statsTitle: { type: 'string', title: 'Statistics Title (Optional)' },
                statistics: {
                    type: 'array', title: 'Statistics Grid',
                    items: {
                        type: 'object',
                        properties: {
                            value: { type: 'string', title: 'Value (e.g. 500+)' },
                            label: { type: 'string', title: 'Label' },
                        },
                        required: ['value', 'label'],
                    },
                },
            },
            required: ['title', 'body'],
        },
        defaultStylesJsonb: { backgroundColor: '#ffffff' },
    },
    {
        featureSlug: 'services',
        name: 'Services List',
        slug: 'services',
        version: 1,
        componentKey: 'services/v1',
        schemaJsonb: {
            type: 'object',
            properties: {
                title: { type: 'string', title: 'Section Title' },
                subtitle: { type: 'string', title: 'Subtitle' },
                ctaText: { type: 'string', title: 'Button Text (Optional)' },
                ctaLink: { type: 'string', title: 'Button Link', format: 'page-link' },
                services: {
                    type: 'array', title: 'Services',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', title: 'Service Name' },
                            description: { type: 'string', title: 'Description' },
                            price: { type: 'string', title: 'Price' },
                            duration: { type: 'string', title: 'Duration' },
                            imageUrl: { type: 'string', title: 'Image URL' },
                        },
                        required: ['name'],
                    },
                },
            },
            required: ['title'],
        },
        defaultStylesJsonb: { columns: 3, showPrice: true, showDuration: true },
    },
    {
        featureSlug: 'gallery',
        name: 'Image Gallery',
        slug: 'gallery',
        version: 1,
        componentKey: 'gallery/v1',
        schemaJsonb: {
            type: 'object',
            properties: {
                title: { type: 'string', title: 'Section Title' },
                images: {
                    type: 'array', title: 'Images',
                    items: {
                        type: 'object',
                        properties: {
                            url: { type: 'string', title: 'Image URL' },
                            alt: { type: 'string', title: 'Alt Text' },
                            caption: { type: 'string', title: 'Caption' },
                        },
                        required: ['url'],
                    },
                },
            },
        },
        defaultStylesJsonb: { columns: 3, gap: 'medium', lightbox: true },
    },
    {
        featureSlug: 'testimonials',
        name: 'Testimonials',
        slug: 'testimonials',
        version: 1,
        componentKey: 'testimonials/v1',
        schemaJsonb: {
            type: 'object',
            properties: {
                title: { type: 'string', title: 'Section Title' },
                testimonials: {
                    type: 'array', title: 'Testimonials',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', title: 'Client Name' },
                            role: { type: 'string', title: 'Client Role/Title' },
                            text: { type: 'string', title: 'Testimonial Text' },
                            avatarUrl: { type: 'string', title: 'Avatar URL' },
                            rating: { type: 'number', title: 'Rating (1-5)', minimum: 1, maximum: 5 },
                        },
                        required: ['name', 'text'],
                    },
                },
            },
        },
        defaultStylesJsonb: { layout: 'carousel', showRating: true },
    },
    {
        featureSlug: 'contact',
        name: 'Contact Section',
        slug: 'contact',
        version: 1,
        componentKey: 'contact/v1',
        schemaJsonb: {
            type: 'object',
            properties: {
                title: { type: 'string', title: 'Section Title' },
                subtitle: { type: 'string', title: 'Subtitle' },
                address: { type: 'string', title: 'Address' },
                phone: { type: 'string', title: 'Phone' },
                email: { type: 'string', title: 'Email' },
                showForm: { type: 'boolean', title: 'Show Contact Form' },
                mapEmbedUrl: { type: 'string', title: 'Google Maps Embed URL' },
                ctaText: { type: 'string', title: 'Button Text (Optional)' },
                ctaLink: { type: 'string', title: 'Button Link', format: 'page-link' },
            },
        },
        defaultStylesJsonb: { showMap: true, formPosition: 'right' },
    },
    {
        featureSlug: 'footer',
        name: 'Classic Footer',
        slug: 'footer',
        version: 1,
        componentKey: 'footer/v1',
        schemaJsonb: {
            type: 'object',
            properties: {
                copyrightText: { type: 'string', title: 'Copyright Text' },
                columns: {
                    type: 'array', title: 'Footer Columns',
                    items: {
                        type: 'object',
                        properties: {
                            title: { type: 'string', title: 'Column Title' },
                            links: {
                                type: 'array', title: 'Links',
                                items: {
                                    type: 'object',
                                    properties: {
                                        label: { type: 'string', title: 'Label' },
                                        href: { type: 'string', title: 'URL' },
                                    },
                                    required: ['label', 'href'],
                                },
                            },
                        },
                    },
                },
                social: {
                    type: 'array', title: 'Social Links',
                    items: {
                        type: 'object',
                        properties: {
                            platform: { type: 'string', title: 'Platform' },
                            url: { type: 'string', title: 'URL' },
                        },
                        required: ['platform', 'url'],
                    },
                },
            },
        },
        defaultStylesJsonb: { columns: 3, showSocial: true },
    },
    {
        featureSlug: 'booking-widget',
        name: 'Booking Widget',
        slug: 'booking-widget',
        version: 1,
        componentKey: 'booking-widget/v1',
        schemaJsonb: {
            type: 'object',
            properties: {
                title: { type: 'string', title: 'Section Title' },
                subtitle: { type: 'string', title: 'Subtitle' },
                showServices: { type: 'boolean', title: 'Show Service Selector' },
                showDatePicker: { type: 'boolean', title: 'Show Date Picker' },
            },
        },
        defaultStylesJsonb: { layout: 'inline', showServices: true, showDatePicker: true },
    },
    {
        featureSlug: 'pricing',
        name: 'Pricing Plans',
        slug: 'pricing',
        version: 1,
        componentKey: 'pricing/v1',
        schemaJsonb: {
            type: 'object',
            properties: {
                title: { type: 'string', title: 'Section Title' },
                subtitle: { type: 'string', title: 'Subtitle' },
                tiers: {
                    type: 'array', title: 'Pricing Tiers',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', title: 'Plan Name' },
                            price: { type: 'string', title: 'Price' },
                            period: { type: 'string', title: 'Billing Period' },
                            description: { type: 'string', title: 'Description' },
                            features: { type: 'array', title: 'Features', items: { type: 'string' } },
                            ctaText: { type: 'string', title: 'Button Text' },
                            ctaLink: { type: 'string', title: 'Button Link', format: 'page-link' },
                            highlighted: { type: 'boolean', title: 'Highlight Plan' },
                        },
                        required: ['name', 'price'],
                    },
                },
            },
        },
        defaultStylesJsonb: { layout: 'grid', columns: 3 },
    },
    {
        featureSlug: 'faq',
        name: 'FAQ Accordion',
        slug: 'faq',
        version: 1,
        componentKey: 'faq/v1',
        schemaJsonb: {
            type: 'object',
            properties: {
                title: { type: 'string', title: 'Section Title' },
                subtitle: { type: 'string', title: 'Subtitle' },
                items: {
                    type: 'array', title: 'Questions & Answers',
                    items: {
                        type: 'object',
                        properties: {
                            question: { type: 'string', title: 'Question' },
                            answer: { type: 'string', format: 'textarea', title: 'Answer' },
                        },
                        required: ['question', 'answer'],
                    },
                },
            },
        },
        defaultStylesJsonb: { layout: 'accordion' },
    },
    {
        featureSlug: 'team',
        name: 'Meet the Team',
        slug: 'team',
        version: 1,
        componentKey: 'team/v1',
        schemaJsonb: {
            type: 'object',
            properties: {
                title: { type: 'string', title: 'Section Title' },
                subtitle: { type: 'string', title: 'Subtitle' },
                members: {
                    type: 'array', title: 'Team Members',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', title: 'Name' },
                            role: { type: 'string', title: 'Role/Title' },
                            bio: { type: 'string', format: 'textarea', title: 'Bio' },
                            photoUrl: { type: 'string', title: 'Photo URL' },
                        },
                        required: ['name', 'role'],
                    },
                },
            },
        },
        defaultStylesJsonb: { layout: 'grid' },
    },
];

// ============================================================
// Predefined Page Templates
// ============================================================

const PAGE_TEMPLATES = [
    {
        name: 'Classic Homepage',
        description: 'A standard homepage with hero banner, about us, services, and footer.',
        previewImageUrl: 'https://placehold.co/600x400?text=Classic+Homepage',
        sectionsJsonb: [
            { themeComponentKey: 'header/v1', defaultContent: { "logoUrl": "", "menu": [{"href":"/","label":"Home"}] }, defaultStyles: {} },
            { themeComponentKey: 'hero/v1', defaultContent: { "title": "Welcome to our Business", "subtitle": "Book your appointment today", "ctaText": "Book Now", "ctaLink": "/booking" }, defaultStyles: {} },
            { themeComponentKey: 'about/v1', defaultContent: { "title": "About Us", "body": "We are dedicated to providing the best service in town." }, defaultStyles: {} },
            { themeComponentKey: 'services/v1', defaultContent: { "title": "Our Services" }, defaultStyles: {} },
            { themeComponentKey: 'footer/v1', defaultContent: { "copyrightText": "© 2026 Your Business. All rights reserved." }, defaultStyles: {} }
        ],
        isActive: true,
    },
    {
        name: 'Landing Page',
        description: 'A focused landing page to capture leads and drive bookings.',
        previewImageUrl: 'https://placehold.co/600x400?text=Landing+Page',
        sectionsJsonb: [
            { themeComponentKey: 'hero/v1', defaultContent: { "title": "Special Offer", "subtitle": "Get 20% off your first visit", "ctaText": "Claim Offer", "ctaLink": "#book" }, defaultStyles: {} },
            { themeComponentKey: 'testimonials/v1', defaultContent: { "title": "What Our Clients Say" }, defaultStyles: {} },
            { themeComponentKey: 'booking-widget/v1', defaultContent: { "title": "Book Your Appointment" }, defaultStyles: {} },
            { themeComponentKey: 'footer/v1', defaultContent: { "copyrightText": "© 2026 Your Business." }, defaultStyles: {} }
        ],
        isActive: true,
    },
    {
        name: 'Salon Homepage',
        description: 'A full-featured homepage for salons and spas.',
        previewImageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600&h=400',
        sectionsJsonb: [
            { themeComponentKey: 'header/v1',       defaultContent: { logoUrl: '', menu: [{ label: 'Home', href: '/' }, { label: 'Services', href: '/services' }, { label: 'Team', href: '/team' }] }, defaultStyles: {} },
            { themeComponentKey: 'hero/v1',         defaultContent: { title: 'Your Beauty, Our Passion', subtitle: 'Experience the ultimate relaxation and style.', ctaText: 'Book Now', ctaLink: '#booking' }, defaultStyles: {} },
            { themeComponentKey: 'about/v1',        defaultContent: { title: 'Welcome to Our Salon', body: 'We pride ourselves on delivering top-notch beauty and wellness services.' }, defaultStyles: {} },
            { themeComponentKey: 'services/v1',     defaultContent: { title: 'Our Services', subtitle: 'Hair, Skin & Nails' }, defaultStyles: {} },
            { themeComponentKey: 'gallery/v1',      defaultContent: { title: 'Our Work' }, defaultStyles: {} },
            { themeComponentKey: 'pricing/v1',      defaultContent: { title: 'Pricing Packages' }, defaultStyles: {} },
            { themeComponentKey: 'team/v1',         defaultContent: { title: 'Meet Our Stylists' }, defaultStyles: {} },
            { themeComponentKey: 'booking-widget/v1', defaultContent: { title: 'Book an Appointment' }, defaultStyles: {} },
            { themeComponentKey: 'footer/v1',       defaultContent: { copyrightText: '© 2026 Your Salon. All Rights Reserved.' }, defaultStyles: {} },
        ],
        isActive: true,
    },
    {
        name: 'Gym & Fitness',
        description: 'High-energy template for gyms, trainers, and fitness studios.',
        previewImageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=600&h=400',
        sectionsJsonb: [
            { themeComponentKey: 'header/v1',       defaultContent: { logoUrl: '', menu: [{ label: 'Home', href: '/' }, { label: 'Classes', href: '/classes' }, { label: 'Pricing', href: '/pricing' }] }, defaultStyles: {} },
            { themeComponentKey: 'hero/v1',         defaultContent: { title: 'Transform Your Body', subtitle: 'Join the best fitness community in town.', ctaText: 'Start Free Trial', ctaLink: '#pricing' }, defaultStyles: {} },
            { themeComponentKey: 'about/v1',        defaultContent: { title: 'Why Choose Us', body: 'State-of-the-art equipment and expert trainers to help you reach your goals.' }, defaultStyles: {} },
            { themeComponentKey: 'services/v1',     defaultContent: { title: 'Our Classes' }, defaultStyles: {} },
            { themeComponentKey: 'pricing/v1',      defaultContent: { title: 'Membership Plans' }, defaultStyles: {} },
            { themeComponentKey: 'team/v1',         defaultContent: { title: 'Expert Trainers' }, defaultStyles: {} },
            { themeComponentKey: 'testimonials/v1', defaultContent: { title: 'Success Stories' }, defaultStyles: {} },
            { themeComponentKey: 'booking-widget/v1', defaultContent: { title: 'Book a Class or Tour' }, defaultStyles: {} },
            { themeComponentKey: 'footer/v1',       defaultContent: { copyrightText: '© 2026 Elite Fitness.' }, defaultStyles: {} },
        ],
        isActive: true,
    },
    {
        name: 'Medical Clinic',
        description: 'Professional and trustworthy layout for healthcare providers.',
        previewImageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600&h=400',
        sectionsJsonb: [
            { themeComponentKey: 'header/v1',       defaultContent: { logoUrl: '', menu: [{ label: 'Home', href: '/' }, { label: 'Services', href: '/services' }, { label: 'Patient Info', href: '/info' }] }, defaultStyles: {} },
            { themeComponentKey: 'hero/v1',         defaultContent: { title: 'Compassionate Care', subtitle: 'Putting your health and well-being first.', ctaText: 'Schedule Visit', ctaLink: '#booking' }, defaultStyles: {} },
            { themeComponentKey: 'services/v1',     defaultContent: { title: 'Specialties & Treatments' }, defaultStyles: {} },
            { themeComponentKey: 'team/v1',         defaultContent: { title: 'Our Medical Team', subtitle: 'Experienced specialists dedicated to you.' }, defaultStyles: {} },
            { themeComponentKey: 'faq/v1',          defaultContent: { title: 'Patient FAQ' }, defaultStyles: {} },
            { themeComponentKey: 'booking-widget/v1', defaultContent: { title: 'Request an Appointment' }, defaultStyles: {} },
            { themeComponentKey: 'contact/v1',      defaultContent: { title: 'Clinic Location & Hours' }, defaultStyles: {} },
            { themeComponentKey: 'footer/v1',       defaultContent: { copyrightText: '© 2026 City Health Clinic.' }, defaultStyles: {} },
        ],
        isActive: true,
    },
    {
        name: 'Consulting Pro',
        description: 'Polished design for business consultants and professional services.',
        previewImageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=600&h=400',
        sectionsJsonb: [
            { themeComponentKey: 'header/v1',       defaultContent: { logoUrl: '', menu: [{ label: 'Home', href: '/' }, { label: 'Expertise', href: '/expertise' }, { label: 'Contact', href: '/contact' }] }, defaultStyles: {} },
            { themeComponentKey: 'hero/v1',         defaultContent: { title: 'Strategic Growth For Your Business', subtitle: 'Data-driven solutions and expert advice.', ctaText: 'Get Consultation', ctaLink: '#booking' }, defaultStyles: {} },
            { themeComponentKey: 'about/v1',        defaultContent: { title: 'Our Approach', body: 'We partner with leaders to tackle their most important challenges.' }, defaultStyles: {} },
            { themeComponentKey: 'services/v1',     defaultContent: { title: 'Areas of Expertise' }, defaultStyles: {} },
            { themeComponentKey: 'testimonials/v1', defaultContent: { title: 'Client Success' }, defaultStyles: {} },
            { themeComponentKey: 'pricing/v1',      defaultContent: { title: 'Engagement Models' }, defaultStyles: {} },
            { themeComponentKey: 'booking-widget/v1', defaultContent: { title: 'Schedule a Discovery Call' }, defaultStyles: {} },
            { themeComponentKey: 'footer/v1',       defaultContent: { copyrightText: '© 2026 Strategy Partners LLC.' }, defaultStyles: {} },
        ],
        isActive: true,
    },
    {
        name: 'Restaurant / Cafe',
        description: 'Appetizing layout with menus, gallery, and reservations.',
        previewImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400',
        sectionsJsonb: [
            { themeComponentKey: 'header/v1',       defaultContent: { logoUrl: '', menu: [{ label: 'Home', href: '/' }, { label: 'Menu', href: '/menu' }, { label: 'Reservations', href: '/reservations' }] }, defaultStyles: {} },
            { themeComponentKey: 'hero/v1',         defaultContent: { title: 'A Taste of Perfection', subtitle: 'Locally sourced ingredients, globally inspired flavors.', ctaText: 'Reserve a Table', ctaLink: '#booking' }, defaultStyles: {} },
            { themeComponentKey: 'about/v1',        defaultContent: { title: 'Our Story', body: 'Founded in 2010 with a passion for great food and community.' }, defaultStyles: {} },
            { themeComponentKey: 'services/v1',     defaultContent: { title: 'Featured Menu' }, defaultStyles: {} },
            { themeComponentKey: 'gallery/v1',      defaultContent: { title: 'Atmosphere & Dishes' }, defaultStyles: {} },
            { themeComponentKey: 'testimonials/v1', defaultContent: { title: 'Reviews' }, defaultStyles: {} },
            { themeComponentKey: 'booking-widget/v1', defaultContent: { title: 'Table Reservations' }, defaultStyles: {} },
            { themeComponentKey: 'contact/v1',      defaultContent: { title: 'Find Us' }, defaultStyles: {} },
            { themeComponentKey: 'footer/v1',       defaultContent: { copyrightText: '© 2026 Grand Restaurant.' }, defaultStyles: {} },
        ],
        isActive: true,
    }
];

async function main() {
    console.log('Seeding permissions...');

    for (const perm of PERMISSIONS) {
        await prisma.permission.upsert({
            where: { key: perm.key },
            update: { name: perm.name, description: perm.description, module: perm.module },
            create: perm,
        });
    }

    console.log(`Seeded ${PERMISSIONS.length} permissions successfully.`);

    // Seed default super admin user
    console.log('Seeding super admin user...');

    const passwordHash = await bcrypt.hash('Admin@123', 12);

    await prisma.user.upsert({
        where: { email: 'admin@buildmyonlineweb.site' },
        update: { isSuperAdmin: true },
        create: {
            email: 'admin@buildmyonlineweb.site',
            passwordHash,
            fullName: 'Super Admin',
            isSuperAdmin: true,
        },
    });

    console.log('Super admin user seeded: admin@buildmyonlineweb.site / Admin@123');

    // Seed industries
    console.log('Seeding industries...');
    const industryMap = new Map<string, string>();
    for (const ind of INDUSTRIES) {
        const industry = await prisma.industry.upsert({
            where: { slug: ind.slug },
            update: { name: ind.name, icon: ind.icon },
            create: ind,
        });
        industryMap.set(ind.slug, industry.id);
    }
    console.log(`Seeded ${INDUSTRIES.length} industries.`);

    // Seed features
    console.log('Seeding features...');
    const featureMap = new Map<string, string>();
    for (const feat of FEATURES) {
        const feature = await prisma.feature.upsert({
            where: { slug: feat.slug },
            update: { name: feat.name, description: feat.description },
            create: feat,
        });
        featureMap.set(feat.slug, feature.id);
    }
    console.log(`Seeded ${FEATURES.length} features.`);

    // Seed industry-feature mappings
    console.log('Seeding industry-feature mappings...');
    let mappingCount = 0;
    for (const [industrySlug, featureSlugs] of Object.entries(INDUSTRY_FEATURE_MAPPING)) {
        const industryId = industryMap.get(industrySlug);
        if (!industryId) continue;

        for (const featureSlug of featureSlugs) {
            const featureId = featureMap.get(featureSlug);
            if (!featureId) continue;

            await prisma.industryFeature.upsert({
                where: { industryId_featureId: { industryId, featureId } },
                update: {},
                create: { industryId, featureId },
            });
            mappingCount++;
        }
    }
    console.log(`Seeded ${mappingCount} industry-feature mappings.`);

    // Seed themes
    console.log('Seeding themes...');
    for (const theme of THEMES) {
        const featureId = featureMap.get(theme.featureSlug);
        if (!featureId) {
            console.warn(`Feature ${theme.featureSlug} not found, skipping theme ${theme.name}`);
            continue;
        }

        await prisma.theme.upsert({
            where: { slug_version: { slug: theme.slug, version: theme.version } },
            update: {
                name: theme.name,
                componentKey: theme.componentKey,
                schemaJsonb: theme.schemaJsonb,
                defaultStylesJsonb: theme.defaultStylesJsonb,
            },
            create: {
                featureId,
                name: theme.name,
                slug: theme.slug,
                version: theme.version,
                componentKey: theme.componentKey,
                schemaJsonb: theme.schemaJsonb,
                defaultStylesJsonb: theme.defaultStylesJsonb,
            },
        });
    }
    console.log(`Seeded ${THEMES.length} themes.`);

    // Seed Page Templates
    console.log('Seeding page templates...');
    for (const template of PAGE_TEMPLATES) {
        await prisma.pageTemplate.create({
            data: {
                name: template.name,
                description: template.description,
                previewImageUrl: template.previewImageUrl,
                sectionsJsonb: template.sectionsJsonb,
                isActive: template.isActive
            }
        });
    }
    console.log(`Seeded ${PAGE_TEMPLATES.length} page templates.`);

    console.log('\nAll seeds completed successfully!');
}

main()
    .catch((e) => {
        console.error('Seed failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
