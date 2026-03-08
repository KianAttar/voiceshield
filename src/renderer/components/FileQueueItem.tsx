import type { QueueFile } from '../../shared/types'
import ProgressBar from './ProgressBar'

interface FileQueueItemProps {
  file: QueueFile
  onRemove: (id: string) => void
}

function formatSize(bytes: number): string {
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + ' GB'
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB'
  return (bytes / 1e3).toFixed(0) + ' KB'
}

const STATUS_LABELS: Record<QueueFile['status'], string> = {
  idle: 'Ready',
  processing: 'Anonymizing... this may take a moment for large files',
  done: 'Done! Your anonymized file is ready.',
  error: 'Error'
}

export default function FileQueueItem({
  file,
  onRemove
}: FileQueueItemProps): React.JSX.Element {
  const statusText = file.errorMessage || STATUS_LABELS[file.status]
  const isLargeFile = file.size > 500 * 1024 * 1024

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-slate-800 rounded-xl">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm text-slate-200 truncate">{file.name}</p>
          <span className="text-xs text-slate-500 shrink-0">{formatSize(file.size)}</span>
          {isLargeFile && file.status === 'idle' && (
            <span className="text-xs text-amber-400 shrink-0">
              Large file — processing may take several minutes
            </span>
          )}
        </div>
        {file.status === 'processing' && (
          <div className="mt-2">
            <ProgressBar percent={file.progress} />
          </div>
        )}
        <p
          className={`text-xs mt-1 ${
            file.status === 'done'
              ? 'text-emerald-400'
              : file.status === 'error'
                ? 'text-red-400'
                : 'text-slate-500'
          }`}
        >
          {statusText}
        </p>
      </div>
      {file.status !== 'processing' && (
        <button
          onClick={() => onRemove(file.id)}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1"
          aria-label="Remove file"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
