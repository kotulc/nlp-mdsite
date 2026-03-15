---
title: Content Pipeline
categories:
  - features
tags:
  - ingest
  - images
  - routing
readability: 72
steps: 8
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
   If no index file exists at a level, the first sorted page is used automatically
   (a transparent redirect is generated so the directory URL resolves correctly).

2. **Copies images** — an `images/` folder next to any `.md` files is copied to
   `public/images/<relative-path>/`.

3. **Rewrites image refs** — `](images/photo.jpg)` becomes `](/images/rel/path/photo.jpg)`
   so images resolve correctly from any URL depth.

4. **Strips corrupt EXIF** — JPEG files with broken EXIF segments are cleaned
   automatically (`scripts/fix-exif.js`).

5. **Injects reading time** — word count ÷ 200, minimum 1 minute, written into
   the page's frontmatter as `reading_time`.

6. **Ensures h1 heading** — if the copied page body has no `# Heading`, one is prepended
   using the frontmatter `title` (falling back to the file slug). This is required because
   page metadata (date, reading time, category and tag chips) is injected immediately after
   the h1 via a component override — without a heading they would not render.

7. **Generates `_meta.json`** — navigation ordering at every directory level.
   Sort order:
   - `nav_order` array in `site.config.js` pins listed pages first in declared order
   - Remaining pages: newest-first if any have a `date` field, alphabetical otherwise

8. **Flattens directories** — directories listed in `site.config.js` `flatten` field
   are rendered as a single scrolling inline feed instead of individual navigable pages.
   A `public/dir-feeds/<name>.json` file is written with each page's full content,
   and the directory's `index.mdx` uses the `DirFeed` component to render them inline.
   Individual page URLs remain deep-linkable; non-index entries are hidden from the sidebar.

## Source layout rules

- Any folder structure is valid — depth is unlimited; no index page is required
- `home.md` or `index.md` at any level → that section's landing page
- No index file → first sorted page at that level becomes the landing page
- `images/` next to `.md` files → copied and path-rewritten automatically
- Root-level pages with `date` fields are treated as site pages, not blog posts
