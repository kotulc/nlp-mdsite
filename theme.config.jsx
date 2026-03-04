import siteConfig from './site.config'

export default {
  logo: <span style={{ fontWeight: 600 }}>{siteConfig.title}</span>,
  footer: { text: `© ${new Date().getFullYear()} ${siteConfig.title}` },
  useNextSeoProps() {
    return { titleTemplate: `%s – ${siteConfig.title}` }
  },
  head: (
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ),
}
