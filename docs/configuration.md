---
title: Configuration
categories:
  - reference
tags:
  - site-config
  - github-pages
  - env-vars
readability: 78
fields: 9
related:
  - title: Getting Started
    url: /getting-started
  - title: Deployment
    url: /features/deployment
---

# Configuration

All site-level settings live in `site.config.js` at the project root.

## Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Site name — shown in the logo, footer, and page titles |
| `base_url` | string | Deployed domain, e.g. `https://user.github.io` |
| `base_path` | string | Subpath for GitHub Pages repos, e.g. `/repo-name` |
| `repo_url` | string | GitHub repo link shown as an icon in the header; leave empty to hide |
| `theme_toggle` | string | Where the light/dark toggle appears: `'navbar'` or `'sidebar'` |
| `feed` | boolean | Per-page continuation scroll — load the next page inline on scroll |
| `toc` | boolean | Right sidebar: "On This Page" section navigation (default `true`) |
| `meta_sidebar` | boolean | Right sidebar: tags, metrics, and related links below the TOC (default `true`) |
| `nav_order` | object | Explicit nav ordering per directory — see below |
| `content_style` | string | Phase 2 — semantic style hint, e.g. `technical` |
| `theme_mood` | string | Phase 2 — visual tone hint, e.g. `calm` |
| `logo_seed` | integer | Phase 2 — increment to regenerate the procedural logo |

Example:

```js
module.exports = {
  title: 'My Site',
  base_url: 'https://myuser.github.io',
  base_path: '/my-repo',
}
```

## Nav ordering

By default the pipeline sorts pages newest-first by `date`, or alphabetically.
Use `nav_order` to define explicit ordering at any directory level:

```js
nav_order: {
  // '' = source root; 'features' = the features/ subdirectory
  '': ['getting-started', 'configuration', 'features', 'posts'],
  'features': ['content-pipeline', 'metadata', 'deployment'],
},
```

Folders and pages can be mixed in the same list. Slugs not listed append alphabetically
after the explicit entries.

For individual pages without a full directory listing, add `order: N` to the page's
frontmatter instead — lower numbers appear first, pages without `order` sort after.

## GitHub Actions variables

The deployment workflow reads two optional repository variables.
Set them under **Settings → Secrets and variables → Actions → Variables**.

| Variable | Default | Description |
|----------|---------|-------------|
| `CONTENT_SOURCE` | `docs` | Path to content directory, relative to repo root |
| `BASE_PATH` | _(empty)_ | GitHub Pages base path, passed to Next.js at build time |

`BASE_PATH` is required whenever your site lives at a subpath (e.g. `username.github.io/repo-name`).
Leave it empty for root domain deployments.
