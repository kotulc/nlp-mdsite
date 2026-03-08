import { useConfig } from 'nextra-theme-docs'
import PageHeader from './components/PageHeader'
import TagList from './components/TagList'
import MetaSidebar from './components/MetaSidebar'
import SiteFooter from './components/SiteFooter'
import GitHubLink from './components/GitHubLink'
import ThemeToggle from './components/ThemeToggle'
import PageContinuation from './components/PageContinuation'
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
  darkMode: siteConfig.theme_toggle !== 'navbar',
  navbar: {
    extraContent: (
      <>
        {siteConfig.theme_toggle === 'navbar' && <ThemeToggle />}
        <GitHubLink />
      </>
    ),
  },
  footer: { text: <SiteFooter /> },
  useNextSeoProps() {
    return { titleTemplate: `%s – ${siteConfig.title}` }
  },
  head: (
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ),
  toc: siteConfig.toc === false
    ? { component: () => null }
    : { extraContent: siteConfig.meta_sidebar !== false ? <MetaSidebar /> : undefined },
  main: ({ children }) => (
    <>
      <PageMeta />
      {children}
      {siteConfig.feed && <PageContinuation />}
    </>
  ),
}
