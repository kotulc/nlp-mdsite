/**
 * Content ingestion pipeline.
 * Copies markdown from a source directory into the pages/ structure:
 *   - Renames .md → .mdx (home.md → index.mdx)
 *   - Copies images to public/images/
 *   - Rewrites relative image paths to absolute /images/... URLs
 *   - Strips corrupt EXIF segments from JPEGs
 *   - Adds reading_time field to each page's frontmatter
 *   - Auto-generates _meta.json ordering files from frontmatter dates
 *   - Writes public/posts-index.json for the PostIndex component
 *
 * Expected source layout:
 *   <src>/pages/*.md + pages/images/
 *   <src>/posts/<year>/*.md + posts/<year>/images/
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

const UTILITY_PAGES = ['privacy-policy', 'terms-and-conditions']


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
  /** Calculate reading time and inject it into the file's frontmatter. Returns minutes. */
  const content = fs.readFileSync(mdx_path, 'utf8')
  const mins = reading_time(content)
  const updated = content.replace(/^(---\r?\n[\s\S]*?)(\r?\n---\r?\n)/, `$1\nreading_time: ${mins}$2`)
  fs.writeFileSync(mdx_path, updated)
  return mins
}


function copy_files(src_dir, dest_dir) {
  /** Copy all direct files from src_dir to dest_dir (non-recursive). */
  if (!fs.existsSync(src_dir)) return
  fs.mkdirSync(dest_dir, { recursive: true })
  for (const f of fs.readdirSync(src_dir)) {
    const src_f = path.join(src_dir, f)
    if (fs.statSync(src_f).isFile()) fs.copyFileSync(src_f, path.join(dest_dir, f))
  }
}


function rewrite_img_refs(mdx_path, url_prefix) {
  /** Replace ](images/ with ](<url_prefix>/ in an MDX file. */
  const original = fs.readFileSync(mdx_path, 'utf8')
  const updated = original.replace(/\]\(images\//g, `](${url_prefix}/`)
  if (updated !== original) fs.writeFileSync(mdx_path, updated)
}


function write_meta(dest_path, entries) {
  /** Write a _meta.json from an array of [key, value] pairs, preserving order.
   *  Plain objects cannot be used — JS engines reorder numeric-like keys. */
  const lines = entries.map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`)
  fs.writeFileSync(dest_path, `{\n${lines.join(',\n')}\n}\n`)
}


function ingest_static_pages() {
  /** Copy pages/*.md → pages/*.mdx. Returns {slug: title} map. */
  const src_dir = path.join(SRC, 'pages')
  const img_dest = path.join(PUB_IMG, 'pages')
  const meta = {}

  for (const f of fs.readdirSync(src_dir)) {
    if (!f.endsWith('.md')) continue
    const slug = f === 'home.md' ? 'index' : path.basename(f, '.md')
    const dest = path.join(PAGES, `${slug}.mdx`)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(path.join(src_dir, f), dest)
    rewrite_img_refs(dest, '/images/pages')
    add_reading_time(dest)
    meta[slug] = parse_fm(fs.readFileSync(dest, 'utf8')).title || slug
  }

  copy_files(path.join(src_dir, 'images'), img_dest)
  strip_dir(img_dest)

  return meta
}


function ingest_posts() {
  /** Copy posts/YEAR/*.md → pages/posts/YEAR/*.mdx.
   *  Returns { year: [post_record, ...] } where records are sorted newest-first. */
  const src_dir = path.join(SRC, 'posts')
  const dest_root = path.join(PAGES, 'posts')
  const img_root = path.join(PUB_IMG, 'posts')
  const years_data = {}

  for (const year of fs.readdirSync(src_dir)) {
    const year_src = path.join(src_dir, year)
    if (!fs.statSync(year_src).isDirectory()) continue

    const year_dest = path.join(dest_root, year)
    const posts = []

    for (const f of fs.readdirSync(year_src)) {
      if (!f.endsWith('.md')) continue
      const slug = path.basename(f, '.md')
      const dest = path.join(year_dest, `${slug}.mdx`)
      fs.mkdirSync(year_dest, { recursive: true })
      fs.copyFileSync(path.join(year_src, f), dest)
      rewrite_img_refs(dest, `/images/posts/${year}`)
      const mins = add_reading_time(dest)
      const fm = parse_fm(fs.readFileSync(dest, 'utf8'))
      posts.push({
        slug,
        title:        fm.title || slug,
        date:         fm.date || '',
        categories:   Array.isArray(fm.categories) ? fm.categories : [],
        tags:         Array.isArray(fm.tags) ? fm.tags : [],
        reading_time: mins,
        url:          `/posts/${year}/${slug}`,
      })
    }

    copy_files(path.join(year_src, 'images'), path.join(img_root, year))
    strip_dir(path.join(img_root, year))

    posts.sort((a, b) => b.date.localeCompare(a.date))
    years_data[year] = posts
  }

  return years_data
}


function build_top_meta(page_meta, years) {
  /** Build top-level _meta.json as ordered pairs: home, content, posts, utility. */
  const utility = new Set(UTILITY_PAGES)
  const content = Object.keys(page_meta).filter(k => k !== 'index' && !utility.has(k)).sort()
  const pairs = [['index', page_meta['index'] || 'Home']]
  for (const k of content) pairs.push([k, page_meta[k]])
  pairs.push(['posts', 'Posts'])
  for (const k of UTILITY_PAGES) { if (page_meta[k]) pairs.push([k, page_meta[k]]) }
  return pairs
}


function write_posts_index(years_data, years) {
  /** Write public/posts-index.json — flat list of all posts newest-first. */
  const all_posts = years.flatMap(y => years_data[y])
  fs.mkdirSync(PUB_DIR, { recursive: true })
  fs.writeFileSync(path.join(PUB_DIR, 'posts-index.json'), JSON.stringify(all_posts, null, 2) + '\n')
}


function write_posts_page(dest_posts) {
  /** Write pages/posts/index.mdx, always regenerated to reflect current posts. */
  fs.writeFileSync(
    path.join(dest_posts, 'index.mdx'),
    '---\ntitle: Posts\n---\n\nimport PostIndex from \'../../components/PostIndex\'\n\n<PostIndex />\n'
  )
}


// --- Main ---

console.log(`\nIngesting from: ${SRC}`)

const page_meta  = ingest_static_pages()
const years_data = ingest_posts()
const years      = Object.keys(years_data).sort().reverse()
const post_count = years.reduce((n, y) => n + years_data[y].length, 0)

console.log(`  Copied ${Object.keys(page_meta).length} static pages`)
console.log(`  Copied ${post_count} posts across ${years.length} years`)

const dest_posts = path.join(PAGES, 'posts')
write_posts_page(dest_posts)
write_posts_index(years_data, years)
write_meta(path.join(PAGES, '_meta.json'), build_top_meta(page_meta, years))
write_meta(path.join(dest_posts, '_meta.json'), [['index', 'All Posts'], ...years.map(y => [y, y])])
for (const year of years) {
  write_meta(path.join(dest_posts, year, '_meta.json'), years_data[year].map(p => [p.slug, p.title]))
}

console.log(`  Generated _meta.json for ${years.length + 2} directories`)
console.log(`  Written public/posts-index.json`)
console.log('Done.\n')
