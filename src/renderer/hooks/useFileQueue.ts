import { useState, useCallback } from 'react'
import type { QueueFile } from '../../shared/types'

interface FileInput {
  path: string
  name: string
  size: number
}

interface UseFileQueueReturn {
  files: QueueFile[]
  addFiles: (newFiles: FileInput[]) => void
  removeFile: (id: string) => void
  updateStatus: (id: string, status: QueueFile['status'], errorMessage?: string) => void
  updateProgress: (id: string, progress: number) => void
  clearCompleted: () => void
  reset: () => void
}

let nextId = 1

export function useFileQueue(): UseFileQueueReturn {
  const [files, setFiles] = useState<QueueFile[]>([])

  const addFiles = useCallback((newFiles: FileInput[]) => {
    setFiles((prev) => {
      const existingPaths = new Set(prev.map((f) => f.path))
      const unique = newFiles.filter((f) => !existingPaths.has(f.path))
      const queueFiles: QueueFile[] = unique.map((f) => ({
        id: String(nextId++),
        path: f.path,
        name: f.name,
        size: f.size,
        status: 'idle' as const,
        progress: 0
      }))
      return [...prev, ...queueFiles]
    })
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const updateStatus = useCallback(
    (id: string, status: QueueFile['status'], errorMessage?: string) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status, errorMessage } : f))
      )
    },
    []
  )

  const updateProgress = useCallback((id: string, progress: number) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, progress } : f))
    )
  }, [])

  const clearCompleted = useCallback(() => {
    setFiles((prev) => prev.filter((f) => f.status !== 'done'))
  }, [])

  const reset = useCallback(() => {
    setFiles([])
  }, [])

  return { files, addFiles, removeFile, updateStatus, updateProgress, clearCompleted, reset }
}
