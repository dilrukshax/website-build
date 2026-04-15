import { formatServicePrice, type PublicProduct } from '../shared/public-web';

export interface DisplayProduct {
    id?: string;
    title: string;
    desc: string;
    imageUrl?: string;
    priceText?: string;
    badge?: string;
}

function readText(record: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
        const value = record[key];
        if (typeof value === 'string' && value.trim().length > 0) {
            return value.trim();
        }
    }
    return '';
}

function readNumber(record: Record<string, unknown>, keys: string[]): number | null {
    for (const key of keys) {
        const value = record[key];
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }
        if (typeof value === 'string' && value.trim().length > 0) {
            const parsed = Number(value);
            if (Number.isFinite(parsed)) {
                return parsed;
            }
        }
    }
    return null;
}

export function normalizeFallbackProducts(content: Record<string, unknown>, defaults: DisplayProduct[]): DisplayProduct[] {
    const rawItems = Array.isArray(content.productsList)
        ? content.productsList
        : Array.isArray(content.items)
            ? content.items
            : [];

    const fromContent = rawItems
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const record = item as Record<string, unknown>;
            const title = readText(record, ['title', 'name']);
            const desc = readText(record, ['desc', 'description']);
            const imageUrl = readText(record, ['imageUrl', 'image', 'thumbnail']);
            const badge = readText(record, ['badge', 'eyebrow', 'tag']);
            const priceRaw = readNumber(record, ['price']);
            const currency = readText(record, ['currency']) || 'USD';

            if (!title) {
                return null;
            }

            return {
                title,
                desc: desc || 'Product details available on request.',
                imageUrl: imageUrl || undefined,
                badge: badge || undefined,
                priceText: priceRaw !== null ? formatServicePrice(priceRaw, currency) : undefined,
            } as DisplayProduct;
        })
        .filter((item): item is DisplayProduct => item !== null);

    if (fromContent.length > 0) {
        return fromContent;
    }

    return defaults;
}

export function mapDynamicProducts(products: PublicProduct[], showPrice: boolean): DisplayProduct[] {
    return products.map((product) => ({
        id: product.id,
        title: product.name,
        desc: product.description?.trim() || 'Product details available on request.',
        imageUrl: product.imageUrl || undefined,
        priceText: showPrice ? formatServicePrice(product.price, product.currency) : undefined,
    }));
}

export function resolveVisibleProducts(input: {
    content: Record<string, unknown>;
    dynamicProducts: DisplayProduct[];
    fallbackProducts: DisplayProduct[];
    defaultFeaturedCount: number;
}): DisplayProduct[] {
    const showAllProducts = (input.content.showAllProducts as boolean) ?? (input.content.showAllServices as boolean) ?? true;
    const featuredCountRaw = Number(input.content.featuredCount ?? input.defaultFeaturedCount);
    const featuredCount = Number.isFinite(featuredCountRaw) && featuredCountRaw > 0
        ? Math.floor(featuredCountRaw)
        : input.defaultFeaturedCount;

    const sourceProducts = input.dynamicProducts.length > 0
        ? input.dynamicProducts
        : input.fallbackProducts;

    return showAllProducts ? sourceProducts : sourceProducts.slice(0, featuredCount);
}
