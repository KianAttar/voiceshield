import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IPC } from '../../shared/ipcChannels'

vi.mock('electron', () => {
  const handlers = new Map<string, (...args: unknown[]) => unknown>()
  const listeners = new Map<string, (...args: unknown[]) => unknown>()
  return {
    ipcMain: {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler)
      }),
      on: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        listeners.set(channel, handler)
      }),
      _getHandler: (channel: string) => handlers.get(channel),
      _getListener: (channel: string) => listeners.get(channel)
    },
    dialog: {
      showOpenDialog: vi.fn()
    },
    shell: {
      openPath: vi.fn()
    },
    BrowserWindow: {
      fromWebContents: vi.fn()
    }
  }
})

vi.mock('fs', () => ({
  default: { statSync: vi.fn().mockReturnValue({ size: 5000 }) },
  statSync: vi.fn().mockReturnValue({ size: 5000 })
}))

vi.mock('../ffmpeg', () => ({
  checkRubberbandSupport: vi.fn(),
  processFile: vi.fn(),
  cancelProcess: vi.fn()
}))

import { registerIpcHandlers } from '../ipc'
import { ipcMain, dialog, shell, BrowserWindow } from 'electron'
import { checkRubberbandSupport, processFile, cancelProcess } from '../ffmpeg'

function getHandler(channel: string) {
  return (ipcMain as unknown as { _getHandler: (c: string) => (...args: unknown[]) => unknown })._getHandler(channel)
}

function getListener(channel: string) {
  return (ipcMain as unknown as { _getListener: (c: string) => (...args: unknown[]) => unknown })._getListener(channel)
}

beforeEach(() => {
  vi.clearAllMocks()
  registerIpcHandlers()
})

describe('IPC handlers use channel constants', () => {
  it('registers all expected channels', () => {
    const handleCalls = vi.mocked(ipcMain.handle).mock.calls.map((c) => c[0])
    const onCalls = vi.mocked(ipcMain.on).mock.calls.map((c) => c[0])
    const all = [...handleCalls, ...onCalls]

    expect(all).toContain(IPC.SELECT_FILES)
    expect(all).toContain(IPC.SELECT_FOLDER)
    expect(all).toContain(IPC.GET_CAPABILITIES)
    expect(all).toContain(IPC.PROCESS_FILE)
    expect(all).toContain(IPC.CANCEL_FILE)
    expect(all).toContain(IPC.OPEN_FOLDER)
  })
})

describe('SELECT_FOLDER handler', () => {
  it('calls dialog.showOpenDialog and returns selected path', async () => {
    vi.mocked(dialog.showOpenDialog).mockResolvedValue({
      canceled: false,
      filePaths: ['/selected/folder']
    })

    const handler = getHandler(IPC.SELECT_FOLDER)
    const result = await handler({})
    expect(dialog.showOpenDialog).toHaveBeenCalledWith({
      properties: ['openDirectory', 'createDirectory']
    })
    expect(result).toBe('/selected/folder')
  })

  it('returns null when dialog is canceled', async () => {
    vi.mocked(dialog.showOpenDialog).mockResolvedValue({
      canceled: true,
      filePaths: []
    })

    const handler = getHandler(IPC.SELECT_FOLDER)
    const result = await handler({})
    expect(result).toBeNull()
  })
})

describe('GET_CAPABILITIES handler', () => {
  it('returns boolean correctly', async () => {
    vi.mocked(checkRubberbandSupport).mockResolvedValue(true)

    const handler = getHandler(IPC.GET_CAPABILITIES)
    const result = await handler({})
    expect(result).toEqual({ hasRubberband: true })
  })
})

describe('PROCESS_FILE handler', () => {
  it('calls ffmpeg.processFile with correct options', () => {
    const mockWin = {
      isDestroyed: vi.fn().mockReturnValue(false),
      webContents: { send: vi.fn() }
    }
    vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(mockWin as unknown as Electron.BrowserWindow)

    const listener = getListener(IPC.PROCESS_FILE)
    const payload = {
      fileId: 'f1',
      inputPath: '/test.mp4',
      options: {
        pitch: 0.84,
        formant: 1.12,
        robotic: false,
        echo: false,
        outputFormat: 'same' as const,
        outputFolder: null
      }
    }

    listener({ sender: {} }, payload)

    expect(processFile).toHaveBeenCalledWith(
      expect.objectContaining({
        fileId: 'f1',
        inputPath: '/test.mp4',
        options: payload.options
      })
    )
  })

  it('sends progress events during processing', () => {
    const mockWin = {
      isDestroyed: vi.fn().mockReturnValue(false),
      webContents: { send: vi.fn() }
    }
    vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(mockWin as unknown as Electron.BrowserWindow)

    vi.mocked(processFile).mockImplementation(({ onProgress }) => {
      onProgress('f1', 50)
    })

    const listener = getListener(IPC.PROCESS_FILE)
    listener(
      { sender: {} },
      { fileId: 'f1', inputPath: '/test.mp4', options: { pitch: 0.84, formant: 1.12, robotic: false, echo: false, outputFormat: 'same', outputFolder: null } }
    )

    expect(mockWin.webContents.send).toHaveBeenCalledWith(IPC.PROGRESS, { fileId: 'f1', percent: 50 })
  })

  it('sends DONE event on completion', () => {
    const mockWin = {
      isDestroyed: vi.fn().mockReturnValue(false),
      webContents: { send: vi.fn() }
    }
    vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(mockWin as unknown as Electron.BrowserWindow)

    vi.mocked(processFile).mockImplementation(({ onComplete }) => {
      onComplete('f1', '/output/test_anon.mp4')
    })

    const listener = getListener(IPC.PROCESS_FILE)
    listener(
      { sender: {} },
      { fileId: 'f1', inputPath: '/test.mp4', options: { pitch: 0.84, formant: 1.12, robotic: false, echo: false, outputFormat: 'same', outputFolder: null } }
    )

    expect(mockWin.webContents.send).toHaveBeenCalledWith(IPC.DONE, { fileId: 'f1', outputPath: '/output/test_anon.mp4' })
  })

  it('sends ERROR event on failure', () => {
    const mockWin = {
      isDestroyed: vi.fn().mockReturnValue(false),
      webContents: { send: vi.fn() }
    }
    vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(mockWin as unknown as Electron.BrowserWindow)

    vi.mocked(processFile).mockImplementation(({ onError }) => {
      onError('f1', 'Processing failed.')
    })

    const listener = getListener(IPC.PROCESS_FILE)
    listener(
      { sender: {} },
      { fileId: 'f1', inputPath: '/test.mp4', options: { pitch: 0.84, formant: 1.12, robotic: false, echo: false, outputFormat: 'same', outputFolder: null } }
    )

    expect(mockWin.webContents.send).toHaveBeenCalledWith(IPC.ERROR, { fileId: 'f1', message: 'Processing failed.' })
  })
})

describe('CANCEL_FILE handler', () => {
  it('calls cancelProcess', () => {
    const listener = getListener(IPC.CANCEL_FILE)
    listener({}, { fileId: 'f1' })
    expect(cancelProcess).toHaveBeenCalledWith('f1')
  })
})

describe('OPEN_FOLDER handler', () => {
  it('calls shell.openPath with correct path', () => {
    const listener = getListener(IPC.OPEN_FOLDER)
    listener({}, '/output/folder')
    expect(shell.openPath).toHaveBeenCalledWith('/output/folder')
  })
})
