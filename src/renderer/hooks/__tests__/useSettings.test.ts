import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSettings } from '../useSettings'

describe('useSettings', () => {
  it('default preset is "moderate"', () => {
    const { result } = renderHook(() => useSettings())
    expect(result.current.settings.preset).toBe('moderate')
  })

  it('default output format is "same"', () => {
    const { result } = renderHook(() => useSettings())
    expect(result.current.settings.outputFormat).toBe('same')
  })

  it('default output folder is null', () => {
    const { result } = renderHook(() => useSettings())
    expect(result.current.settings.outputFolder).toBeNull()
  })

  it('setPreset() updates preset and pitch/formant correctly', () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.setPreset('subtle')
    })

    expect(result.current.settings.preset).toBe('subtle')
    expect(result.current.settings.pitchSemitones).toBe(-2)
    expect(result.current.settings.formant).toBe(1.06)

    act(() => {
      result.current.setPreset('strong')
    })

    expect(result.current.settings.preset).toBe('strong')
    expect(result.current.settings.pitchSemitones).toBe(-4)
    expect(result.current.settings.formant).toBe(1.2)
  })

  it('setPitch() clamps value between -8 and +8', () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.setPitch(-12)
    })
    expect(result.current.settings.pitchSemitones).toBe(-8)

    act(() => {
      result.current.setPitch(15)
    })
    expect(result.current.settings.pitchSemitones).toBe(8)

    act(() => {
      result.current.setPitch(3)
    })
    expect(result.current.settings.pitchSemitones).toBe(3)
  })

  it('setPitch() sets preset to custom', () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.setPitch(2)
    })
    expect(result.current.settings.preset).toBe('custom')
  })

  it('setFormant() clamps value between 0.80 and 1.40', () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.setFormant(0.5)
    })
    expect(result.current.settings.formant).toBe(0.8)

    act(() => {
      result.current.setFormant(2.0)
    })
    expect(result.current.settings.formant).toBe(1.4)

    act(() => {
      result.current.setFormant(1.1)
    })
    expect(result.current.settings.formant).toBe(1.1)
  })

  it('setOutputFormat() updates output format', () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.setOutputFormat('mp4')
    })
    expect(result.current.settings.outputFormat).toBe('mp4')

    act(() => {
      result.current.setOutputFormat('mkv')
    })
    expect(result.current.settings.outputFormat).toBe('mkv')

    act(() => {
      result.current.setOutputFormat('webm')
    })
    expect(result.current.settings.outputFormat).toBe('webm')

    act(() => {
      result.current.setOutputFormat('same')
    })
    expect(result.current.settings.outputFormat).toBe('same')
  })

  it('setOutputFolder() updates output folder', () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.setOutputFolder('/some/folder')
    })
    expect(result.current.settings.outputFolder).toBe('/some/folder')
  })

  it('toggleAdvanced() toggles advanced mode', () => {
    const { result } = renderHook(() => useSettings())

    expect(result.current.settings.advancedMode).toBe(false)

    act(() => {
      result.current.toggleAdvanced()
    })
    expect(result.current.settings.advancedMode).toBe(true)

    act(() => {
      result.current.toggleAdvanced()
    })
    expect(result.current.settings.advancedMode).toBe(false)
  })

  it('setRobotic() updates robotic flag', () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.setRobotic(true)
    })
    expect(result.current.settings.robotic).toBe(true)
  })

  it('setEcho() updates echo flag', () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.setEcho(true)
    })
    expect(result.current.settings.echo).toBe(true)
  })

  it('getPitchRatio() converts semitones to ratio via 2^(s/12)', () => {
    const { result } = renderHook(() => useSettings())

    // Default is -3 semitones
    expect(result.current.getPitchRatio()).toBeCloseTo(Math.pow(2, -3 / 12), 6)

    act(() => {
      result.current.setPitch(0)
    })
    expect(result.current.getPitchRatio()).toBeCloseTo(1.0, 6)

    act(() => {
      result.current.setPitch(4)
    })
    expect(result.current.getPitchRatio()).toBeCloseTo(Math.pow(2, 4 / 12), 6)
  })
})
