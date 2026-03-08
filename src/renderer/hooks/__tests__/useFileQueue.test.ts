import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFileQueue } from '../useFileQueue'

describe('useFileQueue', () => {
  it('initial state is an empty array', () => {
    const { result } = renderHook(() => useFileQueue())
    expect(result.current.files).toEqual([])
  })

  it('addFiles() adds files with correct initial shape', () => {
    const { result } = renderHook(() => useFileQueue())

    act(() => {
      result.current.addFiles([
        { path: '/test/video.mp4', name: 'video.mp4', size: 1024 }
      ])
    })

    expect(result.current.files).toHaveLength(1)
    const file = result.current.files[0]
    expect(file.status).toBe('idle')
    expect(file.progress).toBe(0)
    expect(file.name).toBe('video.mp4')
    expect(file.path).toBe('/test/video.mp4')
    expect(file.size).toBe(1024)
    expect(file.id).toBeDefined()
  })

  it('addFiles() ignores duplicate file paths', () => {
    const { result } = renderHook(() => useFileQueue())

    act(() => {
      result.current.addFiles([
        { path: '/test/video.mp4', name: 'video.mp4', size: 1024 }
      ])
    })

    act(() => {
      result.current.addFiles([
        { path: '/test/video.mp4', name: 'video.mp4', size: 1024 },
        { path: '/test/other.mp4', name: 'other.mp4', size: 2048 }
      ])
    })

    expect(result.current.files).toHaveLength(2)
    expect(result.current.files[1].name).toBe('other.mp4')
  })

  it('addFiles() correctly stores size from file', () => {
    const { result } = renderHook(() => useFileQueue())
    const sizeBytes = 600 * 1024 * 1024

    act(() => {
      result.current.addFiles([
        { path: '/test/big.mp4', name: 'big.mp4', size: sizeBytes }
      ])
    })

    expect(result.current.files[0].size).toBe(sizeBytes)
  })

  it('updateStatus() updates the correct file by id, leaves others unchanged', () => {
    const { result } = renderHook(() => useFileQueue())

    act(() => {
      result.current.addFiles([
        { path: '/a.mp4', name: 'a.mp4', size: 100 },
        { path: '/b.mp4', name: 'b.mp4', size: 200 }
      ])
    })

    const idA = result.current.files[0].id
    const idB = result.current.files[1].id

    act(() => {
      result.current.updateStatus(idA, 'processing')
    })

    expect(result.current.files.find((f) => f.id === idA)?.status).toBe('processing')
    expect(result.current.files.find((f) => f.id === idB)?.status).toBe('idle')
  })

  it('updateStatus() sets errorMessage on error', () => {
    const { result } = renderHook(() => useFileQueue())

    act(() => {
      result.current.addFiles([{ path: '/a.mp4', name: 'a.mp4', size: 100 }])
    })

    const id = result.current.files[0].id

    act(() => {
      result.current.updateStatus(id, 'error', 'Something went wrong')
    })

    expect(result.current.files[0].status).toBe('error')
    expect(result.current.files[0].errorMessage).toBe('Something went wrong')
  })

  it('updateProgress() updates progress for the correct file only', () => {
    const { result } = renderHook(() => useFileQueue())

    act(() => {
      result.current.addFiles([
        { path: '/a.mp4', name: 'a.mp4', size: 100 },
        { path: '/b.mp4', name: 'b.mp4', size: 200 }
      ])
    })

    const idA = result.current.files[0].id

    act(() => {
      result.current.updateProgress(idA, 75)
    })

    expect(result.current.files[0].progress).toBe(75)
    expect(result.current.files[1].progress).toBe(0)
  })

  it('removeFile() removes the correct file by id', () => {
    const { result } = renderHook(() => useFileQueue())

    act(() => {
      result.current.addFiles([
        { path: '/a.mp4', name: 'a.mp4', size: 100 },
        { path: '/b.mp4', name: 'b.mp4', size: 200 }
      ])
    })

    const idA = result.current.files[0].id

    act(() => {
      result.current.removeFile(idA)
    })

    expect(result.current.files).toHaveLength(1)
    expect(result.current.files[0].name).toBe('b.mp4')
  })

  it('clearCompleted() removes only done files', () => {
    const { result } = renderHook(() => useFileQueue())

    act(() => {
      result.current.addFiles([
        { path: '/a.mp4', name: 'a.mp4', size: 100 },
        { path: '/b.mp4', name: 'b.mp4', size: 200 }
      ])
    })

    act(() => {
      result.current.updateStatus(result.current.files[0].id, 'done')
    })

    act(() => {
      result.current.clearCompleted()
    })

    expect(result.current.files).toHaveLength(1)
    expect(result.current.files[0].name).toBe('b.mp4')
  })

  it('reset() clears all files', () => {
    const { result } = renderHook(() => useFileQueue())

    act(() => {
      result.current.addFiles([
        { path: '/a.mp4', name: 'a.mp4', size: 100 }
      ])
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.files).toEqual([])
  })
})
