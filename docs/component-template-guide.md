# Component Template Creation Guide

This guide explains how to create new component-based templates (sections) for the Project Aurora. Components are the building blocks of pages in this system, allowing for a modular and flexible design.

---

## 🏗️ Architecture Overview

The CMS uses a **Theme Registry** system. Each component (e.g., Hero, About, Gallery) is a standalone React component that receives structured data (`content`), aesthetic settings (`styles`), and theme-wide variables (`tokens`).

- **Location**: All component templates are located in `packages/themes/src/components/`.
- **Versioning**: Each component type (like `hero`) can have multiple versions (`v1.tsx`, `v2.tsx`).

---

## 🚀 Step-by-Step: Creating a New Component

### 1. Create the Component File
Create a new directory for your component type (if it doesn't exist) and a version file.

**Example**: Creating `About` version `v3`.
- Path: `packages/themes/src/components/about/v3.tsx`

### 2. Define the Component Structure
Every component must follow the `ThemeComponentProps` interface.

```tsx
import React from 'react';
import type { ThemeComponentProps } from '../../types';

export default function MyNewComponent({ content, styles, tokens }: ThemeComponentProps) {
    // 1. Destructure content (from CMS editor)
    const title = content.title as string || 'Default Title';
    const description = content.description as string;
    const imageUrl = content.imageUrl as string;

    // 2. Destructure styles (aesthetic toggles)
    const padding = styles.padding as string || '40px';
    const darkTheme = styles.darkTheme as boolean;

    return (
        <section style={{ 
            padding: padding, 
            backgroundColor: darkTheme ? tokens.primary : tokens.background,
            color: darkTheme ? '#ffffff' : tokens.text,
            fontFamily: tokens.font 
        }}>
           <h2>{title}</h2>
           {description && <p>{description}</p>}
           {imageUrl && <img src={imageUrl} alt={title} />}
        </section>
    );
}
```

### 3. Register the Component
You must register your new component in the central registry so the CMS can recognize and use it.

1.  Open `packages/themes/src/registry.ts`.
2.  Import your new component.
3.  Add it to the `THEME_REGISTRY` object with a unique key.

```typescript
// packages/themes/src/registry.ts
import AboutV3 from './components/about/v3';

export const THEME_REGISTRY: Record<string, ThemeComponent> = {
    // ... existing components
    'about/v3': AboutV3,
};
```

---

## 🧩 Standard Sections to Include

When creating a comprehensive template, consider adding these common components:

| Component | Key Sections / Props |
| :--- | :--- |
| **Hero** | Title, Subtitle, CTA Button, Background Image, Overlay Opacity. |
| **About** | Header, Description, Image (Left/Right), Features List. |
| **Booking Widget** | Service Selection, Date Picker, Price Display. |
| **Services** | Grid of services, Icons, Descriptions. |
| **Gallery** | Image Grid, Lightbox capability, Filtering. |

---

## 💡 Best Practices

- **Use Tokens**: Always use `tokens` for colors and fonts to ensure consistency with the overall theme.
- **Default Values**: Always provide sensible fallbacks for `content` fields (e.g., `content.title || 'Default'`).
- **Responsive Design**: Use CSS clamps (e.g., `fontSize: 'clamp(24px, 4vw, 36px)'`) or media queries for responsiveness.
- **Micro-animations**: Use inline `onMouseEnter/Leave` or Framer Motion (if available) for premium feel interactions.

> [!TIP]
> Use the `isEditor` prop to disable interactive elements (like CTAs) when viewed inside the CMS Page Builder.
