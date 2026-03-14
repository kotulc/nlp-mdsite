---
title: Page Feed
categories:
  - spec
---

# Page Feed

The page feed (`components/PageContinuation.jsx`) renders subsequent sibling or child
pages inline below the current page when `feed: true` in `site.config.js`. Content is
fetched from `public/feed-index.json` at runtime — no extra page loads.

## Requirements

1. REQ-1: When on a leaf page, subsequent sibling pages (same parent directory) render below
2. REQ-2: When on a directory index, child pages render below (not siblings)
3. REQ-3: Pages from a different directory group never appear (no cross-group bleed)
4. REQ-4: At most `max_feed_pages - 1` continuation sections are shown; if more exist, a "Continue →" link appears pointing to the first unrendered page
5. REQ-5: Auto-redirect pages (`content: null`) are excluded from the continuation
6. REQ-6: When the current URL is not found in the feed, nothing is rendered
7. REQ-7: `feed-index.json` URLs require no `base_path` prefix; the component prepends `basePath` from the Next.js router for links

## Test Cases

`tests/components/PageContinuation.test.jsx`

- `test_norm_strips_trailing_slash` — URL normalization removes trailing slash (REQ-7)
- `test_norm_preserves_root` — `norm('/')` returns `'/'` (REQ-7)
- `test_get_parent_root_leaf` — root-level pages have parent `'/'` (REQ-1)
- `test_get_parent_nested` — nested pages return their directory (REQ-2)
- `test_is_dir_true_for_directory` — directory URL identified when children exist (REQ-2)
- `test_is_dir_false_for_leaf` — leaf URL identified when no children in feed (REQ-1)
- `test_continuation_renders_siblings` — subsequent siblings appear for leaf page (REQ-1)
- `test_continuation_dir_renders_children` — children appear for directory index (REQ-2)
- `test_continuation_no_bleed` — sibling groups do not include pages from other dirs (REQ-3)
- `test_continuation_pagination_link` — `next_page` set when group exceeds max (REQ-4)
- `test_continuation_no_pagination_within_limit` — `next_page` null when group fits (REQ-4)
- `test_continuation_skips_null_content` — null-content pages excluded (REQ-5)
- `test_continuation_unknown_page_empty` — unknown URL returns empty result (REQ-6)
