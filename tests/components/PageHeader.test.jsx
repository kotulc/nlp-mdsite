import { render, screen } from '@testing-library/react'
import PageHeader from '../../components/PageHeader'


test('test_page_header_renders_date_and_reading_time', () => {
  /** Renders formatted date and reading time when both are provided. */
  render(<PageHeader date="2023-03-20" reading_time={5} />)
  expect(screen.getByText(/march 20, 2023/i)).toBeInTheDocument()
  expect(screen.getByText(/5 min read/i)).toBeInTheDocument()
})

test('test_page_header_renders_date_only', () => {
  /** Renders date without separator or reading time when reading_time is absent. */
  render(<PageHeader date="2023-01-07" />)
  expect(screen.getByText(/january 7, 2023/i)).toBeInTheDocument()
  expect(screen.queryByText(/min read/)).not.toBeInTheDocument()
})

test('test_page_header_returns_null_without_props', () => {
  /** Returns nothing when neither date nor reading_time is provided. */
  const { container } = render(<PageHeader />)
  expect(container).toBeEmptyDOMElement()
})
