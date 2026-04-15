import { describe, expect, it } from 'vitest';
import { resolveHostedFontRequest } from '../hosted-font-utils';

describe('hosted font utilities', () => {
    it('resolves Google font request for supported hosted fonts', () => {
        const resolved = resolveHostedFontRequest('Roboto');
        expect(resolved).not.toBeNull();
        expect(resolved?.family).toBe('Roboto');
        expect(resolved?.href).toContain('fonts.googleapis.com/css2?family=Roboto');
    });

    it('extracts primary family and ignores fallback declarations', () => {
        const resolved = resolveHostedFontRequest('"Open Sans", sans-serif');
        expect(resolved).not.toBeNull();
        expect(resolved?.family).toBe('Open Sans');
        expect(resolved?.href).toContain('family=Open+Sans');
    });

    it('does not request local or generic fonts', () => {
        expect(resolveHostedFontRequest('Arial')).toBeNull();
        expect(resolveHostedFontRequest('sans-serif')).toBeNull();
    });

    it('rejects invalid family names', () => {
        expect(resolveHostedFontRequest('<script>alert(1)</script>')).toBeNull();
    });
});

