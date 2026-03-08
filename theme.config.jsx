import { useConfig } from 'nextra-theme-docs'
import PageHeader from './components/PageHeader'
import TagList from './components/TagList'
import MetaSidebar from './components/MetaSidebar'
import SiteFooter from './components/SiteFooter'
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
    <div className="page-layout">
      <div className="page-content">
        <PageMeta />
        {children}
      </div>
      <MetaSidebar />
    </div>
  ),
}
