---
title: Content Pipeline
categories:
  - features
tags:
  - ingest
  - images
  - routing
readability: 72
steps: 7
related:
  - title: Metadata Display
    url: /features/metadata
  - title: Getting Started
    url: /getting-started
---

# Content Pipeline

The content pipeline (`scripts/ingest.js`) mirrors a markdown source tree into
the Next.js `pages/` directory. Run it directly:

    npm run ingest -- path/to/source

Or use the setup command, which also validates your environment:

    npm run setup -- --source path/to/source

## What the pipeline does

1. **Converts `.md` → `.mdx`** — any file named `home.md` or `index.md` becomes
   `index.mdx` (the section's landing page). All other files keep their slug.

2. **Copies images** — an `images/` folder next to any `.md` files is copied to
   `public/images/<relative-path>/`.

3. **Rewrites image refs** — `](images/photo.jpg)` becomes `](/images/rel/path/photo.jpg)`
   so images resolve correctly from any URL depth.

4. **Strips corrupt EXIF** — JPEG files with broken EXIF segments are cleaned
   automatically (`scripts/fix-exif.js`).

5. **Injects reading time** — word count ÷ 200, minimum 1 minute, written into
   the page's frontmatter as `reading_time`.

6. **Generates `_meta.json`** — navigation ordering at every directory level.
   Pages with dates are sorted newest-first. Directories of 4-digit year slugs
   (e.g. `2020/`, `2023/`) are sorted descending. All others are alphabetical.

7. **Writes `posts-index.json`** — all dated pages that are not at the source root
   are collected into `public/posts-index.json`, sorted newest-first. This powers
   the PostIndex component on the auto-generated `/posts` page.

## Source layout rules

- Any folder structure is valid — depth is unlimited
- `home.md` or `index.md` at any level → that section's landing page
- Root-level `home.md` → the site home page at `/`
- `images/` next to `.md` files → copied and path-rewritten automatically
- Root-level pages with `date` fields are treated as site pages, not blog posts
