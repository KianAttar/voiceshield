import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Tooltip from '../Tooltip'

describe('Tooltip', () => {
  it('tooltip content is not visible by default', () => {
    render(<Tooltip text="Test tooltip" />)
    expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument()
  })

  it('tooltip content becomes visible on hover', async () => {
    const user = userEvent.setup()
    render(<Tooltip text="Test tooltip" />)

    const trigger = screen.getByRole('button', { name: 'More info' })
    await user.hover(trigger)

    expect(screen.getByText('Test tooltip')).toBeInTheDocument()
  })

  it('tooltip disappears on mouse leave', async () => {
    const user = userEvent.setup()
    render(<Tooltip text="Test tooltip" />)

    const trigger = screen.getByRole('button', { name: 'More info' })
    await user.hover(trigger)
    expect(screen.getByText('Test tooltip')).toBeInTheDocument()

    await user.unhover(trigger)
    expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument()
  })

  it('renders ? trigger button', () => {
    render(<Tooltip text="Info" />)
    const trigger = screen.getByRole('button', { name: 'More info' })
    expect(trigger).toBeInTheDocument()
    expect(trigger.textContent).toContain('?')
  })
})
