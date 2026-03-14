/**
 * Unit tests for PageContinuation feed grouping logic.
 * Tests the URL helper functions and group-selection behavior directly
 * without rendering the full component (avoids fetch/router mocking overhead).
 */

// Replicate the URL helpers from PageContinuation for isolated unit testing
const norm       = url => url.replace(/\/$/, '') || '/'
const get_parent = url => {
  const p = norm(url).split('/').filter(Boolean)
  return p.length <= 1 ? '/' : '/' + p.slice(0, -1).join('/')
}
const is_dir = (url, feed) =>
  feed.some(p => norm(p.url) !== norm(url) && norm(p.url).startsWith(norm(url) + '/'))


// Sample feed mirroring real feed-index.json structure
const FEED = [
  { url: '/getting-started',            title: 'Getting Started', content: 'gs content' },
  { url: '/configuration',              title: 'Configuration',   content: 'cfg content' },
  { url: '/features',                   title: 'Features',        content: 'feat content' },
  { url: '/features/content-pipeline',  title: 'Pipeline',        content: 'pipe content' },
  { url: '/features/metadata',          title: 'Metadata',        content: 'meta content' },
  { url: '/features/styling',           title: 'Styling',         content: 'style content' },
  { url: '/components',                 title: 'Components',      content: 'comp content' },
  { url: '/about',                      title: 'About',           content: 'about content' },
  { url: '/updates/introducing',        title: 'Welcome',         content: 'intro content' },
  { url: '/updates/plans',              title: 'Plans',           content: 'plans content' },
]


// Simulate the group-selection logic from PageContinuation
function get_group(current_url, feed, max) {
  const current = norm(current_url)
  const idx = feed.findIndex(p => norm(p.url) === current)
  if (idx < 0) return { visible: [], next_page: null }

  const is_dir_page = is_dir(current, feed)
  const group = feed.filter(p =>
    is_dir_page
      ? get_parent(norm(p.url)) === current
      : get_parent(norm(p.url)) === get_parent(current) && feed.indexOf(p) > idx
  ).filter(p => p.content !== null)

  return { visible: group.slice(0, max), next_page: group[max] ?? null }
}


describe('URL helpers', () => {
  test('test_norm_strips_trailing_slash', () => {
    /** norm() removes trailing slash from any URL. */
    expect(norm('/features/')).toBe('/features')
    expect(norm('/features/metadata/')).toBe('/features/metadata')
  })

  test('test_norm_preserves_root', () => {
    /** norm('/') returns '/' not empty string. */
    expect(norm('/')).toBe('/')
  })

  test('test_get_parent_root_leaf', () => {
    /** Root-level pages have parent '/'. */
    expect(get_parent('/overview')).toBe('/')
    expect(get_parent('/getting-started')).toBe('/')
  })

  test('test_get_parent_nested', () => {
    /** Nested pages return their directory. */
    expect(get_parent('/features/metadata')).toBe('/features')
    expect(get_parent('/updates/plans')).toBe('/updates')
  })

  test('test_is_dir_true_for_directory', () => {
    /** is_dir returns true when url has children in the feed. */
    expect(is_dir('/features', FEED)).toBe(true)
  })

  test('test_is_dir_false_for_leaf', () => {
    /** is_dir returns false when url has no children in the feed. */
    expect(is_dir('/configuration', FEED)).toBe(false)
  })
})


describe('continuation group selection', () => {
  test('test_continuation_renders_siblings', () => {
    /** Leaf page shows subsequent root-level siblings. */
    const { visible } = get_group('/getting-started', FEED, 10)
    const slugs = visible.map(p => p.url)
    expect(slugs).toContain('/configuration')
    expect(slugs).not.toContain('/getting-started')  // not self
  })

  test('test_continuation_dir_renders_children', () => {
    /** Directory index shows its children, not siblings. */
    const { visible } = get_group('/features', FEED, 10)
    const slugs = visible.map(p => p.url)
    expect(slugs).toContain('/features/content-pipeline')
    expect(slugs).toContain('/features/metadata')
    expect(slugs).not.toContain('/configuration')    // sibling, not child
  })

  test('test_continuation_no_bleed', () => {
    /** Features children do not appear in root-level continuation. */
    const { visible } = get_group('/getting-started', FEED, 10)
    visible.forEach(p => expect(p.url).not.toMatch(/^\/features\//))
  })

  test('test_continuation_pagination_link', () => {
    /** Shows next_page when group exceeds max pages. */
    const { visible, next_page } = get_group('/features', FEED, 2)
    expect(visible.length).toBe(2)
    expect(next_page).not.toBeNull()
    expect(next_page.url).toBe('/features/styling')
  })

  test('test_continuation_no_pagination_within_limit', () => {
    /** next_page is null when group fits within max. */
    const { visible, next_page } = get_group('/features', FEED, 10)
    expect(visible.length).toBe(3)  // content-pipeline, metadata, styling
    expect(next_page).toBeNull()
  })

  test('test_continuation_skips_null_content', () => {
    /** Pages with content: null (auto-redirect) are excluded from visible. */
    const feed_with_redirect = [
      ...FEED,
      { url: '/updates', title: 'Updates', content: null },
    ]
    const { visible } = get_group('/about', feed_with_redirect, 10)
    visible.forEach(p => expect(p.content).not.toBeNull())
  })

  test('test_continuation_unknown_page_empty', () => {
    /** Returns empty when current URL is not in the feed. */
    const { visible, next_page } = get_group('/not-a-page', FEED, 10)
    expect(visible).toHaveLength(0)
    expect(next_page).toBeNull()
  })
})
