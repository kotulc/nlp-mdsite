const fs   = require('fs')
const path = require('path')

const OUT = path.join(__dirname, '../../out')


test('test_build_out_dir_exists', () => {
  /** out/ directory is present after a successful build. */
  expect(fs.existsSync(OUT)).toBe(true)
})

test('test_build_index_page_exists', () => {
  /** Static export includes the home page. */
  expect(fs.existsSync(path.join(OUT, 'index.html'))).toBe(true)
})

test('test_build_post_years_exist', () => {
  /** Static export includes at least one year of posts. */
  const posts_dir = path.join(OUT, 'posts')
  expect(fs.existsSync(posts_dir)).toBe(true)
  const year_dirs = fs.readdirSync(posts_dir).filter(
    f => fs.statSync(path.join(posts_dir, f)).isDirectory()
  )
  expect(year_dirs.length).toBeGreaterThan(0)
})

test('test_build_images_copied', () => {
  /** Image assets are present in the exported output. */
  expect(fs.existsSync(path.join(OUT, 'images'))).toBe(true)
  expect(fs.existsSync(path.join(OUT, 'images', 'posts'))).toBe(true)
})

test('test_build_posts_index_json_copied', () => {
  /** posts-index.json is included in the static export. */
  expect(fs.existsSync(path.join(OUT, 'posts-index.json'))).toBe(true)
})
