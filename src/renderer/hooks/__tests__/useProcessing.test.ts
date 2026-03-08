import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProcessing } from '../useProcessing'
import type { QueueFile, ProcessingOptions } from '../../../shared/types'

type Callback = (payload: Record<string, unknown>) => void

let progressCallbacks: Callback[] = []
let doneCallbacks: Callback[] = []
let errorCallbacks: Callback[] = []

const mockApi = {
  getCapabilities: vi.fn().mockResolvedValue({ hasRubberband: true }),
  processFile: vi.fn(),
  cancelFile: vi.fn(),
  selectFiles: vi.fn(),
  selectFolder: vi.fn(),
  openFolder: vi.fn(),
  onProgress: vi.fn((cb: Callback) => {
    progressCallbacks.push(cb)
    return () => {
      progressCallbacks = progressCallbacks.filter((c) => c !== cb)
    }
  }),
  onDone: vi.fn((cb: Callback) => {
    doneCallbacks.push(cb)
    return () => {
      doneCallbacks = doneCallbacks.filter((c) => c !== cb)
    }
  }),
  onError: vi.fn((cb: Callback) => {
    errorCallbacks.push(cb)
    return () => {
      errorCallbacks = errorCallbacks.filter((c) => c !== cb)
    }
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  progressCallbacks = []
  doneCallbacks = []
  errorCallbacks = []
  Object.defineProperty(window, 'api', { value: mockApi, writable: true })
})

function makeFile(id: string, status: QueueFile['status'] = 'idle'): QueueFile {
  return { id, path: `/${id}.mp4`, name: `${id}.mp4`, size: 1000, status, progress: 0 }
}

function defaultGetOptions(): ProcessingOptions {
  return {
    pitch: 0.84,
    formant: 1.12,
    robotic: false,
    echo: false,
    outputFormat: 'same',
    outputFolder: null
  }
}

describe('useProcessing', () => {
  it('initial state is idle', async () => {
    const { result } = renderHook(() =>
      useProcessing({
        files: [],
        updateStatus: vi.fn(),
        updateProgress: vi.fn(),
        getOptions: defaultGetOptions
      })
    )

    await vi.waitFor(() => {
      expect(result.current.state).toBe('idle')
    })
  })

  it('startProcessing() does nothing if queue is empty', async () => {
    const updateStatus = vi.fn()
    const { result } = renderHook(() =>
      useProcessing({
        files: [],
        updateStatus,
        updateProgress: vi.fn(),
        getOptions: defaultGetOptions
      })
    )

    await vi.waitFor(() => expect(mockApi.getCapabilities).toHaveBeenCalled())

    act(() => {
      result.current.startProcessing()
    })

    expect(result.current.state).toBe('idle')
    expect(mockApi.processFile).not.toHaveBeenCalled()
  })

  it('startProcessing() sends PROCESS_FILE for each idle file', async () => {
    const files = [makeFile('a'), makeFile('b')]
    const updateStatus = vi.fn()

    const { result } = renderHook(() =>
      useProcessing({
        files,
        updateStatus,
        updateProgress: vi.fn(),
        getOptions: defaultGetOptions
      })
    )

    await vi.waitFor(() => expect(mockApi.getCapabilities).toHaveBeenCalled())

    act(() => {
      result.current.startProcessing()
    })

    expect(result.current.state).toBe('processing')
    expect(updateStatus).toHaveBeenCalledWith('a', 'processing')
    expect(mockApi.processFile).toHaveBeenCalledWith('a', '/a.mp4', expect.any(Object))

    // Simulate first file done
    act(() => {
      for (const cb of doneCallbacks) {
        cb({ fileId: 'a', outputPath: '/output/a_anon.mp4' })
      }
    })

    expect(updateStatus).toHaveBeenCalledWith('a', 'done')
    expect(mockApi.processFile).toHaveBeenCalledWith('b', '/b.mp4', expect.any(Object))
  })

  it('startProcessing() does nothing if already processing', async () => {
    const files = [makeFile('a')]
    const updateStatus = vi.fn()

    const { result } = renderHook(() =>
      useProcessing({
        files,
        updateStatus,
        updateProgress: vi.fn(),
        getOptions: defaultGetOptions
      })
    )

    await vi.waitFor(() => expect(mockApi.getCapabilities).toHaveBeenCalled())

    act(() => {
      result.current.startProcessing()
    })

    act(() => {
      result.current.startProcessing()
    })

    // processFile should only be called once for the first file
    expect(mockApi.processFile).toHaveBeenCalledTimes(1)
  })

  it('progress IPC events update the correct file', async () => {
    const files = [makeFile('a')]
    const updateProgress = vi.fn()

    renderHook(() =>
      useProcessing({
        files,
        updateStatus: vi.fn(),
        updateProgress,
        getOptions: defaultGetOptions
      })
    )

    await vi.waitFor(() => expect(mockApi.getCapabilities).toHaveBeenCalled())

    act(() => {
      for (const cb of progressCallbacks) {
        cb({ fileId: 'a', percent: 42 })
      }
    })

    expect(updateProgress).toHaveBeenCalledWith('a', 42)
  })

  it('on error, file status is set to error with message', async () => {
    const files = [makeFile('a')]
    const updateStatus = vi.fn()

    const { result } = renderHook(() =>
      useProcessing({
        files,
        updateStatus,
        updateProgress: vi.fn(),
        getOptions: defaultGetOptions
      })
    )

    await vi.waitFor(() => expect(mockApi.getCapabilities).toHaveBeenCalled())

    act(() => {
      result.current.startProcessing()
    })

    act(() => {
      for (const cb of errorCallbacks) {
        cb({ fileId: 'a', message: 'No audio' })
      }
    })

    expect(updateStatus).toHaveBeenCalledWith('a', 'error', 'No audio')
  })

  it('state becomes done after all files complete', async () => {
    const files = [makeFile('a')]
    const updateStatus = vi.fn()

    const { result } = renderHook(() =>
      useProcessing({
        files,
        updateStatus,
        updateProgress: vi.fn(),
        getOptions: defaultGetOptions
      })
    )

    await vi.waitFor(() => expect(mockApi.getCapabilities).toHaveBeenCalled())

    act(() => {
      result.current.startProcessing()
    })

    act(() => {
      for (const cb of doneCallbacks) {
        cb({ fileId: 'a', outputPath: '/out/a_anon.mp4' })
      }
    })

    expect(result.current.state).toBe('done')
  })
})
