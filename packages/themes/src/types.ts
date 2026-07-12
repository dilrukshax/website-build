export interface ThemeComponentProps {
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
    isEditor?: boolean;
    context?: {
        tenantId: string;
        instanceId: string;
        pageSlug?: string;
        subdomain?: string;
        blogPost?: any;
        dataMode?: 'live' | 'preview';
    };
}

export interface ThemeTemplate {
    id: string;
    name: string;
    description: string;
    tokens: {
        primary: string;
        secondary: string;
        accent: string;
        text: string;
        background: string;
        font: string;
    };
    layout: Record<string, string>; // Maps section names to component_keys (e.g., 'header': 'header/v1')
}
