/** Site-level configuration. Populate before running mdpub build or next dev. */
module.exports = {
  title: 'nlp-mdsite',
  base_url: 'https://kotulc.github.io',
  base_path: '/nlp-mdsite',
  repo_url: 'https://github.com/kotulc/nlp-mdsite',  // GitHub icon shown in header; leave empty to hide

  // Intelligence layer (Phase 2 — leave empty for defaults)
  content_style: '',  // e.g. 'technical', 'narrative', 'minimal'
  theme_mood: '',     // e.g. 'calm', 'bold', 'professional'
  logo_seed: 1,       // increment to regenerate logo
}
