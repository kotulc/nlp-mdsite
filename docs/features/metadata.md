---
title: Metadata Display
categories:
  - features
tags:
  - frontmatter
  - tags
  - reading-time
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

## Post index

Any source file with a `date` field that is not at the source root is included
in `public/posts-index.json`. The file is sorted newest-first and served as a
static asset, so the PostIndex component can fetch it client-side without any
server-side rendering.
