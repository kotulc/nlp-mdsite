---
title: Styling
categories:
  - features
tags:
  - css
  - theming
  - nextra
components: 2
related:
  - title: Features Overview
    url: /features
  - title: Metadata Display
    url: /features/metadata
  - title: Configuration
    url: /configuration
---

# Styling

Custom styles are written in plain CSS. No Tailwind configuration is needed —
Nextra uses Tailwind internally with its own prefix, so adding Tailwind to the
project would create conflicts.

## Where styles live

| File | Purpose |
|------|---------|
| `styles/global.css` | All custom CSS for this project |
| `_app.jsx` | Root-level Next.js app wrapper; imports `global.css` |
| `pages/_app.jsx` | Auto-copied from `_app.jsx` by `ingest.js` on each run |

`_app.jsx` at the project root is the canonical source. The ingest pipeline
copies it into `pages/` automatically, so edits to `_app.jsx` are preserved
across ingest runs. Do not edit `pages/_app.jsx` directly.

## Nextra's CSS variables

Nextra exposes a set of CSS custom properties you can reference in your styles
to stay in sync with the active light/dark theme:

```css
/* Gray scale */
--nextra-colors-gray-100   /* very light background tint */
--nextra-colors-gray-200   /* borders and dividers */
--nextra-colors-gray-400   /* disabled / placeholder */
--nextra-colors-gray-500   /* secondary text */
--nextra-colors-gray-600   /* body text */
--nextra-colors-gray-900   /* headings */

/* Primary accent (blue by default) */
--nextra-colors-primary-100  /* light accent background */
--nextra-colors-primary-600  /* link color */
--nextra-colors-primary-700  /* link hover */

/* Layout */
--nextra-navbar-height: 4rem
```

Use these variables in `global.css` instead of hardcoding colors so that
light and dark mode both work automatically:

```css
/* Good — adapts to theme */
.my-element { color: var(--nextra-colors-gray-600, #4b5563); }

/* Avoid — breaks dark mode */
.my-element { color: #4b5563; }
```

The fallback value (after the comma) is used by browsers that don't support the
variable. Set it to the light-mode value.

## Nextra's internal Tailwind

Nextra bundles Tailwind and applies it with an `nx-` prefix on its own elements
(e.g. `nx-text-gray-500`, `nx-flex`). These are Nextra-internal and should not
be added to your own components. To override Nextra element styles, target the
semantic class names Nextra exposes instead:

```css
/* Nextra's search input */
.nextra-search input { border-radius: 0.5rem; }

/* Nextra's sidebar */
.nextra-sidebar { font-size: 0.875rem; }

/* Nextra's content wrapper */
.nextra-content { max-width: 52rem; }
```

Inspect the rendered HTML with browser DevTools to find the correct selector.
Prefer scoped overrides over broad element resets to avoid breaking Nextra's
built-in styles.

## Adding custom styles

1. Open `styles/global.css` and add your CSS at the end.
2. Use `--nextra-colors-*` variables for any color that should adapt to dark mode.
3. Restart the dev server (`npm run dev`) if a newly added class does not apply —
   Next.js hot-reloads JS but occasionally misses CSS-only changes.

## Page layout structure

The page layout is set in `theme.config.jsx` via the `main` key. The current
structure places a right-hand metadata sidebar alongside the page content:

```
.page-layout   (flex row)
├── .page-content   (flex: 1, main article)
└── .meta-sidebar   (180 px, sticky, hidden < 1024 px)
```

The sidebar is populated by `MetaSidebar.jsx` using frontmatter fields. It
renders nothing when no metadata is present.

## Chip pills

Categories and tags render as pill chips. Two style variants are provided:

| Class | Color | Used for |
|-------|-------|---------|
| `.chip.chip-category` | Blue (primary) | `categories:` frontmatter list |
| `.chip.chip-tag` | Gray | `tags:` frontmatter list |

To change chip appearance, edit the `.chip`, `.chip-category`, and `.chip-tag`
rules in `styles/global.css`.
