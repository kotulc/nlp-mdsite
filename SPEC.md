# nlp-mdsite — Technical Specification


## Development Philosophy

Every user interaction, manual step, and configuration decision must be documented
explicitly as it is implemented. The purpose is twofold:

1. **Reproducibility** — any developer can follow documented steps to reproduce the
   current project state from a fresh clone.
2. **Automation target** — every documented manual step is a candidate for scripted
   automation in a later phase. Steps are captured now so they can be eliminated later.

When implementing any phase:
- Record every command that must be run manually
- Document every file that must be edited by hand, and what must change
- Flag any step that requires a decision or user input
- Write scripts incrementally: if a step is repeated more than once, automate it

The end goal (Phase 6) is a single command that accepts a content source and a minimal
config and produces a fully built, previewable site with no further manual intervention.
Agent-callable interfaces should be non-interactive and driven entirely by `site.config.js`.


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
This template is pipeline-agnostic — it accepts raw markdown from any source. The expected
input is a `content/` directory (gitignored, always externally provided) containing:
- Markdown or MDX files with frontmatter (`title`, `date`, `categories`, `tags`)
- `_meta.js` files for manual page ordering and per-page theme overrides
- A `site.config.js` with site name, base URL, deployment path, and theme fields

For local development, populate `content/` by copying from `examples/frww`.


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
Two fields in `site.config.js` drive all color decisions across the site:

- `content_style` — describes the nature of the content (e.g. technical, narrative, minimal)
- `theme_mood` — describes the intended emotional tone (e.g. calm, bold, professional)

The combination of these two fields maps to a pre-defined 2–3 tone color palette drawn from a
well-known color library (TBD — candidates: Open Color, Tailwind, Material Design). The mapping
is an associative table: `(style, mood) → [primary, secondary, accent?]`.

Output: CSS custom properties injected at build time, applied site-wide. All components
(including the logo) reference these variables, so the palette is the single source of truth.

Phase 1: Palette manually set in `site.config.js`. Phase 2: Palette derived automatically from
`content_style` + `theme_mood` via the associative map.


## Semantic Search
Search is context-aware and page-scoped. Rather than a single global index, `mdpub` generates
a per-page JSON index file at build time:

- **Location**: `public/search/<page-slug>.json` (or equivalent static path)
- **Contents**: relational similarity data — the current page's relationship to every other page
  on the site, plus optional external references ranked by relevance
- **Query model**: client-side only — when the user searches on a given page, only that page's
  index file is fetched and queried; no server required
- **Result shape** (draft): `[{title, slug, excerpt, score, external?}]`

Phase 1: Nextra built-in keyword search. Phase 2: Replace search bar component with the
page-scoped semantic search, consuming the pre-computed index.


## Logo Generation
Logo generation is a build-time utility within `nlp-mdsite`. It produces a static SVG written
to `public/` (used as both the site logo and favicon).

**Inputs** (from `site.config.js`):
- `content_style` and `theme_mood` — determine icon selection and background shape
- `title` — used as an optional text layer or to seed icon selection
- `logo_seed` — integer seed stored in `site.config.js`; changing it reshuffles the output

**Composition** (layered SVG):
1. Background shape: one of square, circle, or triangle
2. Foreground icon or text: Text or one Bootstrap icon, selected and positioned over the background
3. Optional second shape or icon layer for variation

All colors are drawn from the site's active theme palette (CSS custom properties → resolved
at build time).

**Reseed workflow**: update `logo_seed` in `site.config.js`, run `mdpub build` — a new
SVG is generated without changing any other config.

Phase 2: user selects specific layers and icons from a pre-defined set rather than relying
on the seed.


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
- `content_style` and `theme_mood`: valid vocabulary / label set (TBD — define before implementing the theming associative map)
- Color library selection: Open Color, Tailwind, or Material Design (TBD)
- Search result shape: finalize the per-page index JSON schema
- `site.config.js` full schema: document all expected fields and their types
