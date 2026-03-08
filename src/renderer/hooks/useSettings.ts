import { useState, useCallback } from 'react'

type PresetName = 'subtle' | 'moderate' | 'strong' | 'custom'
type OutputFormat = 'same' | 'mp4' | 'mkv' | 'webm'

interface PresetValues {
  pitchSemitones: number
  formant: number
}

const PRESET_VALUES: Record<Exclude<PresetName, 'custom'>, PresetValues> = {
  subtle: { pitchSemitones: -2, formant: 1.06 },
  moderate: { pitchSemitones: -3, formant: 1.12 },
  strong: { pitchSemitones: -4, formant: 1.2 }
}

export interface Settings {
  preset: PresetName
  advancedMode: boolean
  pitchSemitones: number
  formant: number
  robotic: boolean
  echo: boolean
  outputFormat: OutputFormat
  outputFolder: string | null
}

export interface UseSettingsReturn {
  settings: Settings
  setPreset: (preset: Exclude<PresetName, 'custom'>) => void
  toggleAdvanced: () => void
  setPitch: (semitones: number) => void
  setFormant: (value: number) => void
  setRobotic: (value: boolean) => void
  setEcho: (value: boolean) => void
  setOutputFormat: (format: OutputFormat) => void
  setOutputFolder: (folder: string | null) => void
  getPitchRatio: () => number
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<Settings>({
    preset: 'moderate',
    advancedMode: false,
    pitchSemitones: -3,
    formant: 1.12,
    robotic: false,
    echo: false,
    outputFormat: 'same',
    outputFolder: null
  })

  const setPreset = useCallback((preset: Exclude<PresetName, 'custom'>) => {
    const values = PRESET_VALUES[preset]
    setSettings((prev) => ({
      ...prev,
      preset,
      pitchSemitones: values.pitchSemitones,
      formant: values.formant
    }))
  }, [])

  const toggleAdvanced = useCallback(() => {
    setSettings((prev) => ({ ...prev, advancedMode: !prev.advancedMode }))
  }, [])

  const setPitch = useCallback((semitones: number) => {
    const clamped = Math.min(8, Math.max(-8, semitones))
    setSettings((prev) => ({ ...prev, pitchSemitones: clamped, preset: 'custom' as const }))
  }, [])

  const setFormant = useCallback((value: number) => {
    const clamped = Math.min(1.4, Math.max(0.8, value))
    setSettings((prev) => ({ ...prev, formant: clamped, preset: 'custom' as const }))
  }, [])

  const setRobotic = useCallback((value: boolean) => {
    setSettings((prev) => ({ ...prev, robotic: value }))
  }, [])

  const setEcho = useCallback((value: boolean) => {
    setSettings((prev) => ({ ...prev, echo: value }))
  }, [])

  const setOutputFormat = useCallback((format: OutputFormat) => {
    setSettings((prev) => ({ ...prev, outputFormat: format }))
  }, [])

  const setOutputFolder = useCallback((folder: string | null) => {
    setSettings((prev) => ({ ...prev, outputFolder: folder }))
  }, [])

  const getPitchRatio = useCallback((): number => {
    return Math.pow(2, settings.pitchSemitones / 12)
  }, [settings.pitchSemitones])

  return {
    settings,
    setPreset,
    toggleAdvanced,
    setPitch,
    setFormant,
    setRobotic,
    setEcho,
    setOutputFormat,
    setOutputFolder,
    getPitchRatio
  }
}
