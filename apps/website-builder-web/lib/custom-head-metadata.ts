import type { Metadata } from 'next';
import { htmlToDOM } from 'html-react-parser';
import type { DOMNode } from 'html-react-parser';
import { normalizeCustomHtmlFragment } from './custom-html';

type MetadataOther = NonNullable<Metadata['other']>;
type MetadataOtherValue = string | number | Array<string | number>;

function appendMetadataOtherValue(other: MetadataOther, key: string, value: string): boolean {
    const existing = other[key] as MetadataOtherValue | undefined;
    if (Array.isArray(existing)) {
        other[key] = [...existing, value];
        return true;
    }

    if (existing !== undefined) {
        other[key] = [existing, value];
        return true;
    }

    other[key] = value;
    return true;
}

function collectNamedMetaTags(nodes: DOMNode[], other: MetadataOther): boolean {
    let added = false;

    for (const node of nodes) {
        if ('type' in node && node.type === 'tag' && 'name' in node && 'attribs' in node) {
            if (node.name.toLowerCase() === 'meta') {
                const name = node.attribs.name?.trim();
                const content = node.attribs.content?.trim();
                if (name && content) {
                    added = appendMetadataOtherValue(other, name, content) || added;
                }
            }

            if ('children' in node && Array.isArray(node.children)) {
                added = collectNamedMetaTags(node.children as DOMNode[], other) || added;
            }
        }
    }

    return added;
}

export function applyCustomHeadMetadata(metadata: Metadata, customHeadHtml: string | null | undefined): Metadata {
    const normalized = normalizeCustomHtmlFragment(customHeadHtml, 'head');
    if (!normalized) {
        return metadata;
    }

    const other: MetadataOther = { ...(metadata.other || {}) };
    const added = collectNamedMetaTags(htmlToDOM(normalized), other);

    if (!added) {
        return metadata;
    }

    return {
        ...metadata,
        other,
    };
}
