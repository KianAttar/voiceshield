import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PresetCard from '../PresetCard'

describe('PresetCard', () => {
  const tooltipText = 'Recommended for most cases.'

  it('renders label text', () => {
    render(
      <PresetCard label="Moderate" tooltip={tooltipText} selected={false} onClick={vi.fn()} />
    )
    expect(screen.getByText('Moderate')).toBeInTheDocument()
  })

  it('clicking calls onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <PresetCard label="Moderate" tooltip={tooltipText} selected={false} onClick={onClick} />
    )

    await user.click(screen.getByText('Moderate'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('selected preset has visually distinct class', () => {
    const { rerender } = render(
      <PresetCard label="Moderate" tooltip={tooltipText} selected={false} onClick={vi.fn()} />
    )

    const cardButton = screen.getByText('Moderate').closest('button[class*="rounded-xl"]')!
    expect(cardButton.className).toContain('border-slate-700')
    expect(cardButton.className).not.toContain('border-indigo-500')

    rerender(
      <PresetCard label="Moderate" tooltip={tooltipText} selected={true} onClick={vi.fn()} />
    )

    expect(cardButton.className).toContain('border-indigo-500')
  })

  it('renders tooltip ? icon', () => {
    render(
      <PresetCard label="Moderate" tooltip={tooltipText} selected={false} onClick={vi.fn()} />
    )
    expect(screen.getByRole('button', { name: 'More info' })).toBeInTheDocument()
  })

  it('renders all 3 presets with correct labels', () => {
    const { unmount: u1 } = render(
      <PresetCard label="Subtle" tooltip="t1" selected={false} onClick={vi.fn()} />
    )
    expect(screen.getByText('Subtle')).toBeInTheDocument()
    u1()

    const { unmount: u2 } = render(
      <PresetCard label="Moderate" tooltip="t2" selected={false} onClick={vi.fn()} />
    )
    expect(screen.getByText('Moderate')).toBeInTheDocument()
    u2()

    render(
      <PresetCard label="Strong" tooltip="t3" selected={false} onClick={vi.fn()} />
    )
    expect(screen.getByText('Strong')).toBeInTheDocument()
  })

  it('tooltip text matches spec for each preset', async () => {
    const user = userEvent.setup()

    const tooltips = {
      Subtle: 'Slightly changes the voice. May still sound familiar to someone who knows the speaker well.',
      Moderate: 'Recommended for most cases. Voice is clearly changed but still easy to understand.',
      Strong: 'Maximum anonymization. Voice will sound noticeably different — best for high-sensitivity recordings.'
    }

    for (const [label, tooltip] of Object.entries(tooltips)) {
      const { unmount } = render(
        <PresetCard label={label} tooltip={tooltip} selected={false} onClick={vi.fn()} />
      )

      const trigger = screen.getByRole('button', { name: 'More info' })
      await user.hover(trigger)
      expect(screen.getByText(tooltip)).toBeInTheDocument()
      await user.unhover(trigger)

      unmount()
    }
  })
})
