import { vi } from 'vitest'

export const app = {
  isPackaged: false,
  whenReady: vi.fn().mockResolvedValue(undefined),
  on: vi.fn(),
  quit: vi.fn()
}

export const BrowserWindow = {
  fromWebContents: vi.fn(),
  getAllWindows: vi.fn().mockReturnValue([])
}

export const ipcMain = {
  handle: vi.fn(),
  on: vi.fn(),
  removeHandler: vi.fn()
}

export const ipcRenderer = {
  invoke: vi.fn(),
  send: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn()
}

export const contextBridge = {
  exposeInMainWorld: vi.fn()
}

export const dialog = {
  showOpenDialog: vi.fn()
}

export const shell = {
  openPath: vi.fn()
}
