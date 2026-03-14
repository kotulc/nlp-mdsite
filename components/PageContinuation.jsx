/**
 * Renders subsequent sibling or child pages inline below the current page.
 * Fetches public/feed-index.json once (module-level cache) and re-computes on
 * navigation. Shows at most max_feed_pages-1 continuation sections; if more
 * exist, renders a "Continue →" link to the first unrendered page.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import PageHeader from './PageHeader'
import TagList from './TagList'
import siteConfig from '../site.config'


let feed_cache = null  // module-level: survives Nextra's no-remount navigation

// Normalize URL: strip trailing slash, preserve root '/'
const norm = url => url.replace(/\/$/, '') || '/'

// Parent directory of a URL (e.g. '/features/metadata' → '/features', '/overview' → '/')
const get_parent = url => {
  const p = norm(url).split('/').filter(Boolean)
  return p.length <= 1 ? '/' : '/' + p.slice(0, -1).join('/')
}

// True if url has child entries in feed
const is_dir = (url, feed) =>
  feed.some(p => norm(p.url) !== norm(url) && norm(p.url).startsWith(norm(url) + '/'))


export default function PageContinuation() {
  const router = useRouter()
  const [visible,   set_visible]   = useState([])
  const [next_page, set_next_page] = useState(null)

  useEffect(() => {
    if (!siteConfig.feed) return
    const max = (siteConfig.max_feed_pages || 20) - 1

    async function init() {
      if (!feed_cache) {
        const res = await fetch(`${router.basePath}/feed-index.json`)
        feed_cache = await res.json()
      }
      const feed = feed_cache
      const current = norm(router.asPath.split('?')[0])
      const idx = feed.findIndex(p => norm(p.url) === current)
      if (idx < 0) { set_visible([]); set_next_page(null); return }

      const is_dir_page = is_dir(current, feed)
      const group = feed.filter(p =>
        is_dir_page
          ? get_parent(norm(p.url)) === current           // children of this dir
          : get_parent(norm(p.url)) === get_parent(current) && feed.indexOf(p) > idx
      ).filter(p => p.content !== null)

      set_visible(group.slice(0, max))
      set_next_page(group[max] ?? null)
    }

    init()
    router.events.on('routeChangeComplete', init)
    return () => router.events.off('routeChangeComplete', init)
  }, [router.asPath, router.basePath])

  if (!siteConfig.feed || !visible.length) return null

  const base = router.basePath

  return (
    <div className="feed-continuation">
      {visible.map(page => {
        const href = base + (page.url === '/' ? '/' : page.url + '/')
        return (
          <section key={page.url} className="feed-section">
            <div className="feed-section-divider" />
            <h1><a href={href} style={{ color: 'inherit', textDecoration: 'none' }}>{page.title}</a></h1>
            <PageHeader date={page.date} reading_time={page.reading_time} />
            <TagList categories={page.categories} tags={page.tags} />
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{page.content}</ReactMarkdown>
          </section>
        )
      })}
      {next_page && (
        <div className="feed-pagination">
          <a href={base + next_page.url + '/'}>Continue: {next_page.title} →</a>
        </div>
      )}
    </div>
  )
}
