/**
 * Strips malformed EXIF (APP1) segments from JPEG files.
 * Some source images have non-standard orientation values that crash
 * Next.js's get-orientation EXIF parser at build time.
 *
 * Usage (standalone): node scripts/fix-exif.js <file1> [file2 ...]
 * Usage (module):     const { strip_exif, strip_dir } = require('./fix-exif')
 */
const fs = require('fs')
const path = require('path')


function strip_exif(filepath) {
  /** Strip APP1 (EXIF/XMP) segments from a single JPEG file in-place. */
  const src = fs.readFileSync(filepath)
  if (src[0] !== 0xFF || src[1] !== 0xD8) return  // not a JPEG

  const out = [Buffer.from([0xFF, 0xD8])]
  let i = 2

  while (i + 1 < src.length) {
    if (src[i] !== 0xFF) { out.push(src.slice(i)); break }
    const marker = src.readUInt16BE(i)

    if (marker === 0xFFD9) { out.push(src.slice(i)); break }  // EOI

    if ((marker >= 0xFFD0 && marker <= 0xFFD7) || marker === 0xFF01) {
      out.push(src.slice(i, i + 2)); i += 2; continue       // RST/TEM
    }

    const len = src.readUInt16BE(i + 2)

    if (marker === 0xFFE1) {          // APP1 — skip
      i += 2 + len
    } else if (marker === 0xFFDA) {   // SOS — copy SOS + all remaining data
      out.push(src.slice(i)); break
    } else {
      out.push(src.slice(i, i + 2 + len)); i += 2 + len
    }
  }

  fs.writeFileSync(filepath, Buffer.concat(out))
}


function strip_dir(dir) {
  /** Strip EXIF from all JPEG files in a directory (non-recursive). */
  if (!fs.existsSync(dir)) return
  for (const f of fs.readdirSync(dir)) {
    if (/\.(jpg|jpeg)$/i.test(f)) strip_exif(path.join(dir, f))
  }
}


module.exports = { strip_exif, strip_dir }


if (require.main === module) {
  const targets = process.argv.slice(2)
  if (!targets.length) { console.error('Usage: fix-exif.js <file1> [file2 ...]'); process.exit(1) }
  for (const f of targets) { strip_exif(f); console.log(`stripped: ${f}`) }
}
