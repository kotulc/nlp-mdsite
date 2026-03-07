---
title: Configuration
---

# Configuration

All site-level settings live in `site.config.js` at the project root.

## Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Site name — shown in the logo, footer, and page titles |
| `base_url` | string | Deployed domain, e.g. `https://user.github.io` |
| `base_path` | string | Subpath for GitHub Pages repos, e.g. `/repo-name` |
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

## GitHub Actions variables

The deployment workflow reads two optional repository variables.
Set them under **Settings → Secrets and variables → Actions → Variables**.

| Variable | Default | Description |
|----------|---------|-------------|
| `CONTENT_SOURCE` | `docs` | Path to content directory, relative to repo root |
| `BASE_PATH` | _(empty)_ | GitHub Pages base path, passed to Next.js at build time |

`BASE_PATH` is required whenever your site lives at a subpath (e.g. `username.github.io/repo-name`).
Leave it empty for root domain deployments.
