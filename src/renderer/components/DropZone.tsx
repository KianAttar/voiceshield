import { useState, useCallback } from 'react'
import type { DragEvent } from 'react'

interface FileInput {
  path: string
  name: string
  size: number
}

interface DropZoneProps {
  onFilesAdded: (files: FileInput[]) => void
  disabled: boolean
}

const SUPPORTED_EXTENSIONS = ['.mp4', '.mkv', '.mov', '.webm', '.avi']

export default function DropZone({ onFilesAdded, disabled }: DropZoneProps): React.JSX.Element {
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragOver(false)
      if (disabled) return

      const results: FileInput[] = []
      for (const file of Array.from(e.dataTransfer.files)) {
        const dotIndex = file.name.lastIndexOf('.')
        const ext = dotIndex >= 0 ? file.name.substring(dotIndex).toLowerCase() : ''
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          results.push({
            path: (file as unknown as { path: string }).path,
            name: file.name,
            size: file.size
          })
        }
      }
      if (results.length > 0) onFilesAdded(results)
    },
    [onFilesAdded, disabled]
  )

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (!disabled) setDragOver(true)
    },
    [disabled]
  )

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleClick = useCallback(async () => {
    if (disabled) return
    const files = await window.api.selectFiles()
    if (files.length > 0) onFilesAdded(files)
  }, [onFilesAdded, disabled])

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
        dragOver
          ? 'border-indigo-500 bg-indigo-500/5'
          : 'border-slate-700 hover:border-slate-500 bg-slate-900/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="flex flex-col items-center gap-3">
        <svg
          className="w-12 h-12 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        <p className="text-slate-400 text-lg">Drop your video files here, or click to browse</p>
        <p className="text-slate-600 text-sm">Supports MP4, MKV, MOV, WebM, AVI</p>
      </div>
    </div>
  )
}
