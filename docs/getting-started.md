---
title: Getting Started
categories:
  - guide
tags:
  - setup
  - npm
  - configuration
readability: 85
complexity: 2
related:
  - title: Configuration
    url: /configuration
  - title: Features
    url: /features
---

# Tutorial

## Prerequisites

- Node.js 18 or later
- npm (bundled with Node.js)
- A GitHub repository with Pages enabled

## Setup

**1. Install dependencies**

```bash
npm install
```

**2. Configure the site**

Edit `site.config.js`:

```js
module.exports = {
  title: 'My Site',
  base_url: 'https://username.github.io',
  base_path: '/repo-name',
}
```

**3. Organize your content**

Place markdown files in any directory. Subdirectories become URL segments.
A `home.md` or `index.md` at any level becomes that section's landing page.

```
source/
├── home.md
├── about.md
├── images/
└── posts/
    └── 2026/
        └── my-first-post.md
```

**4. Run setup**

```bash
npm run setup -- --source path/to/source
```

This ingests content, rewrites image paths, and generates navigation files.

**5. Preview locally**

```bash
npm run dev
```

## Frontmatter fields

Add these to the top of any markdown file to control how it is displayed:

```yaml
---
title: My Page
date: 2026-01-15
categories:
  - tutorial
tags:
  - markdown
---
```

| Field | Required | Notes |
|-------|----------|-------|
| `title` | recommended | Falls back to the file slug |
| `date` | optional | Enables date sorting and the post index |
| `categories` | optional | Rendered as blue chip pills |
| `tags` | optional | Rendered as gray chip pills |
| `reading_time` | auto | Injected by the pipeline — do not set manually |
