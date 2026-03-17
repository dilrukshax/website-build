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
    context?: { tenantId: string; instanceId: string };
}
