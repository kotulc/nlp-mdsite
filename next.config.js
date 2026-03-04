const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx',
})

module.exports = withNextra({
  output: 'export',
  images: { unoptimized: true },
  basePath: process.env.BASE_PATH || '',
  assetPrefix: process.env.BASE_PATH || '',
})
