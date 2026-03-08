import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'
import { IPC } from '../shared/ipcChannels'
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

const api = {
  selectFiles: (): Promise<FileInfo[]> => ipcRenderer.invoke(IPC.SELECT_FILES),

  selectFolder: (): Promise<string | null> => ipcRenderer.invoke(IPC.SELECT_FOLDER),

  getCapabilities: (): Promise<FFmpegCapabilities> => ipcRenderer.invoke(IPC.GET_CAPABILITIES),

  processFile: (fileId: string, inputPath: string, options: ProcessingOptions): void => {
    ipcRenderer.send(IPC.PROCESS_FILE, { fileId, inputPath, options })
  },

  cancelFile: (fileId: string): void => {
    ipcRenderer.send(IPC.CANCEL_FILE, { fileId })
  },

  openFolder: (folderPath: string): void => {
    ipcRenderer.send(IPC.OPEN_FOLDER, folderPath)
  },

  onProgress: (callback: (payload: ProgressPayload) => void): CleanupFn => {
    const handler = (_event: IpcRendererEvent, payload: ProgressPayload): void =>
      callback(payload)
    ipcRenderer.on(IPC.PROGRESS, handler)
    return () => {
      ipcRenderer.removeListener(IPC.PROGRESS, handler)
    }
  },

  onDone: (callback: (payload: ResultPayload) => void): CleanupFn => {
    const handler = (_event: IpcRendererEvent, payload: ResultPayload): void => callback(payload)
    ipcRenderer.on(IPC.DONE, handler)
    return () => {
      ipcRenderer.removeListener(IPC.DONE, handler)
    }
  },

  onError: (callback: (payload: ErrorPayload) => void): CleanupFn => {
    const handler = (_event: IpcRendererEvent, payload: ErrorPayload): void => callback(payload)
    ipcRenderer.on(IPC.ERROR, handler)
    return () => {
      ipcRenderer.removeListener(IPC.ERROR, handler)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)

export type VoiceShieldAPI = typeof api
