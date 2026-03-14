---
title: Ingest Pipeline
categories:
  - spec
---

# Ingest Pipeline

The ingest pipeline (`scripts/ingest.js`) mirrors a source directory of markdown files
into the Next.js `pages/` tree, generating all navigation and feed data needed by the site.

## Requirements

1. REQ-1: `.md` files are renamed to `.mdx`; `home.md` and `index.md` become `index.mdx`
2. REQ-2: If no `index.mdx` exists in a directory, one is auto-generated as a redirect to the first sorted page
3. REQ-3: Sort order priority: `nav_order` config > frontmatter `order:` > date (newest-first) > year dirs (descending) > alphabetical
4. REQ-4: The `index` slug is always placed first in a directory listing
5. REQ-5: `public/posts-index.json` is written for all pages with a `date` field, sorted newest-first
6. REQ-6: `public/feed-index.json` is written with all pages in sidebar order; each entry includes `url`, `title`, `date`, `categories`, `tags`, `reading_time`, and `content`
7. REQ-7: `feed-index.json` URLs do not include the `base_path` prefix
8. REQ-8: Top-level imports and leading H1 are stripped from extracted content; imports inside code fences are preserved

## Test Cases

`tests/build/ingest.test.js`

- `test_sort_alpha_no_dates_no_order` — pages without dates/order sort alphabetically (REQ-3)
- `test_sort_index_always_first` — index slug precedes all others (REQ-4)
- `test_sort_year_dirs_descending` — 4-digit year slugs sort newest-first (REQ-3)
- `test_sort_dated_newest_first` — dated pages sort newest-first (REQ-3)
- `test_sort_dated_tiebreak_alpha` — equal dates break alphabetically (REQ-3)
- `test_sort_order_frontmatter_overrides_alpha` — `order:` frontmatter takes precedence (REQ-3)
- `test_sort_order_missing_order_appends_alpha` — unordered pages append alphabetically (REQ-3)
- `test_auto_index_creates_redirect` — creates `index.mdx` when none exists (REQ-2)
- `test_auto_index_targets_first_sorted_page` — redirect points to first sorted page (REQ-2)
- `test_auto_index_marks_auto_redirect` — generated index has `auto_redirect: true` (REQ-2)
- `test_auto_index_skips_if_index_exists` — does not overwrite existing `index.mdx` (REQ-2)
- `test_auto_index_no_op_when_no_leaf_pages` — no-ops when no `.mdx` files found (REQ-2)
- `test_extract_strips_frontmatter` — frontmatter block removed from content (REQ-8)
- `test_extract_strips_leading_h1` — leading H1 removed (REQ-8)
- `test_extract_strips_top_level_imports` — top-level imports removed (REQ-8)
- `test_extract_preserves_imports_in_code_fences` — imports inside fences preserved (REQ-8)
- `test_extract_preserves_full_code_block` — full code block content unchanged (REQ-8)
- `test_feed_index_includes_content` — all non-redirect entries have content strings (REQ-6)
- `test_feed_index_has_required_fields` — all required fields present on every entry (REQ-6)
- `test_feed_index_urls_no_basepath` — URLs do not contain base_path prefix (REQ-7)
- `test_pages_updates_meta_alphabetical` — undated directory without nav_order sorts alpha (REQ-3)
- `test_pages_features_meta_follows_nav_order` — features directory follows nav_order (REQ-3)
