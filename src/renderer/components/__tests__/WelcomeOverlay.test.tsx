import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WelcomeOverlay from '../WelcomeOverlay'

beforeEach(() => {
  localStorage.clear()
})

describe('WelcomeOverlay', () => {
  it('shows all 3 onboarding steps', () => {
    render(<WelcomeOverlay onDismiss={vi.fn()} />)

    expect(screen.getByText('Drop your video file onto the app')).toBeInTheDocument()
    expect(screen.getByText('Choose how much to change the voice')).toBeInTheDocument()
    expect(screen.getByText('Click Anonymize and download your file')).toBeInTheDocument()
  })

  it('shows Welcome to VoiceShield heading', () => {
    render(<WelcomeOverlay onDismiss={vi.fn()} />)
    expect(screen.getByText('Welcome to VoiceShield')).toBeInTheDocument()
  })

  it('Next button advances steps', async () => {
    const user = userEvent.setup()
    render(<WelcomeOverlay onDismiss={vi.fn()} />)

    // Step 1 is highlighted (has bg-indigo class)
    const step1 = screen.getByText('Drop your video file onto the app').closest('div[class*="p-3"]')!
    expect(step1.className).toContain('bg-indigo')

    await user.click(screen.getByText('Next'))

    // Step 2 is now highlighted
    const step2 = screen.getByText('Choose how much to change the voice').closest('div[class*="p-3"]')!
    expect(step2.className).toContain('bg-indigo')
  })

  it('Got it button appears on last step and calls onDismiss', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    render(<WelcomeOverlay onDismiss={onDismiss} />)

    await user.click(screen.getByText('Next'))
    await user.click(screen.getByText('Next'))

    const gotItButton = screen.getByText('Got it')
    expect(gotItButton).toBeInTheDocument()

    await user.click(gotItButton)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('Back button goes to previous step', async () => {
    const user = userEvent.setup()
    render(<WelcomeOverlay onDismiss={vi.fn()} />)

    await user.click(screen.getByText('Next'))
    expect(screen.getByText('Back')).toBeInTheDocument()

    await user.click(screen.getByText('Back'))

    // Step 1 should be highlighted again
    const step1 = screen.getByText('Drop your video file onto the app').closest('div[class*="p-3"]')!
    expect(step1.className).toContain('bg-indigo')
  })

  it('Back button is not shown on first step', () => {
    render(<WelcomeOverlay onDismiss={vi.fn()} />)
    expect(screen.queryByText('Back')).not.toBeInTheDocument()
  })

  it('shows step numbers 1, 2, 3', () => {
    render(<WelcomeOverlay onDismiss={vi.fn()} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
