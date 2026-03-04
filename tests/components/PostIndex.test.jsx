import { render, screen, waitFor } from '@testing-library/react'
import PostIndex from '../../components/PostIndex'


const MOCK_POSTS = [
  {
    slug: 'newest-post', title: 'Newest Post', date: '2023-03-20',
    categories: ['reviews'], tags: ['wheels'], reading_time: 4,
    url: '/posts/2023/newest-post',
  },
  {
    slug: 'older-post', title: 'Older Post', date: '2020-01-01',
    categories: [], tags: [], reading_time: 2,
    url: '/posts/2020/older-post',
  },
]

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ json: () => Promise.resolve(MOCK_POSTS) })
  )
})

afterEach(() => { jest.restoreAllMocks() })


test('test_post_index_renders_all_posts', async () => {
  /** Renders titles for all posts returned by the index. */
  render(<PostIndex />)
  await waitFor(() => screen.getByText('Newest Post'))
  expect(screen.getByText('Newest Post')).toBeInTheDocument()
  expect(screen.getByText('Older Post')).toBeInTheDocument()
})

test('test_post_index_shows_reading_time', async () => {
  /** Each post entry shows its reading time. */
  render(<PostIndex />)
  await waitFor(() => screen.getByText('Newest Post'))
  expect(screen.getByText(/4 min read/i)).toBeInTheDocument()
})

test('test_post_index_shows_category_chips', async () => {
  /** Posts with categories render chip elements. */
  render(<PostIndex />)
  await waitFor(() => screen.getByText('reviews'))
  expect(screen.getByText('reviews')).toHaveClass('chip-category')
})

test('test_post_index_preserves_order', async () => {
  /** Posts are rendered in the order returned by the index (newest first). */
  render(<PostIndex />)
  await waitFor(() => screen.getByText('Newest Post'))
  const titles = screen.getAllByRole('link').map(el => el.textContent)
  expect(titles.indexOf('Newest Post')).toBeLessThan(titles.indexOf('Older Post'))
})
