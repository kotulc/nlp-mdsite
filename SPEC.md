# nlp-mdsite — Technical Specification


## Stack
- **Framework**: Next.js (static export)
- **Content layer**: Nextra (MDX rendering, page tree, routing)
- **Deployment**: GitHub Pages via GitHub Actions
- **Styling**: Nextra docs theme (Phase 1); custom theme (Phase 2)


## Project Structure
```
nlp-mdsite/
├── content/          # MDX source files (copied in by mdpub)
├── pages/            # Next.js pages (minimal — mostly delegated to Nextra)
├── components/       # Custom components (pageIndex, search, theme)
├── public/           # Static assets (generated logos, favicons)
├── theme.config.js   # Nextra theme config
└── site.config.js    # Site-level config (name, base path, metadata)
```


## Content Pipeline
Content is not authored in this repo. The expected input is a `content/` directory
populated by `mdpub` containing:
- MDX files with enriched frontmatter (tags, metrics, semantic signals)
- `_meta.js` files for manual page ordering and per-page theme overrides
- A `site.config.js` with site name, base URL, and deployment path


## Routing & Configuration
- Nextra handles file-system routing from `content/`
- `_meta.js` at each folder level controls display order and section labels
- Per-page theme overrides (e.g. hide sidebar, full-width) set via frontmatter


## Page Metadata Display
Each page renders frontmatter fields as UI elements:
- Tags displayed as chips/pills below the page title
- Reading time and other metrics shown in a page header or sidebar component
- Metadata fields are opt-in per page via frontmatter keys (spec TBD)


## Semantic Theming
- Input: content-derived signals provided in `site.config.js` (keywords, topic category, tone)
- Output: CSS custom properties for color palette; optional logo/favicon assets in `public/`
- Phase 1: Manual palette in config; Phase 2: Automated generation from signals


## Semantic Search
- Phase 1: Nextra built-in search (keyword, local index)
- Phase 2: Replace with vector-based semantic search
  - Index built at `mdpub build` time from content embeddings
  - Served as a static JSON index or via a lightweight edge function
  - Component: drop-in replacement for Nextra's default search bar


## Deployment
GitHub Actions workflow (`.github/workflows/deploy.yml`):
1. `npm install`
2. `next build && next export`
3. Push `out/` to `gh-pages` branch

Base path and asset prefix configured via `site.config.js` to support project-page URLs
(e.g. `username.github.io/repo-name`).


## mdpub Integration Points
| mdpub command     | Effect on nlp-mdsite                                      |
|-------------------|-----------------------------------------------------------|
| `mdpub init`      | Installs deps, writes `site.config.js`, copies template   |
| `mdpub build`     | Populates `content/`, runs `next build`                   |
| `mdpub preview`   | Runs `next dev` locally                                   |
| `mdpub publish`   | Triggers GitHub Actions deploy or runs `gh-pages` push    |


## Open Questions
- Semantic theming signal format: what fields does `mdpub` provide in `site.config.js`?
- Search index format for Phase 2: static JSON blob vs. edge function?
- Logo generation: in-pipeline (mdpub) or in-template build step?
