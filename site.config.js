/** Site-level configuration. Populate before running mdpub build or next dev. */
module.exports = {
  title: 'nlp-mdsite',
  base_url: 'https://kotulc.github.io',
  base_path: '/nlp-mdsite',

  // Intelligence layer (Phase 2 — leave empty for defaults)
  content_style: '',  // e.g. 'technical', 'narrative', 'minimal'
  theme_mood: '',     // e.g. 'calm', 'bold', 'professional'
  logo_seed: 1,       // increment to regenerate logo
}
