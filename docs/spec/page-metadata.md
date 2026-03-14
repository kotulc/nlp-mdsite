---
title: Page Metadata
categories:
  - spec
---

# Page Metadata

Two components render per-page metadata immediately below the page title:
`PageHeader` shows publication date and estimated reading time; `TagList` renders
categories and tags as pill chips. Both are injected by `theme.config.jsx`'s `main`
wrapper via the `PageMeta` helper, which reads from Nextra's `useConfig().frontMatter`.

## Requirements

1. REQ-1: `PageHeader` renders a formatted date when `date` frontmatter is present
2. REQ-2: `PageHeader` renders reading time in minutes when `reading_time` frontmatter is present
3. REQ-3: A separator `·` appears only when both date and reading_time are present
4. REQ-4: `PageHeader` returns nothing when neither date nor reading_time is provided
5. REQ-5: `TagList` renders categories with `chip-category` class and tags with `chip-tag` class
6. REQ-6: `TagList` returns nothing when both categories and tags are empty
7. REQ-7: `reading_time` is estimated by the ingest pipeline (words / 200, minimum 1 minute) and injected into each page's frontmatter automatically — authors do not set it manually

## Test Cases

`tests/components/PageHeader.test.jsx`

- `test_page_header_renders_date_and_reading_time` — both date and reading time shown with separator (REQ-1, REQ-2, REQ-3)
- `test_page_header_renders_date_only` — date shown without separator or reading time (REQ-1, REQ-3)
- `test_page_header_returns_null_without_props` — empty when neither prop provided (REQ-4)

`tests/components/TagList.test.jsx`

- `test_tag_list_renders_categories_and_tags` — all chips rendered (REQ-5)
- `test_tag_list_category_chip_class` — correct CSS classes on category vs tag chips (REQ-5)
- `test_tag_list_returns_null_when_empty` — empty when no categories or tags (REQ-6)
- `test_tag_list_handles_categories_only` — renders correctly with categories alone (REQ-5)
