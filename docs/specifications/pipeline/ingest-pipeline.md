---
title: Ingest Pipeline
categories:
  - spec
---

# Ingest Pipeline

The ingest pipeline (`scripts/ingest.js`) mirrors a source directory of markdown files
into the Next.js `pages/` tree, generating all navigation data needed by the site.

## Requirements

1. REQ-1: `.md` files are renamed to `.mdx`; `home.md` and `index.md` become `index.mdx`
2. REQ-2: If no `index.mdx` exists in a directory, one is auto-generated as a redirect to the first sorted page
3. REQ-3: Sort order: `nav_order[dir]` slug array pins listed slugs first in declared order; remaining pages auto-sort newest-first if any have a `date` field, alphabetically otherwise; undated pages always sort alphabetically after dated pages
4. REQ-4: The `index` slug is always placed first in a directory listing
5. REQ-5: `public/posts-index.json` is written for all pages with a `date` field, sorted newest-first
6. REQ-6: Top-level imports and leading H1 are stripped from extracted content; imports inside code fences are preserved

## Test Cases

`tests/build/ingest.test.js`

- `test_sort_alpha_no_dates` — pages without dates sort alphabetically (REQ-3)
- `test_sort_index_always_first` — index slug precedes all others (REQ-4)
- `test_sort_dated_newest_first` — dated pages auto-sort newest-first when any date present (REQ-3)
- `test_sort_dated_tiebreak_alpha` — equal dates break alphabetically (REQ-3)
- `test_sort_undated_after_dated` — undated pages sort alphabetically after all dated pages (REQ-3)
- `test_sort_array_pins_listed_slugs_first` — slug array pins listed pages in declared order (REQ-3)
- `test_sort_array_unlisted_auto_chrono` — unlisted slugs with dates auto-sort chronologically (REQ-3)
- `test_auto_index_creates_redirect` — creates `index.mdx` when none exists (REQ-2)
- `test_auto_index_targets_first_sorted_page` — redirect points to first sorted page (REQ-2)
- `test_auto_index_marks_auto_redirect` — generated index has `auto_redirect: true` (REQ-2)
- `test_auto_index_skips_if_index_exists` — does not overwrite existing `index.mdx` (REQ-2)
- `test_auto_index_no_op_when_no_leaf_pages` — no-ops when no `.mdx` files found (REQ-2)
- `test_extract_strips_frontmatter` — frontmatter block removed from content (REQ-6)
- `test_extract_strips_leading_h1` — leading H1 removed (REQ-6)
- `test_extract_strips_top_level_imports` — top-level imports removed (REQ-6)
- `test_extract_preserves_imports_in_code_fences` — imports inside fences preserved (REQ-6)
- `test_extract_preserves_full_code_block` — full code block content unchanged (REQ-6)
- `test_pages_updates_meta_follows_nav_order` — updates directory follows array nav_order with auto-sort (REQ-3)
- `test_pages_features_meta_follows_nav_order` — features directory follows slug array nav_order (REQ-3)
