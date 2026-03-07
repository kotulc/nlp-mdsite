import { useConfig } from 'nextra-theme-docs'
import PageHeader from './components/PageHeader'
import TagList from './components/TagList'
import siteConfig from './site.config'


function PageMeta() {
  /** Renders date, reading time, and tag chips below the page title. */
  const { frontMatter } = useConfig()
  return (
    <>
      <PageHeader date={frontMatter.date} reading_time={frontMatter.reading_time} />
      <TagList categories={frontMatter.categories} tags={frontMatter.tags} />
    </>
  )
}


function SiteFooter() {
  /** Copyright, last-updated timestamp (injected at build time), and credits. */
  const build_time = process.env.NEXT_PUBLIC_BUILD_TIME
  const formatted = build_time
    ? new Date(build_time).toLocaleString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short',
      })
    : null
  return (
    <div className="site-footer">
      <span>© {new Date().getFullYear()} {siteConfig.title}</span>
      {formatted && <span>Updated {formatted}</span>}
      <span>
        Powered by{' '}
        <a href="https://github.com/kotulc/nlp-mdsite" target="_blank" rel="noopener noreferrer">nlp-mdsite</a>
        {' '}and{' '}
        <a href="https://nextra.site" target="_blank" rel="noopener noreferrer">Nextra</a>
      </span>
    </div>
  )
}


export default {
  logo: <span style={{ fontWeight: 600 }}>{siteConfig.title}</span>,
  footer: { text: <SiteFooter /> },
  useNextSeoProps() {
    return { titleTemplate: `%s – ${siteConfig.title}` }
  },
  head: (
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ),
  main: ({ children }) => (
    <>
      <PageMeta />
      {children}
    </>
  ),
}
