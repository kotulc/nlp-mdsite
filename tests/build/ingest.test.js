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
  return { slug, title: slug, date: opts.date || '' }
}

// Rels not present in site.config nav_order — use auto-detection
const TEST_REL  = 'test-dir'

// Patch siteConfig for array nav_order unit tests
const siteConfig = require('../../site.config')
const ARRAY_REL  = '__test-array__'
beforeAll(() => { siteConfig.nav_order[ARRAY_REL] = ['pinned-b', 'pinned-a'] })
afterAll(() => { delete siteConfig.nav_order[ARRAY_REL] })


describe('sort_entries — auto alpha (no dates)', () => {
  test('test_sort_alpha_no_dates', () => {
    /** Pages with no dates sort alphabetically by slug. */
    const result = sort_entries([entry('zebra'), entry('apple'), entry('mango')], TEST_REL)
    expect(result.map(e => e.slug)).toEqual(['apple', 'mango', 'zebra'])
  })

  test('test_sort_index_always_first', () => {
    /** index slug is always placed before other entries regardless of sort. */
    const result = sort_entries([entry('zebra'), entry('index'), entry('apple')], TEST_REL)
    expect(result[0].slug).toBe('index')
  })
})


describe('sort_entries — auto chronological (dates present)', () => {
  test('test_sort_dated_newest_first', () => {
    /** Pages with dates auto-sort newest-first when any date is present. */
    const result = sort_entries([
      entry('old',    { date: '2022-01-01' }),
      entry('newest', { date: '2024-06-01' }),
      entry('mid',    { date: '2023-03-15' }),
    ], TEST_REL)
    expect(result.map(e => e.slug)).toEqual(['newest', 'mid', 'old'])
  })

  test('test_sort_dated_tiebreak_alpha', () => {
    /** Equal dates break alphabetically. */
    const result = sort_entries([
      entry('bravo', { date: '2024-01-01' }),
      entry('alpha', { date: '2024-01-01' }),
    ], TEST_REL)
    expect(result.map(e => e.slug)).toEqual(['alpha', 'bravo'])
  })

  test('test_sort_undated_after_dated', () => {
    /** Undated pages sort alphabetically after all dated pages. */
    const result = sort_entries([
      entry('zzz-undated'),
      entry('aaa-dated', { date: '2020-01-01' }),
      entry('aaa-undated'),
    ], TEST_REL)
    expect(result.map(e => e.slug)).toEqual(['aaa-dated', 'aaa-undated', 'zzz-undated'])
  })
})


describe('sort_entries — array nav_order', () => {
  test('test_sort_array_pins_listed_slugs_first', () => {
    /** Listed slugs appear in declared order before unlisted slugs. */
    const result = sort_entries([
      entry('unlisted-z'),
      entry('pinned-a'),
      entry('unlisted-a'),
      entry('pinned-b'),
    ], ARRAY_REL)
    expect(result.map(e => e.slug)).toEqual(['pinned-b', 'pinned-a', 'unlisted-a', 'unlisted-z'])
  })

  test('test_sort_array_unlisted_auto_chrono', () => {
    /** Unlisted slugs with dates auto-sort chronologically after pinned slugs. */
    const result = sort_entries([
      entry('pinned-b'),
      entry('newer', { date: '2024-01-01' }),
      entry('older', { date: '2022-01-01' }),
    ], ARRAY_REL)
    const keys = result.map(e => e.slug)
    expect(keys[0]).toBe('pinned-b')
    expect(keys.slice(1)).toEqual(['newer', 'older'])
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


// --- pages output (integration) ---

const PAGES = path.join(__dirname, '../../pages')
describe('pages output ordering', () => {
  test('test_pages_auto_redirect_index_hidden_in_root_meta', () => {
    /** Root index.mdx is auto-generated redirect — must be hidden in _meta.json. */
    const meta = JSON.parse(fs.readFileSync(path.join(PAGES, '_meta.json'), 'utf8'))
    expect(meta['index']).toBeDefined()
    expect(meta['index']).toMatchObject({ display: 'hidden' })
  })

  test('test_pages_ensure_h1_injected', () => {
    /** Pages without a source h1 get one prepended from frontmatter title. */
    const content = fs.readFileSync(path.join(PAGES, 'getting-started.mdx'), 'utf8')
    const body    = content.replace(/^---[\s\S]*?---\r?\n/, '')
    expect(body.trimStart()).toMatch(/^# /)
  })

  test('test_pages_flatten_generates_page_file', () => {
    /** updates/ is flattened — DirFeed written as pages/updates.mdx (flat page, not folder). */
    expect(fs.existsSync(path.join(PAGES, 'updates.mdx'))).toBe(true)
  })

  test('test_pages_flatten_no_index_inside_subdir', () => {
    /** Flatten writes sibling page file — no index.mdx generated inside the directory. */
    expect(fs.existsSync(path.join(PAGES, 'updates', 'index.mdx'))).toBe(false)
  })

  test('test_pages_auto_redirect_index_hidden_in_features_meta', () => {
    /** features/ has no index.md — auto-redirect index must be hidden in _meta.json. */
    const meta = JSON.parse(fs.readFileSync(path.join(PAGES, 'features', '_meta.json'), 'utf8'))
    expect(meta['index']).toBeDefined()
    expect(meta['index']).toMatchObject({ display: 'hidden' })
  })

  test('test_pages_updates_meta_follows_nav_order', () => {
    /** updates/ is flattened — entries sorted per nav_order, all hidden, no index entry. */
    const meta = JSON.parse(fs.readFileSync(path.join(PAGES, 'updates', '_meta.json'), 'utf8'))
    const keys = Object.keys(meta)
    expect(keys).not.toContain('index')
    expect(keys[0]).toBe('welcome')
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


// --- dir-feed output (integration) ---

const PUB = path.join(__dirname, '../../public')
describe('dir-feed output', () => {
  test('test_dir_feed_file_exists', () => {
    /** public/dir-feeds/updates.json is written for the updates/ flatten directory. */
    expect(fs.existsSync(path.join(PUB, 'dir-feeds', 'updates.json'))).toBe(true)
  })

  test('test_dir_feed_has_required_fields', () => {
    /** Each entry in updates.json has url, title, date, categories, tags, reading_time, content. */
    const entries = JSON.parse(fs.readFileSync(path.join(PUB, 'dir-feeds', 'updates.json'), 'utf8'))
    expect(entries.length).toBeGreaterThan(0)
    for (const e of entries) {
      expect(e).toHaveProperty('url')
      expect(e).toHaveProperty('title')
      expect(e).toHaveProperty('date')
      expect(e).toHaveProperty('categories')
      expect(e).toHaveProperty('tags')
      expect(e).toHaveProperty('reading_time')
      expect(e).toHaveProperty('content')
    }
  })

  test('test_dir_feed_page_file_contains_dir_feed', () => {
    /** pages/updates.mdx contains <DirFeed dir="updates" /> (not an auto-redirect). */
    const content = fs.readFileSync(path.join(PAGES, 'updates.mdx'), 'utf8')
    expect(content).toContain('<DirFeed dir="updates" />')
  })

  test('test_dir_feed_entries_hidden_in_meta', () => {
    /** All entries in updates/ _meta.json have display: 'hidden' (no index entry). */
    const meta = JSON.parse(fs.readFileSync(path.join(PAGES, 'updates', '_meta.json'), 'utf8'))
    expect(Object.keys(meta).length).toBeGreaterThan(0)
    expect(meta['index']).toBeUndefined()
    for (const v of Object.values(meta)) {
      expect(v).toMatchObject({ display: 'hidden' })
    }
  })
})
