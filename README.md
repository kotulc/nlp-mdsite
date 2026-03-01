# nlp-mdsite
A next.js powered static templating engine for intelligent website configuration and design

`nlp-mdsite` includes a simple minimalist mobile-first site template along with the functionality to automatically build and deploy a static website.


## Purpose
The ultimate goal of this project is to create a one click "push-button" solution to easily build, locally preview and deploy a website from a collection of markdown files with a configurable template built around the latest UI/UX stack and technologies to deliver an unparalleled mobile-first reading and navigation experience. Initially the implementation will use well tested and supported off the shelf components and then incrementally add custom components to streamline the user experience.

This project will initially use Nextjs and Nextra as the build framework and github pages for publishing but future extensions will be geared towards minimizing external dependencies.


## Planned Workflow
- Export existing mdx to content/ directory
- Integrate additional page metadata into page frontmatter
- Use _meta.js for manual order + per-page theme toggles
- Add pageIndex component that uses Nextra's page tree for page sorting
- Use Nextra docs theme as a starter
- Later build custom theme (see nextra docs)


## Features
- Nextjs and Nextra MDX based static site generation
- Simple Github actions based deployment workflow
- Integrates with existing configurable CLI-based pipelines (`mdpub`)
- Minimalist mobile-first site layout
- Project and folder level routing and configuration


## Intergrations
This template is intended to integrate with the `mdpub` CLI https://github.com/kotulc/nlp-mdpub as the publication build and deployment components and Nextra as the “renderer/build step” at the end of this CLI pipeline.

- Mdpub init installs all Nextjs/Nextra dependencies as needed
- Mdpub init command copies `mdsite` to dest/content, updates site name/title/path
- Mdpub commands support content build/previews/publishing the resulting site MDX
