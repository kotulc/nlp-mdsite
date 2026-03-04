/**
 * Page header showing publication date and estimated reading time.
 * Rendered below the page title for any page with a `date` frontmatter field.
 */
function fmt_date(date_str) {
  const d = new Date(date_str)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function PageHeader({ date, reading_time }) {
  if (!date && !reading_time) return null
  return (
    <div className="page-header">
      {date && <span className="page-date">{fmt_date(date)}</span>}
      {date && reading_time && <span className="page-header-sep">·</span>}
      {reading_time && <span className="page-reading-time">{reading_time} min read</span>}
    </div>
  )
}
