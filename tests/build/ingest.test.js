/**
 * Unit and integration tests for the ingest pipeline's sort ordering and
 * auto-index generation. Imports exported functions directly from ingest.js.
 */
const fs   = require('fs')
const os   = require('os')
const path = require('path')

const { parse_fm, sort_entries, extract_content, auto_index } = require('../../scripts/ingest')


// --- sort_entries ---

function entry(slug, opts = {}) {
  return { slug, title: slug, date: opts.date || '', order: opts.order ?? null }
}

// Use a rel not present in site.config nav_order to avoid triggering explicit ordering
const TEST_REL = 'test-dir'

describe('sort_entries — default alpha', () => {
  test('test_sort_alpha_no_dates_no_order', () => {
    /** Pages with no dates and no order sort alphabetically by slug. */
    const result = sort_entries([entry('zebra'), entry('apple'), entry('mango')], TEST_REL)
    expect(result.map(e => e.slug)).toEqual(['apple', 'mango', 'zebra'])
  })

  test('test_sort_index_always_first', () => {
    /** index slug is always placed before other entries regardless of sort. */
    const result = sort_entries([entry('zebra'), entry('index'), entry('apple')], TEST_REL)
    expect(result[0].slug).toBe('index')
  })

  test('test_sort_year_dirs_descending', () => {
    /** All-digit 4-char slugs (year dirs) sort descending. */
    const result = sort_entries([entry('2021'), entry('2024'), entry('2019')], TEST_REL)
    expect(result.map(e => e.slug)).toEqual(['2024', '2021', '2019'])
  })
})


describe('sort_entries — date ordering', () => {
  test('test_sort_dated_newest_first', () => {
    /** Pages with date fields sort newest-first. */
    const result = sort_entries([
      entry('old',    { date: '2022-01-01' }),
      entry('newest', { date: '2024-06-01' }),
      entry('mid',    { date: '2023-03-15' }),
    ], TEST_REL)
    expect(result.map(e => e.slug)).toEqual(['newest', 'mid', 'old'])
  })

  test('test_sort_dated_tiebreak_alpha', () => {
    /** Pages with equal dates sort alphabetically as tiebreak. */
    const result = sort_entries([
      entry('bravo', { date: '2024-01-01' }),
      entry('alpha', { date: '2024-01-01' }),
    ], TEST_REL)
    expect(result.map(e => e.slug)).toEqual(['alpha', 'bravo'])
  })
})


describe('sort_entries — frontmatter order', () => {
  test('test_sort_order_frontmatter_overrides_alpha', () => {
    /** Frontmatter order: N takes precedence over alphabetical sort. */
    const result = sort_entries([
      entry('zzz', { order: 1 }),
      entry('aaa', { order: 2 }),
      entry('mmm', { order: 3 }),
    ], TEST_REL)
    expect(result.map(e => e.slug)).toEqual(['zzz', 'aaa', 'mmm'])
  })

  test('test_sort_order_missing_order_appends_alpha', () => {
    /** Pages without order: are appended alphabetically after ordered pages. */
    const result = sort_entries([
      entry('zzz', { order: 1 }),
      entry('beta'),
      entry('alpha'),
    ], TEST_REL)
    expect(result[0].slug).toBe('zzz')
    expect(result.slice(1).map(e => e.slug)).toEqual(['alpha', 'beta'])
  })
})


// --- auto_index ---

describe('auto_index', () => {
  let tmp_dir

  beforeEach(() => {
    tmp_dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ingest-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmp_dir, { recursive: true, force: true })
  })

  test('test_auto_index_creates_redirect', () => {
    /** auto_index generates index.mdx when the directory has no index. */
    fs.writeFileSync(path.join(tmp_dir, 'getting-started.mdx'), '# Getting Started\n')
    const sorted = [entry('getting-started', {})]
    sorted[0].title = 'Getting Started'
    auto_index(tmp_dir, sorted, '')
    expect(fs.existsSync(path.join(tmp_dir, 'index.mdx'))).toBe(true)
  })

  test('test_auto_index_targets_first_sorted_page', () => {
    /** The generated redirect points to the first sorted entry's URL. */
    fs.writeFileSync(path.join(tmp_dir, 'overview.mdx'), '# Overview\n')
    const sorted = [entry('overview')]
    sorted[0].title = 'Overview'
    auto_index(tmp_dir, sorted, 'docs')
    const content = fs.readFileSync(path.join(tmp_dir, 'index.mdx'), 'utf8')
    expect(content).toContain('/docs/overview/')
  })

  test('test_auto_index_marks_auto_redirect', () => {
    /** Generated index.mdx has auto_redirect: true in frontmatter. */
    fs.writeFileSync(path.join(tmp_dir, 'page.mdx'), '# Page\n')
    const sorted = [entry('page')]
    sorted[0].title = 'Page'
    auto_index(tmp_dir, sorted, '')
    const fm = parse_fm(fs.readFileSync(path.join(tmp_dir, 'index.mdx'), 'utf8'))
    expect(fm.auto_redirect).toBe('true')
  })

  test('test_auto_index_skips_if_index_exists', () => {
    /** auto_index does not overwrite an existing index.mdx. */
    const original = '---\ntitle: My Index\n---\n\nOriginal content.\n'
    fs.writeFileSync(path.join(tmp_dir, 'index.mdx'), original)
    fs.writeFileSync(path.join(tmp_dir, 'other.mdx'), '# Other\n')
    auto_index(tmp_dir, [entry('other')], '')
    expect(fs.readFileSync(path.join(tmp_dir, 'index.mdx'), 'utf8')).toBe(original)
  })

  test('test_auto_index_no_op_when_no_leaf_pages', () => {
    /** auto_index does nothing when sorted has no matching .mdx files. */
    auto_index(tmp_dir, [entry('ghost')], '')
    expect(fs.existsSync(path.join(tmp_dir, 'index.mdx'))).toBe(false)
  })
})


// --- extract_content ---

describe('extract_content', () => {
  test('test_extract_strips_frontmatter', () => {
    /** Frontmatter block is removed from output. */
    const mdx = '---\ntitle: Test\n---\n\nBody text.\n'
    expect(extract_content(mdx)).toBe('Body text.')
  })

  test('test_extract_strips_leading_h1', () => {
    /** The first H1 heading is stripped (Nextra renders it from meta). */
    const mdx = '---\ntitle: T\n---\n\n# My Page\n\nBody text.\n'
    expect(extract_content(mdx)).toBe('Body text.')
  })

  test('test_extract_strips_top_level_imports', () => {
    /** Top-level import statements are removed. */
    const mdx = '---\ntitle: T\n---\n\nimport Foo from \'./Foo\'\n\nBody.\n'
    expect(extract_content(mdx)).toBe('Body.')
  })

  test('test_extract_preserves_imports_in_code_fences', () => {
    /** Import lines inside ``` fences are NOT stripped. */
    const mdx = [
      '---', 'title: T', '---', '',
      '```js',
      'import React from \'react\'',
      '```',
      '',
      'Body.',
    ].join('\n')
    expect(extract_content(mdx)).toContain('import React from \'react\'')
  })

  test('test_extract_preserves_full_code_block', () => {
    /** Entire code block content survives extraction unchanged. */
    const code = 'const x = 1\nimport y from \'./y\'\nexport default x'
    const mdx  = `---\ntitle: T\n---\n\n\`\`\`js\n${code}\n\`\`\`\n`
    const result = extract_content(mdx)
    expect(result).toContain(code)
  })
})


// --- feed-index output (integration) ---

const FEED_INDEX = path.join(__dirname, '../../public/feed-index.json')

describe('feed-index output', () => {
  let feed

  beforeAll(() => { feed = JSON.parse(fs.readFileSync(FEED_INDEX, 'utf8')) })

  test('test_feed_index_includes_content', () => {
    /** Every non-auto-redirect entry has a non-empty content string. */
    const content_entries = feed.filter(e => e.content !== null)
    expect(content_entries.length).toBeGreaterThan(0)
    content_entries.forEach(e => expect(typeof e.content).toBe('string'))
  })

  test('test_feed_index_has_required_fields', () => {
    /** Every entry has url, title, date, categories, tags, reading_time, content. */
    const required = ['url', 'title', 'date', 'categories', 'tags', 'reading_time', 'content']
    feed.forEach(e => required.forEach(f => expect(e).toHaveProperty(f)))
  })

  test('test_feed_index_urls_no_basepath', () => {
    /** URLs start with / and do not include the base_path prefix. */
    const siteConfig = require('../../site.config')
    const base = siteConfig.base_path || ''
    feed.forEach(e => {
      expect(e.url).toMatch(/^\//)
      if (base) expect(e.url).not.toMatch(new RegExp('^' + base))
    })
  })
})


// --- pages output (integration) ---

const PAGES = path.join(__dirname, '../../pages')
describe('pages output ordering', () => {
  test('test_pages_auto_redirect_index_hidden_in_root_meta', () => {
    /** Root index.mdx is auto-generated redirect — must be hidden in _meta.json. */
    const meta = JSON.parse(fs.readFileSync(path.join(PAGES, '_meta.json'), 'utf8'))
    expect(meta['index']).toBeDefined()
    expect(meta['index']).toMatchObject({ display: 'hidden' })
  })

  test('test_pages_auto_redirect_index_hidden_in_updates_meta', () => {
    /** updates/ has no index.md — auto-redirect index must be hidden in _meta.json. */
    const meta = JSON.parse(fs.readFileSync(path.join(PAGES, 'updates', '_meta.json'), 'utf8'))
    expect(meta['index']).toBeDefined()
    expect(meta['index']).toMatchObject({ display: 'hidden' })
  })

  test('test_pages_real_index_not_hidden_in_features_meta', () => {
    /** features/ has a real index.md — its index entry should be a plain string title. */
    const meta = JSON.parse(fs.readFileSync(path.join(PAGES, 'features', '_meta.json'), 'utf8'))
    expect(typeof meta['index']).toBe('string')
  })

  test('test_pages_updates_meta_alphabetical', () => {
    /** updates/ non-index entries are alphabetical (no nav_order, no dates). */
    const meta = JSON.parse(fs.readFileSync(path.join(PAGES, 'updates', '_meta.json'), 'utf8'))
    const keys = Object.keys(meta).filter(k => k !== 'index')
    expect(keys).toEqual([...keys].sort())
  })

  test('test_pages_features_meta_follows_nav_order', () => {
    /** features/ non-index entries follow the nav_order defined in site.config.js. */
    const siteConfig = require('../../site.config')
    const expected   = siteConfig.nav_order['features']
    const meta       = JSON.parse(fs.readFileSync(path.join(PAGES, 'features', '_meta.json'), 'utf8'))
    const keys       = Object.keys(meta).filter(k => k !== 'index')
    expect(keys.slice(0, expected.length)).toEqual(expected)
  })
})
