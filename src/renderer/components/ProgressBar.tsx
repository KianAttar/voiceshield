interface ProgressBarProps {
  percent: number
}

export default function ProgressBar({ percent }: ProgressBarProps): React.JSX.Element {
  return (
    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
