import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getRegisteredKeys, getThemeComponent } from '@booking-engine/themes';
import { buildFixtureForComponent } from './fixtures/theme-component-fixtures';

describe('Theme component smoke checks', () => {
    it('renders every registered component key without crashing', () => {
        const keys = getRegisteredKeys();

        expect(keys.length).toBeGreaterThan(0);

        for (const key of keys) {
            const Component = getThemeComponent(key);
            expect(Component, `Missing component registration for ${key}`).not.toBeNull();

            const props = buildFixtureForComponent(key);
            const markup = renderToStaticMarkup(
                React.createElement(Component!, props)
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
});
