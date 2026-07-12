import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getRegisteredKeys, getThemeComponent } from '@project-aurora/themes';
import { buildFixtureForComponent } from './fixtures/theme-component-fixtures';

describe('Theme component smoke checks', () => {
    it('renders every registered component key without crashing', async () => {
        const keys = getRegisteredKeys();

        expect(keys.length).toBeGreaterThan(0);

        for (const key of keys) {
            const Component = getThemeComponent(key) as any;
            expect(Component, `Missing component registration for ${key}`).not.toBeNull();

            let RealComponent = Component;
            if (Component && typeof Component === 'object' && '_payload' in Component) {
                const loader = Component._payload._result || Component._payload._ctor;
                if (typeof loader === 'function') {
                    const module = await loader();
                    RealComponent = module.default;
                }
            }

            const props = buildFixtureForComponent(key);
            const markup = renderToStaticMarkup(
                React.createElement(RealComponent, props)
            );

            expect(markup.trim().length, `Empty markup for ${key}`).toBeGreaterThan(0);
        }
    });

    it('resolves normalized and aliased versioned keys', () => {
        const variants = [' Product / V6 ', 'products/v6', 'PRODUCT/V999', 'product／v5', 'product/v5\u200b', 'product/v9'];

        for (const key of variants) {
            const Component = getThemeComponent(key);
            expect(Component, `Failed to resolve variant key: ${key}`).not.toBeNull();
        }
    });

    it('includes blog section registry coverage', () => {
        expect(getThemeComponent('blog/v1')).not.toBeNull();
        expect(getThemeComponent('blog/v2')).not.toBeNull();
        expect(getThemeComponent('blog/v3')).not.toBeNull();
        expect(getThemeComponent('blog/v15')).not.toBeNull();
        expect(getThemeComponent('blog-post-detail/v2')).not.toBeNull();
    });
});
