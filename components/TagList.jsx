/**
 * Renders page categories and tags as pill chips.
 * Categories use a distinct style from tags.
 */
export default function TagList({ categories = [], tags = [] }) {
  if (!categories.length && !tags.length) return null
  return (
    <div className="tag-list">
      {categories.map(c => <span key={c} className="chip chip-category">{c}</span>)}
      {tags.map(t => <span key={t} className="chip chip-tag">{t}</span>)}
    </div>
  )
}
