import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SectionRenderer } from '../../components/builder/section-renderer';
import { TEST_CONTEXT, TEST_TOKENS, buildFixtureForComponent } from './fixtures/theme-component-fixtures';

function renderSection(
    componentKey: string,
    overrides?: {
        content?: Record<string, unknown>;
        styles?: Record<string, unknown>;
        isEditor?: boolean;
    }
): string {
    const fixture = buildFixtureForComponent(componentKey, overrides);

    return renderToStaticMarkup(
        React.createElement(SectionRenderer, {
            componentKey,
            content: fixture.content,
            styles: fixture.styles,
            tokens: TEST_TOKENS,
            context: TEST_CONTEXT,
            isEditor: overrides?.isEditor,
            features: {},
        })
    );
}

describe('SectionRenderer integration', () => {
    it('renders a known component key', () => {
        const html = renderSection('hero/v1', {
            content: {
                title: 'Known Hero',
                subtitle: 'Integration baseline',
            },
        });

        expect(html).toContain('Known Hero');
        expect(html).not.toContain('Unknown component');
    });

    it('renders fallback for unknown component keys', () => {
        const html = renderSection('unknown/v999');

        expect(html).toContain('Unknown component: unknown/v999');
    });

    it('normalizes product key variants before resolving', () => {
        const html = renderSection(' Products / V6 ', {
            content: {
                title: 'Normalized Product Theme',
                subtitle: 'Normalization coverage',
            },
        });

        expect(html).toContain('Normalized Product Theme');
        expect(html).not.toContain('Unknown component');
    });

    it('resolves unicode-slash and zero-width product keys', () => {
        const html = renderSection('product／v5\u200b', {
            content: {
                title: 'Unicode Product Theme',
            },
        });

        expect(html).toContain('Unicode Product Theme');
        expect(html).not.toContain('Unknown component');
    });

    it('falls back to latest registered feature version when requested version is unknown', () => {
        const html = renderSection('product/v999', {
            content: {
                title: 'Fallback Product Theme',
            },
        });

        expect(html).toContain('Fallback Product Theme');
        expect(html).not.toContain('Unknown component');
    });

    it('renders representative lane keys for v1, v6, and v12 without unknown fallback', () => {
        const v1 = renderSection('about/v1', {
            content: { title: 'Lane V1', body: 'Baseline lane.' },
        });
        const v6 = renderSection('services/v6', {
            content: { title: 'Lane V6' },
        });
        const v12 = renderSection('footer/v12', {
            content: { businessName: 'Lane V12' },
        });

        expect(v1).toContain('Lane V1');
        expect(v6).toContain('Lane V6');
        expect(v12).toContain('Lane V12');
        expect(v1).not.toContain('Unknown component');
        expect(v6).not.toContain('Unknown component');
        expect(v12).not.toContain('Unknown component');
    });

    it('renders team/v2 in public mode', () => {
        const html = renderSection('team/v2', {
            content: {
                title: 'Team Public',
                subtitle: 'Public mode render',
                teamMembers: [
                    {
                        name: 'Ava Quinn',
                        role: 'Creative Lead',
                        image: 'https://example.com/ava.jpg',
                    },
                ],
            },
            styles: {
                showBio: true,
            },
        });

        expect(html).toContain('Team Public');
        expect(html).toContain('Ava Quinn');
        expect(html).toContain('Creative Lead');
    });

    it('renders team/v2 in editor mode', () => {
        const html = renderSection('team/v2', {
            isEditor: true,
            content: {
                title: 'Team Editor',
                teamMembers: [
                    {
                        name: 'Liam Stone',
                        role: 'Operations',
                        image: 'https://example.com/liam.jpg',
                    },
                ],
            },
        });

        expect(html).toContain('Team Editor');
        expect(html).toContain('Liam Stone');
    });

    it('applies explicit section background and text overrides', () => {
        const html = renderSection('hero/v1', {
            styles: {
                sectionBackgroundColor: '#0b1121',
                sectionTextColor: '#f8fafc',
            },
        });

        expect(html).toContain('background-color:#0b1121');
        expect(html).toContain('color:#f8fafc');
    });

    it('uses auto contrast text when only background override is set', () => {
        const html = renderSection('hero/v1', {
            styles: {
                sectionBackgroundColor: '#0b1121',
            },
        });

        expect(html).toContain('color:#f8fafc');
    });
});
