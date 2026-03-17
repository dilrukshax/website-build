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
});
