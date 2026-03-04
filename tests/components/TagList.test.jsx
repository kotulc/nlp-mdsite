import { render, screen } from '@testing-library/react'
import TagList from '../../components/TagList'


test('test_tag_list_renders_categories_and_tags', () => {
  /** Renders all categories and tags as chips. */
  render(<TagList categories={['reviews', 'events']} tags={['ai', 'wheels']} />)
  expect(screen.getByText('reviews')).toBeInTheDocument()
  expect(screen.getByText('events')).toBeInTheDocument()
  expect(screen.getByText('ai')).toBeInTheDocument()
  expect(screen.getByText('wheels')).toBeInTheDocument()
})

test('test_tag_list_category_chip_class', () => {
  /** Category chips have chip-category class, tag chips have chip-tag class. */
  render(<TagList categories={['opinion']} tags={['gear']} />)
  expect(screen.getByText('opinion')).toHaveClass('chip-category')
  expect(screen.getByText('gear')).toHaveClass('chip-tag')
})

test('test_tag_list_returns_null_when_empty', () => {
  /** Returns nothing when both arrays are empty. */
  const { container } = render(<TagList categories={[]} tags={[]} />)
  expect(container).toBeEmptyDOMElement()
})

test('test_tag_list_handles_categories_only', () => {
  /** Renders correctly with categories but no tags. */
  render(<TagList categories={['long-term']} />)
  expect(screen.getByText('long-term')).toBeInTheDocument()
})
