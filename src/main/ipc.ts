import { ipcMain, dialog, shell, BrowserWindow } from 'electron'
import type { IpcMainEvent, IpcMainInvokeEvent } from 'electron'
import path from 'path'
import fs from 'fs'
import { IPC } from '../shared/ipcChannels'
import type { ProcessingOptions, FFmpegCapabilities } from '../shared/types'
import { checkRubberbandSupport, processFile, cancelProcess } from './ffmpeg'

interface FileInfo {
  path: string
  name: string
  size: number
}

export function registerIpcHandlers(): void {
  ipcMain.handle(
    IPC.SELECT_FILES,
    async (_event: IpcMainInvokeEvent): Promise<FileInfo[]> => {
      const result = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Video Files', extensions: ['mp4', 'mkv', 'mov', 'webm', 'avi'] }]
      })
      if (result.canceled) return []
      return result.filePaths.map((filePath) => ({
        path: filePath,
        name: path.basename(filePath),
        size: fs.statSync(filePath).size
      }))
    }
  )

  ipcMain.handle(
    IPC.SELECT_FOLDER,
    async (_event: IpcMainInvokeEvent): Promise<string | null> => {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory']
      })
      if (result.canceled) return null
      return result.filePaths[0]
    }
  )

  ipcMain.handle(
    IPC.GET_CAPABILITIES,
    async (_event: IpcMainInvokeEvent): Promise<FFmpegCapabilities> => {
      const hasRubberband = await checkRubberbandSupport()
      return { hasRubberband }
    }
  )

  ipcMain.on(
    IPC.PROCESS_FILE,
    (
      event: IpcMainEvent,
      payload: { fileId: string; inputPath: string; options: ProcessingOptions }
    ) => {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (!win) return

      processFile({
        fileId: payload.fileId,
        inputPath: payload.inputPath,
        options: payload.options,
        onProgress: (fileId, percent) => {
          if (!win.isDestroyed()) {
            win.webContents.send(IPC.PROGRESS, { fileId, percent })
          }
        },
        onComplete: (fileId, outputPath) => {
          if (!win.isDestroyed()) {
            win.webContents.send(IPC.DONE, { fileId, outputPath })
          }
        },
        onError: (fileId, message) => {
          if (!win.isDestroyed()) {
            win.webContents.send(IPC.ERROR, { fileId, message })
          }
        }
      })
    }
  )

  ipcMain.on(IPC.CANCEL_FILE, (_event: IpcMainEvent, payload: { fileId: string }) => {
    cancelProcess(payload.fileId)
  })

  ipcMain.on(IPC.OPEN_FOLDER, (_event: IpcMainEvent, folderPath: string) => {
    shell.openPath(folderPath)
  })
}
