export interface QueueFile {
  id: string
  path: string
  name: string
  size: number
  status: 'idle' | 'processing' | 'done' | 'error'
  progress: number
  errorMessage?: string
}

export interface PresetConfig {
  label: 'Subtle' | 'Moderate' | 'Strong'
  pitch: number
  formant: number
}

export interface ProcessingOptions {
  pitch: number
  formant: number
  robotic: boolean
  echo: boolean
  outputFormat: 'same' | 'mp4' | 'mkv' | 'webm'
  outputFolder: string | null
}

export interface ProgressPayload {
  fileId: string
  percent: number
}

export interface ResultPayload {
  fileId: string
  outputPath: string
}

export interface ErrorPayload {
  fileId: string
  message: string
}

export interface FFmpegCapabilities {
  hasRubberband: boolean
}
