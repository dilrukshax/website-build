'use client';

import React, { Suspense } from 'react';
import { getThemeComponent } from '@booking-engine/themes';

interface SDUICondition {
    op: 'equals' | 'notEquals' | 'exists' | 'notExists' | 'gt' | 'lt';
    path: string;
    value?: unknown;
}

/**
 * Resolve a dot-path like "features.booking" against a context object.
 */
function resolvePath(obj: Record<string, unknown>, path: string): unknown {
    const segments = path.split('.');
    let current: unknown = obj;
    for (const seg of segments) {
        if (current === null || current === undefined || typeof current !== 'object') return undefined;
        current = (current as Record<string, unknown>)[seg];
    }
    return current;
}

/**
 * Evaluate SDUI conditions (AND logic). True if all pass or array is empty/null.
 */
function evaluateConditions(conditions: SDUICondition[] | null | undefined, context: Record<string, unknown>): boolean {
    if (!conditions || conditions.length === 0) return true;
    return conditions.every((c) => {
        const resolved = resolvePath(context, c.path);
        switch (c.op) {
            case 'exists': return resolved !== undefined && resolved !== null;
            case 'notExists': return resolved === undefined || resolved === null;
            case 'equals': return resolved === c.value;
            case 'notEquals': return resolved !== c.value;
            case 'gt': return typeof resolved === 'number' && typeof c.value === 'number' && resolved > c.value;
            case 'lt': return typeof resolved === 'number' && typeof c.value === 'number' && resolved < c.value;
            default: return true;
        }
    });
}

interface SectionRendererProps {
    componentKey: string;
    content: Record<string, unknown>;
    styles: Record<string, unknown>;
    tokens: {
        primary: string;
        secondary: string;
        accent: string;
        text: string;
        background: string;
        font: string;
    };
    conditions?: SDUICondition[] | null;
    features?: Record<string, boolean>;
    isEditor?: boolean;
    context?: { tenantId: string; instanceId: string; pageSlug?: string };
}

export function SectionRenderer({ componentKey, content, styles, tokens, conditions, features, isEditor, context: rContext }: SectionRendererProps) {
    // In editor mode, always render (show everything). In preview/public, evaluate conditions.
    if (!isEditor && conditions && conditions.length > 0) {
        const context: Record<string, unknown> = {
            tokens,
            features: features || {},
            props: content,
        };
        if (!evaluateConditions(conditions, context)) {
            return null;
        }
    }

    const Component = getThemeComponent(componentKey);

    if (!Component) {
        return (
            <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '8px' }}>
                Unknown component: {componentKey}
            </div>
        );
    }

    const contentNode = <Component content={content} styles={styles} tokens={tokens} isEditor={isEditor} context={rContext} />;

    return (
        <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>}>
            {isEditor ? (
                <div
                    style={{ display: 'contents' }}
                    onClick={(e) => {
                        if ((e.target as HTMLElement).closest('a')) {
                            e.preventDefault();
                        }
                    }}
                >
                    {contentNode}
                </div>
            ) : contentNode}
        </Suspense>
    );
}
