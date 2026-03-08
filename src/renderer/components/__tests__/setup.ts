import { vi } from 'vitest'

const mockApi = {
  selectFiles: vi.fn().mockResolvedValue([]),
  selectFolder: vi.fn().mockResolvedValue(null),
  getCapabilities: vi.fn().mockResolvedValue({ hasRubberband: true }),
  processFile: vi.fn(),
  cancelFile: vi.fn(),
  openFolder: vi.fn(),
  onProgress: vi.fn(() => () => {}),
  onDone: vi.fn(() => () => {}),
  onError: vi.fn(() => () => {})
}

Object.defineProperty(window, 'api', { value: mockApi, writable: true })

export { mockApi }
