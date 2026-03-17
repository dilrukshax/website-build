import React from 'react';

// Direct imports for simplicity (lazy loading can be added later for production)
import HeaderV1 from './components/header/v1';
import HeroV1 from './components/hero/v1';
import HeroV2 from './components/hero/v2';
import AboutV1 from './components/about/v1';
import AboutV2 from './components/about/v2';
import ServicesV1 from './components/services/v1';
import GalleryV1 from './components/gallery/v1';
import TestimonialsV1 from './components/testimonials/v1';
import ContactV1 from './components/contact/v1';
import FooterV1 from './components/footer/v1';
import BookingWidgetV1 from './components/booking-widget/v1';
import PricingV1 from './components/pricing/v1';
import FAQv1 from './components/faq/v1';
import TeamV1 from './components/team/v1';
import type { ThemeComponentProps } from './types';

type ThemeComponent = React.ComponentType<ThemeComponentProps>;

/**
 * Theme Component Registry
 * Maps component_key (from DB themes table) to React component.
 */
export const THEME_REGISTRY: Record<string, ThemeComponent> = {
    'header/v1': HeaderV1,
    'hero/v1': HeroV1,
    'hero/v2': HeroV2,
    'about/v1': AboutV1,
    'about/v2': AboutV2,
    'services/v1': ServicesV1,
    'gallery/v1': GalleryV1,
    'testimonials/v1': TestimonialsV1,
    'contact/v1': ContactV1,
    'footer/v1': FooterV1,
    'booking-widget/v1': BookingWidgetV1,
    'pricing/v1': PricingV1,
    'faq/v1': FAQv1,
    'team/v1': TeamV1,
};

/**
 * Get a theme component by its component_key.
 * Returns null if not found.
 */
export function getThemeComponent(componentKey: string): ThemeComponent | null {
    return THEME_REGISTRY[componentKey] || null;
}

/**
 * Get all registered component keys.
 */
export function getRegisteredKeys(): string[] {
    return Object.keys(THEME_REGISTRY);
}
