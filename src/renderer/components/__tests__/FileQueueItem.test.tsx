import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FileQueueItem from '../FileQueueItem'
import type { QueueFile } from '../../../shared/types'

function makeFile(overrides: Partial<QueueFile> = {}): QueueFile {
  return {
    id: '1',
    path: '/test/video.mp4',
    name: 'video.mp4',
    size: 5_000_000,
    status: 'idle',
    progress: 0,
    ...overrides
  }
}

describe('FileQueueItem', () => {
  it('renders file name and size', () => {
    render(<FileQueueItem file={makeFile()} onRemove={vi.fn()} />)
    expect(screen.getByText('video.mp4')).toBeInTheDocument()
    expect(screen.getByText('5.0 MB')).toBeInTheDocument()
  })

  it('shows progress bar when status is processing', () => {
    const { container } = render(
      <FileQueueItem file={makeFile({ status: 'processing', progress: 50 })} onRemove={vi.fn()} />
    )

    const progressBar = container.querySelector('.bg-indigo-500')
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveStyle({ width: '50%' })
  })

  it('progress bar width matches progress value', () => {
    const { container } = render(
      <FileQueueItem file={makeFile({ status: 'processing', progress: 75 })} onRemove={vi.fn()} />
    )

    const progressBar = container.querySelector('.bg-indigo-500')
    expect(progressBar).toHaveStyle({ width: '75%' })
  })

  it('shows success state when status is done', () => {
    render(
      <FileQueueItem file={makeFile({ status: 'done' })} onRemove={vi.fn()} />
    )
    expect(screen.getByText('Done! Your anonymized file is ready.')).toBeInTheDocument()
  })

  it('shows error message when status is error', () => {
    render(
      <FileQueueItem
        file={makeFile({ status: 'error', errorMessage: 'No audio track found' })}
        onRemove={vi.fn()}
      />
    )
    expect(screen.getByText('No audio track found')).toBeInTheDocument()
  })

  it('shows large file warning for files over 500MB', () => {
    const largeSize = 600 * 1024 * 1024
    render(
      <FileQueueItem file={makeFile({ size: largeSize })} onRemove={vi.fn()} />
    )
    expect(
      screen.getByText(/Large file/)
    ).toBeInTheDocument()
  })

  it('does not show large file warning for small files', () => {
    render(
      <FileQueueItem file={makeFile({ size: 1024 })} onRemove={vi.fn()} />
    )
    expect(screen.queryByText(/Large file/)).not.toBeInTheDocument()
  })

  it('remove button calls onRemove with file id', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    render(<FileQueueItem file={makeFile({ id: 'abc' })} onRemove={onRemove} />)

    await user.click(screen.getByRole('button', { name: 'Remove file' }))
    expect(onRemove).toHaveBeenCalledWith('abc')
  })

  it('remove button is hidden during processing', () => {
    render(
      <FileQueueItem file={makeFile({ status: 'processing' })} onRemove={vi.fn()} />
    )
    expect(screen.queryByRole('button', { name: 'Remove file' })).not.toBeInTheDocument()
  })
})
