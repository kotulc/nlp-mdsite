/**
 * Development file watcher.
 * Watches docs/ for .md changes and re-runs ingest automatically.
 * Run in a second terminal alongside `npm run dev` for live reload.
 *
 * Usage: node scripts/watch.js [source-dir]
 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const src = process.argv[2] || path.join(__dirname, '..', 'docs')

fs.watch(src, { recursive: true }, (_, filename) => {
  if (!filename?.endsWith('.md')) return
  console.log(`[watch] ${filename} changed — re-ingesting...`)
  try { execSync(`node ${path.join(__dirname, 'ingest.js')} ${src}`, { stdio: 'inherit' }) }
  catch {}
})

console.log(`[watch] Watching ${src} for changes.`)
console.log('[watch] Run `npm run dev` in a second terminal.')
