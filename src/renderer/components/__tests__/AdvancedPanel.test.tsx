import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdvancedPanel from '../AdvancedPanel'

function defaultProps(overrides = {}) {
  return {
    pitchSemitones: -3,
    formant: 1.12,
    robotic: false,
    echo: false,
    outputFormat: 'same' as const,
    outputFolder: null,
    onPitchChange: vi.fn(),
    onFormantChange: vi.fn(),
    onRoboticChange: vi.fn(),
    onEchoChange: vi.fn(),
    onOutputFormatChange: vi.fn(),
    onSelectOutputFolder: vi.fn(),
    ...overrides
  }
}

describe('AdvancedPanel', () => {
  it('pitch slider has correct min, max, and value', () => {
    render(<AdvancedPanel {...defaultProps()} />)
    const slider = screen.getAllByRole('slider')[0]
    expect(slider).toHaveAttribute('min', '-8')
    expect(slider).toHaveAttribute('max', '8')
    expect(slider).toHaveValue('-3')
  })

  it('formant slider has correct min, max, and value', () => {
    render(<AdvancedPanel {...defaultProps()} />)
    const slider = screen.getAllByRole('slider')[1]
    expect(slider).toHaveAttribute('min', '0.8')
    expect(slider).toHaveAttribute('max', '1.4')
    expect(slider).toHaveValue('1.12')
  })

  it('changing pitch slider calls onPitchChange', () => {
    const onPitchChange = vi.fn()
    render(<AdvancedPanel {...defaultProps({ onPitchChange })} />)
    const slider = screen.getAllByRole('slider')[0]
    fireEvent.change(slider, { target: { value: '2' } })
    expect(onPitchChange).toHaveBeenCalledWith(2)
  })

  it('changing formant slider calls onFormantChange', () => {
    const onFormantChange = vi.fn()
    render(<AdvancedPanel {...defaultProps({ onFormantChange })} />)
    const slider = screen.getAllByRole('slider')[1]
    fireEvent.change(slider, { target: { value: '1.25' } })
    expect(onFormantChange).toHaveBeenCalledWith(1.25)
  })

  it('robotic checkbox toggles correctly', async () => {
    const user = userEvent.setup()
    const onRoboticChange = vi.fn()
    render(<AdvancedPanel {...defaultProps({ onRoboticChange })} />)

    const checkbox = screen.getByRole('checkbox', { name: /robotic/i })
    await user.click(checkbox)
    expect(onRoboticChange).toHaveBeenCalledWith(true)
  })

  it('echo checkbox toggles correctly', async () => {
    const user = userEvent.setup()
    const onEchoChange = vi.fn()
    render(<AdvancedPanel {...defaultProps({ onEchoChange })} />)

    const checkbox = screen.getByRole('checkbox', { name: /echo/i })
    await user.click(checkbox)
    expect(onEchoChange).toHaveBeenCalledWith(true)
  })

  it('output format selector shows all 4 options', () => {
    render(<AdvancedPanel {...defaultProps()} />)
    const select = screen.getByRole('combobox')
    const options = select.querySelectorAll('option')
    expect(options).toHaveLength(4)
    expect(options[0]).toHaveTextContent('Same as input')
    expect(options[1]).toHaveTextContent('MP4')
    expect(options[2]).toHaveTextContent('MKV')
    expect(options[3]).toHaveTextContent('WebM')
  })

  it('output folder picker triggers folder selection', async () => {
    const user = userEvent.setup()
    const onSelectOutputFolder = vi.fn()
    render(<AdvancedPanel {...defaultProps({ onSelectOutputFolder })} />)

    const folderButton = screen.getByText('Same as input file (default)')
    await user.click(folderButton)
    expect(onSelectOutputFolder).toHaveBeenCalledTimes(1)
  })

  it('displays custom output folder path when set', () => {
    render(<AdvancedPanel {...defaultProps({ outputFolder: '/custom/path' })} />)
    expect(screen.getByText('/custom/path')).toBeInTheDocument()
  })
})
