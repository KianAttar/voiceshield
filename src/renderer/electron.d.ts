import type {
  ProcessingOptions,
  ProgressPayload,
  ResultPayload,
  ErrorPayload,
  FFmpegCapabilities
} from '../shared/types'

interface FileInfo {
  path: string
  name: string
  size: number
}

type CleanupFn = () => void

interface VoiceShieldAPI {
  selectFiles: () => Promise<FileInfo[]>
  selectFolder: () => Promise<string | null>
  getCapabilities: () => Promise<FFmpegCapabilities>
  processFile: (fileId: string, inputPath: string, options: ProcessingOptions) => void
  cancelFile: (fileId: string) => void
  openFolder: (folderPath: string) => void
  onProgress: (callback: (payload: ProgressPayload) => void) => CleanupFn
  onDone: (callback: (payload: ResultPayload) => void) => CleanupFn
  onError: (callback: (payload: ErrorPayload) => void) => CleanupFn
}

declare global {
  interface Window {
    api: VoiceShieldAPI
  }
}
