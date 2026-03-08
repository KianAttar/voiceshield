import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DropZone from '../DropZone'
import { mockApi } from './setup'

beforeEach(() => {
  vi.clearAllMocks()
})

function createDropEvent(files: { name: string; size: number; path: string }[]) {
  const fileList = files.map((f) => {
    const file = new File([new ArrayBuffer(f.size)], f.name, { type: 'video/mp4' })
    Object.defineProperty(file, 'path', { value: f.path, writable: false })
    return file
  })

  const dataTransfer = {
    files: fileList,
    types: ['Files']
  }

  return dataTransfer
}

describe('DropZone', () => {
  it('renders helper text', () => {
    render(<DropZone onFilesAdded={vi.fn()} disabled={false} />)
    expect(screen.getByText('Drop your video files here, or click to browse')).toBeInTheDocument()
  })

  it('accepts drag-and-drop of valid video files', () => {
    const onFilesAdded = vi.fn()
    render(<DropZone onFilesAdded={onFilesAdded} disabled={false} />)

    const dropZone = screen.getByText('Drop your video files here, or click to browse').closest('div[class*="border-dashed"]')!
    const dt = createDropEvent([
      { name: 'video.mp4', size: 1000, path: '/test/video.mp4' },
      { name: 'clip.mkv', size: 2000, path: '/test/clip.mkv' }
    ])

    fireEvent.drop(dropZone, { dataTransfer: dt })

    expect(onFilesAdded).toHaveBeenCalledWith([
      { path: '/test/video.mp4', name: 'video.mp4', size: 1000 },
      { path: '/test/clip.mkv', name: 'clip.mkv', size: 2000 }
    ])
  })

  it('rejects non-video files', () => {
    const onFilesAdded = vi.fn()
    render(<DropZone onFilesAdded={onFilesAdded} disabled={false} />)

    const dropZone = screen.getByText('Drop your video files here, or click to browse').closest('div[class*="border-dashed"]')!
    const dt = createDropEvent([
      { name: 'document.pdf', size: 500, path: '/test/document.pdf' }
    ])

    fireEvent.drop(dropZone, { dataTransfer: dt })

    expect(onFilesAdded).not.toHaveBeenCalled()
  })

  it('shows visual active state during dragover', () => {
    render(<DropZone onFilesAdded={vi.fn()} disabled={false} />)

    const dropZone = screen.getByText('Drop your video files here, or click to browse').closest('div[class*="border-dashed"]')!

    expect(dropZone.className).not.toContain('border-indigo-500')

    fireEvent.dragOver(dropZone, { dataTransfer: { types: ['Files'] } })

    expect(dropZone.className).toContain('border-indigo-500')
  })

  it('clicking opens a file picker via window.api', async () => {
    const user = userEvent.setup()
    const onFilesAdded = vi.fn()
    mockApi.selectFiles.mockResolvedValue([
      { path: '/selected/video.mp4', name: 'video.mp4', size: 3000 }
    ])

    render(<DropZone onFilesAdded={onFilesAdded} disabled={false} />)

    await user.click(screen.getByText('Drop your video files here, or click to browse'))

    expect(mockApi.selectFiles).toHaveBeenCalled()
    expect(onFilesAdded).toHaveBeenCalledWith([
      { path: '/selected/video.mp4', name: 'video.mp4', size: 3000 }
    ])
  })

  it('has -webkit-app-region: no-drag so clicks are not consumed by Electron drag', () => {
    render(<DropZone onFilesAdded={vi.fn()} disabled={false} />)
    const dropZone = screen.getByText('Drop your video files here, or click to browse').closest('div[class*="border-dashed"]')!
    const style = (dropZone as HTMLElement).style
    const region = style.getPropertyValue('-webkit-app-region') || (style as unknown as Record<string, string>)['WebkitAppRegion']
    expect(region).toBe('no-drag')
  })

  it('does not accept drops when disabled', () => {
    const onFilesAdded = vi.fn()
    render(<DropZone onFilesAdded={onFilesAdded} disabled={true} />)

    const dropZone = screen.getByText('Drop your video files here, or click to browse').closest('div[class*="border-dashed"]')!
    const dt = createDropEvent([
      { name: 'video.mp4', size: 1000, path: '/test/video.mp4' }
    ])

    fireEvent.drop(dropZone, { dataTransfer: dt })

    expect(onFilesAdded).not.toHaveBeenCalled()
  })
})
