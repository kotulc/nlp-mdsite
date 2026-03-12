/**
 * RSS/feed icon link for the site header.
 * Links to the static feed page; hidden when feed is disabled in site.config.js.
 */
import { useRouter } from 'next/router'
import siteConfig from '../site.config'


const RSS_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20
      C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1
      19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83
      A7.07 7.07 0 0 0 4 12.93V10.1z" />
  </svg>
)


export default function FeedLink() {
  const { basePath } = useRouter()
  if (!siteConfig.feed) return null
  return (
    <a href={`${basePath}/feed/`} className="github-link" aria-label="Feed">
      {RSS_ICON}
    </a>
  )
}
