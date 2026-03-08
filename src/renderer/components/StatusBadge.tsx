import Tooltip from './Tooltip'

export default function StatusBadge(): React.JSX.Element {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950 border border-emerald-800 rounded-full text-emerald-400 text-xs font-medium">
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
      100% local processing
      <Tooltip text="Your files never leave your computer. All processing happens locally — nothing is uploaded anywhere." />
    </div>
  )
}
