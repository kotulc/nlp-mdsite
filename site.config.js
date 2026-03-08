/** Site-level configuration. Populate before running mdpub build or next dev. */
module.exports = {
  title: 'nlp-mdsite',
  base_url: 'https://kotulc.github.io',
  base_path: '/nlp-mdsite',
  repo_url: 'https://github.com/kotulc/nlp-mdsite',  // GitHub icon shown in header; leave empty to hide
  theme_toggle: 'navbar',  // where the light/dark/system toggle appears: 'navbar' or 'sidebar'
  feed: true,              // per-page continuation scroll (set false to disable)

  // Nav ordering: key = directory path from source root ('' = root level)
  // Value = ordered slug array; folders and pages can be mixed; unlisted slugs append alphabetically
  // Per-page: add `order: N` to a page's frontmatter for ordering without touching this file
  nav_order: {
    '': ['getting-started', 'configuration', 'features', 'posts'],
    'features': ['content-pipeline', 'metadata', 'deployment'],
  },

  // Intelligence layer (Phase 2 — leave empty for defaults)
  content_style: '',  // e.g. 'technical', 'narrative', 'minimal'
  theme_mood: '',     // e.g. 'calm', 'bold', 'professional'
  logo_seed: 1,       // increment to regenerate logo
}
