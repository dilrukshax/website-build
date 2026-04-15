'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { formatServiceDuration, formatServicePrice, rememberSelectedService, usePublicServices } from '../shared/public-web';

type DisplayService = {
    id?: string;
    title: string;
    description: string;
    priceText?: string;
    durationText?: string;
    badge?: string;
};

function normalizeFallback(content: Record<string, unknown>): DisplayService[] {
    const fromContent = Array.isArray(content.items)
        ? content.items
            .map((item) => {
                if (!item || typeof item !== 'object') return null;
                const record = item as Record<string, unknown>;
                const title = typeof record.title === 'string' ? record.title.trim() : '';
                const description = typeof record.description === 'string' ? record.description.trim() : '';
                const badge = typeof record.badge === 'string' ? record.badge.trim() : '';
                return title && description ? ({ title, description, badge: badge || undefined } as DisplayService) : null;
            })
            .filter((item): item is DisplayService => item !== null)
        : [];

    if (fromContent.length > 0) return fromContent;

    return [
        { title: 'Lead Capture Funnel', description: 'Capture, qualify, and route inquiries in one flow.', badge: 'Acquisition' },
        { title: 'Automation Setup', description: 'Email and reminder sequences tuned for bookings.', badge: 'Retention' },
        { title: 'Conversion UX', description: 'Page-level optimization for higher completion rates.', badge: 'Optimization' },
    ];
}

export default function ServicesV11({ content, tokens, context }: ThemeComponentProps) {
    const title = (content.title as string) || 'Services';
    const subtitle = (content.subtitle as string) || 'Fusion Growth v11';
    const showAllServices = (content.showAllServices as boolean) !== false;
    const showSelectButton = (content.showSelectButton as boolean) !== false;
    const featuredCountRaw = Number(content.featuredCount ?? 6);
    const featuredCount = Number.isFinite(featuredCountRaw) && featuredCountRaw > 0 ? Math.floor(featuredCountRaw) : 6;
    const selectButtonText = (content.selectButtonText as string) || 'Select Service';

    const fallbackServices = normalizeFallback(content as Record<string, unknown>);
    const { services } = usePublicServices(context);

    const dynamicServices: DisplayService[] = services.map((service) => ({
        id: service.id,
        title: service.name,
        description: service.description?.trim() || 'Service details available on request.',
        priceText: formatServicePrice(service.price, service.currency),
        durationText: formatServiceDuration(service.duration),
        badge: 'Service',
    }));

    const source = dynamicServices.length > 0 ? dynamicServices : fallbackServices;
    const visible = showAllServices ? source : source.slice(0, featuredCount);

    const sectionBg = tokens.background;
    const titleColor = '#0f172a';
    const muted = '#475569';
    const card = '#ffffff';
    const border = '1px solid #e2e8f0';

    return (
        <section id="services" style={{ background: sectionBg, padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}><h2 style={{ margin: 0, color: titleColor }}>{title}</h2><div style={{ marginTop: '10px', display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>{visible.map((item, i) => <article key={item.id || i} style={{ border, background: card, borderRadius: '12px', padding: '10px' }}><p style={{ margin: 0, color: tokens.primary, fontSize: '12px', fontWeight: 800 }}>Service {i + 1}</p><h3 style={{ margin: '6px 0 0 0', color: titleColor }}>{item.title}</h3><p style={{ margin: '6px 0 0 0', color: muted }}>{item.description}</p></article>)}</div></div>
        </section>
    );
}
