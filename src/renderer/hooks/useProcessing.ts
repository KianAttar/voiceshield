import { useState, useEffect, useCallback, useRef } from 'react'
import type { QueueFile, ProcessingOptions } from '../../shared/types'

type ProcessingState = 'idle' | 'processing' | 'done'

interface UseProcessingArgs {
  files: QueueFile[]
  updateStatus: (id: string, status: QueueFile['status'], errorMessage?: string) => void
  updateProgress: (id: string, progress: number) => void
  getOptions: () => ProcessingOptions
}

interface UseProcessingReturn {
  state: ProcessingState
  startProcessing: () => void
  hasRubberband: boolean | null
  outputFolders: string[]
}

export function useProcessing({
  files,
  updateStatus,
  updateProgress,
  getOptions
}: UseProcessingArgs): UseProcessingReturn {
  const [state, setState] = useState<ProcessingState>('idle')
  const [hasRubberband, setHasRubberband] = useState<boolean | null>(null)
  const [outputFolders, setOutputFolders] = useState<string[]>([])

  const queueRef = useRef<QueueFile[]>([])
  const queueIndexRef = useRef(0)
  const optionsRef = useRef<ProcessingOptions | null>(null)
  const processingRef = useRef(false)

  useEffect(() => {
    window.api.getCapabilities().then((caps) => {
      setHasRubberband(caps.hasRubberband)
    })
  }, [])

  const processNext = useCallback(() => {
    const queue = queueRef.current
    const index = queueIndexRef.current

    if (index >= queue.length) {
      setState('done')
      processingRef.current = false
      return
    }

    const file = queue[index]
    updateStatus(file.id, 'processing')
    window.api.processFile(file.id, file.path, optionsRef.current!)
  }, [updateStatus])

  useEffect(() => {
    const cleanupProgress = window.api.onProgress((payload) => {
      updateProgress(payload.fileId, payload.percent)
    })

    const cleanupDone = window.api.onDone((payload) => {
      updateStatus(payload.fileId, 'done')

      const lastSlash = Math.max(
        payload.outputPath.lastIndexOf('/'),
        payload.outputPath.lastIndexOf('\\')
      )
      if (lastSlash > 0) {
        const folder = payload.outputPath.substring(0, lastSlash)
        setOutputFolders((prev) => {
          if (prev.includes(folder)) return prev
          return [...prev, folder]
        })
      }

      queueIndexRef.current++
      processNext()
    })

    const cleanupError = window.api.onError((payload) => {
      updateStatus(payload.fileId, 'error', payload.message)
      queueIndexRef.current++
      processNext()
    })

    return () => {
      cleanupProgress()
      cleanupDone()
      cleanupError()
    }
  }, [updateStatus, updateProgress, processNext])

  const startProcessing = useCallback(() => {
    if (processingRef.current) return
    const idleFiles = files.filter((f) => f.status === 'idle')
    if (idleFiles.length === 0) return

    processingRef.current = true
    queueRef.current = idleFiles
    queueIndexRef.current = 0
    optionsRef.current = getOptions()

    setState('processing')
    setOutputFolders([])
    processNext()
  }, [files, getOptions, processNext])

  return { state, startProcessing, hasRubberband, outputFolders }
}
