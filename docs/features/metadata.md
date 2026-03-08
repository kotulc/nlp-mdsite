---
title: Metadata Display
categories:
  - features
tags:
  - frontmatter
  - tags
  - reading-time
readability: 76
fields: 5
components: 5
related:
  - title: Getting Started
    url: /getting-started
  - title: Content Pipeline
    url: /features/content-pipeline
---

# Metadata Display

Metadata is surfaced automatically on every page — no MDX imports required.
All display is driven by frontmatter fields read by `theme.config.jsx`.

## Frontmatter schema

| Field | Type | Effect |
|-------|------|--------|
| `title` | string | Page title shown in heading and nav |
| `date` | YYYY-MM-DD | Formatted date below title; enables date-based sorting |
| `categories` | list | Blue chip pills below the title |
| `tags` | list | Gray chip pills below the title |
| `reading_time` | integer | Auto-injected by the pipeline; displays as "N min read" |

Example:

```yaml
---
title: My Post
date: 2026-01-15
categories:
  - tutorial
tags:
  - markdown
  - nextjs
---
```

## Components

**`PageHeader`** renders the formatted date and reading time on a single line,
separated by a center dot. Returns null when neither field is present.

**`TagList`** renders categories (blue) and tags (gray) as pill chips.
Both arrays are optional; the component returns null when both are empty.

**`PostIndex`** fetches `posts-index.json` at runtime and renders a listing of
all dated posts with title, date, reading time, and category chips. It is placed
on the auto-generated `posts/index.mdx` page whenever dated posts are found.

**`MetaSidebar`** renders a sticky right-hand sidebar with categories, tags, and
any numeric frontmatter fields as labelled metrics. It only appears when there is
content to show, and is hidden on screens narrower than 1024 px.

**`SiteFooter`** renders the page footer (copyright, build timestamp, credits).
Edit `components/SiteFooter.jsx` directly to customize the footer across all pages.

## Metrics

Any numeric frontmatter field not in the reserved set (`title`, `date`, `categories`,
`tags`, `reading_time`) is displayed in the sidebar as a metric with its score:

```yaml
---
title: My Analysis
readability: 72
sentiment: 0.85
complexity: 3
---
```

Field names use underscores which are replaced with spaces in the display
(e.g. `reading_ease` → "reading ease").

## Post index

Any source file with a `date` field that is not at the source root is included
in `public/posts-index.json`. The file is sorted newest-first and served as a
static asset, so the PostIndex component can fetch it client-side without any
server-side rendering.
