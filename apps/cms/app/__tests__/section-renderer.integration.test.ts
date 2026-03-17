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

    it('renders team/v2 in public mode', () => {
        const html = renderSection('team/v2', {
            content: {
                title: 'Team Public',
                subtitle: 'Public mode render',
                members: [
                    {
                        name: 'Ava Quinn',
                        role: 'Creative Lead',
                        bio: 'Guides execution quality.',
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
                members: [
                    {
                        name: 'Liam Stone',
                        role: 'Operations',
                        bio: 'Maintains delivery momentum.',
                    },
                ],
            },
        });

        expect(html).toContain('Team Editor');
        expect(html).toContain('Liam Stone');
    });
});
