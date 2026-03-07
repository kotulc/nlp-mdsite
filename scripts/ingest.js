/**
 * Content ingestion pipeline.
 * Recursively mirrors any markdown source tree into the Next.js site content directory (pages/):
 *   - Renames .md → .mdx (home.md or index.md at any level → index.mdx)
 *   - Copies images/ subdirectories to public/images/<rel-path>/
 *   - Rewrites relative image refs to absolute /images/<rel-path>/... URLs
 *   - Strips corrupt EXIF segments from copied JPEGs
 *   - Injects reading_time into each page's frontmatter
 *   - Auto-generates _meta.json at each level (date-sorted if any page has a date, else alpha)
 *   - Writes public/posts-index.json for all pages with a date field
 *
 * Usage: node scripts/ingest.js [source-dir]
 *        Default source-dir: examples/frww
 */
const fs = require('fs')
const path = require('path')
const { strip_dir } = require('./fix-exif')


const ROOT    = path.join(__dirname, '..')
const SRC     = path.resolve(process.argv[2] || path.join(ROOT, 'examples/frww'))
const PAGES   = path.join(ROOT, 'pages')
const PUB_IMG = path.join(ROOT, 'public', 'images')
const PUB_DIR = path.join(ROOT, 'public')


function parse_fm(content) {
  /** Extract scalars and arrays from YAML frontmatter. */
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  const fm = {}
  const lines = match[1].split(/\r?\n/)
  let i = 0

  while (i < lines.length) {
    const colon = lines[i].indexOf(':')
    if (colon < 0) { i++; continue }
    const key = lines[i].slice(0, colon).trim()
    const val = lines[i].slice(colon + 1).trim().replace(/^["'](.*)["']$/, '$1')
    i++

    if (!val) {  // Possible YAML list — collect "- item" lines
      const items = []
      while (i < lines.length && /^\s*-/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*-\s*/, '').replace(/^["'](.*)["']$/, '$1'))
        i++
      }
      fm[key] = items
    } else {
      fm[key] = val
    }
  }
  return fm
}


function reading_time(content) {
  /** Estimate reading time in minutes from MDX content. */
  const body = content.replace(/^---[\s\S]*?---\n/, '')
  const text = body.replace(/```[\s\S]*?```/g, '')
                   .replace(/[#*`[\]()!|>]/g, ' ')
                   .replace(/\s+/g, ' ').trim()
  const words = text.split(' ').filter(w => w.length > 1).length
  return Math.max(1, Math.round(words / 200))
}


function add_reading_time(mdx_path) {
  /** Inject reading_time into frontmatter. Returns estimated minutes. */
  const content = fs.readFileSync(mdx_path, 'utf8')
  const mins = reading_time(content)
  const updated = content.replace(/^(---\r?\n[\s\S]*?)(\r?\n---\r?\n)/, `$1\nreading_time: ${mins}$2`)
  fs.writeFileSync(mdx_path, updated)
  return mins
}


function rewrite_img_refs(mdx_path, img_url) {
  /** Replace ](images/ with ](<img_url>/ in an MDX file. */
  const original = fs.readFileSync(mdx_path, 'utf8')
  const updated = original.replace(/\]\(images\//g, `](${img_url}/`)
  if (updated !== original) fs.writeFileSync(mdx_path, updated)
}


function rewrite_md_links(mdx_path, url_base) {
  /** Rewrite relative markdown links to absolute paths using the page URL base.
   *  Skips image links (![...]), already-absolute hrefs, and fragment-only refs. */
  const original = fs.readFileSync(mdx_path, 'utf8')
  const updated = original.replace(
    /(?<!\!)\[([^\]]*)\]\(([^)]+)\)/g,
    (match, text, raw_href) => {
      const space = raw_href.search(/\s/)
      const href = space < 0 ? raw_href : raw_href.slice(0, space)
      const rest = space < 0 ? '' : raw_href.slice(space)
      if (/^(\/|https?:|mailto:|#)/.test(href)) return match
      const [link, ...frags] = href.split('#')
      const fragment = frags.length ? '#' + frags.join('#') : ''
      return `[${text}](${path.posix.join(url_base, link)}${fragment}${rest})`
    }
  )
  if (updated !== original) fs.writeFileSync(mdx_path, updated)
}


function write_meta(dest_path, entries) {
  /** Write a _meta.json from ordered [key, value] pairs, preserving order.
   *  Plain objects cannot be used — JS engines reorder numeric-like keys. */
  const lines = entries.map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`)
  fs.writeFileSync(dest_path, `{\n${lines.join(',\n')}\n}\n`)
}


function read_meta(meta_path) {
  /** Read a _meta.json written by write_meta into ordered [key, value] pairs. */
  if (!fs.existsSync(meta_path)) return []
  return fs.readFileSync(meta_path, 'utf8').split('\n').flatMap(l => {
    const m = l.match(/^\s+"([^"]+)":\s+"([^"]+)",?$/)
    return m ? [[m[1], m[2]]] : []
  })
}


function sort_entries(entries) {
  /** Sort: index first, then newest-first by date (if any have dates); else alpha.
   *  Exception: if all non-index slugs look like 4-digit years, sort descending. */
  const idx  = entries.filter(e => e.slug === 'index')
  const rest = entries.filter(e => e.slug !== 'index')
  const has_dates  = rest.some(e => e.date)
  const all_years  = !has_dates && rest.length > 0 && rest.every(e => /^\d{4}$/.test(e.slug))

  rest.sort(
    has_dates ? (a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug)
    : all_years ? (a, b) => b.slug.localeCompare(a.slug)
    : (a, b) => a.slug.localeCompare(b.slug)
  )
  return [...idx, ...rest]
}


function ingest_dir(src_dir, dest_dir, rel, dated_posts) {
  /** Recursively mirror src_dir → dest_dir.
   *  rel: path from SRC to src_dir using forward slashes ('' for root).
   *  dated_posts: accumulates all pages with a date field.
   *  Returns { title } from the directory's index page (or the directory name). */
  fs.mkdirSync(dest_dir, { recursive: true })

  const img_url  = '/images' + (rel ? `/${rel}` : '')
  const img_src  = path.join(src_dir, 'images')
  const img_dest = path.join(PUB_IMG, rel)  // rel='' → PUB_IMG itself

  if (fs.existsSync(img_src) && fs.statSync(img_src).isDirectory()) {
    fs.mkdirSync(img_dest, { recursive: true })
    for (const f of fs.readdirSync(img_src)) {
      const sf = path.join(img_src, f)
      if (fs.statSync(sf).isFile()) fs.copyFileSync(sf, path.join(img_dest, f))
    }
    strip_dir(img_dest)
  }

  const entries = []
  const base = path.basename(src_dir)
  let dir_title = base.charAt(0).toUpperCase() + base.slice(1)

  for (const entry of fs.readdirSync(src_dir).sort()) {
    const src_entry = path.join(src_dir, entry)
    const stat = fs.statSync(src_entry)

    if (entry === 'images') continue  // handled above

    if (stat.isDirectory()) {
      const sub_rel = rel ? `${rel}/${entry}` : entry
      const { title } = ingest_dir(src_entry, path.join(dest_dir, entry), sub_rel, dated_posts)
      entries.push({ slug: entry, title, date: '' })
      continue
    }

    const is_md  = entry.endsWith('.md')
    const is_mdx = entry.endsWith('.mdx')
    if (!is_md && !is_mdx) continue

    const base = path.basename(entry, is_mdx ? '.mdx' : '.md')
    const slug = (base === 'home' || base === 'index') ? 'index' : base
    const dest = path.join(dest_dir, `${slug}.mdx`)
    const url_base = slug === 'index'
      ? (rel ? `/${rel}/` : '/')
      : (rel ? `/${rel}/${slug}/` : `/${slug}/`)
    fs.copyFileSync(src_entry, dest)
    rewrite_img_refs(dest, img_url)
    rewrite_md_links(dest, url_base)
    const mins = add_reading_time(dest)
    const fm   = parse_fm(fs.readFileSync(dest, 'utf8'))

    const parts = [...(rel ? rel.split('/') : []), ...(slug === 'index' ? [] : [slug])]
    const url   = '/' + parts.join('/')

    const record = {
      slug,
      title:        fm.title        || slug,
      date:         fm.date         || '',
      categories:   Array.isArray(fm.categories) ? fm.categories : [],
      tags:         Array.isArray(fm.tags)        ? fm.tags        : [],
      reading_time: mins,
      url:          url || '/',
    }
    entries.push(record)
    if (fm.date && rel) dated_posts.push(record)  // root-level pages are site pages, not posts
    if (slug === 'index') dir_title = record.title
  }

  const sorted = sort_entries(entries)
  write_meta(path.join(dest_dir, '_meta.json'), sorted.map(e => [e.slug, e.title]))
  return { title: dir_title }
}


function write_posts_index(dated_posts) {
  /** Write public/posts-index.json — all dated pages sorted newest-first. */
  const sorted = [...dated_posts].sort((a, b) => b.date.localeCompare(a.date))
  fs.mkdirSync(PUB_DIR, { recursive: true })
  fs.writeFileSync(path.join(PUB_DIR, 'posts-index.json'), JSON.stringify(sorted, null, 2) + '\n')
}


function write_posts_page() {
  /** Ensure pages/posts/index.mdx exists for the PostIndex component.
   *  Also ensures _meta.json for posts/ starts with an 'index' entry. */
  const dir  = path.join(PAGES, 'posts')
  const dest = path.join(dir, 'index.mdx')
  fs.mkdirSync(dir, { recursive: true })

  if (!fs.existsSync(dest)) {
    fs.writeFileSync(
      dest,
      '---\ntitle: Posts\n---\n\nimport PostIndex from \'../../components/PostIndex\'\n\n<PostIndex />\n'
    )
  }

  const meta_path = path.join(dir, '_meta.json')
  const pairs = read_meta(meta_path)
  if (!pairs.some(([k]) => k === 'index')) {
    write_meta(meta_path, [['index', 'All Posts'], ...pairs])
  }
}


// --- Main ---

console.log(`\nIngesting from: ${SRC}`)

fs.rmSync(PAGES,   { recursive: true, force: true })
fs.rmSync(PUB_IMG, { recursive: true, force: true })

const dated_posts = []
ingest_dir(SRC, PAGES, '', dated_posts)

if (!fs.existsSync(path.join(PAGES, 'index.mdx'))) {
  console.warn('  Warning: no root index page found — place home.md or index.md at the source root for the site to load at /.')
}

console.log(`  Mirrored source tree into pages/`)

if (dated_posts.length) {
  write_posts_page()
  write_posts_index(dated_posts)
  console.log(`  Found ${dated_posts.length} dated pages`)
  console.log(`  Written public/posts-index.json`)
}

console.log('Done.\n')
