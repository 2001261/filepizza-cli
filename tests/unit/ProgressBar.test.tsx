/// <reference types="@testing-library/jest-dom" />
import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ProgressBar from '../../src/components/ProgressBar'

describe('ProgressBar', () => {
  it('shows percentage', () => {
    const { getAllByText } = render(<ProgressBar value={50} max={100} />)
    expect(getAllByText('50%').length).toBeGreaterThan(0)
  })

  it('exposes byte progress metadata when provided', () => {
    const { container } = render(
      <ProgressBar value={25} max={100} bytes={256} totalBytes={1024} />,
    )
    const node = container.querySelector('#progress-percentage')
    expect(node).not.toBeNull()
    expect(node).toHaveAttribute('data-bytes', '256')
    expect(node).toHaveAttribute('data-total-bytes', '1024')
  })
})
