import Tooltip from './Tooltip'

interface PresetCardProps {
  label: string
  tooltip: string
  selected: boolean
  onClick: () => void
}

export default function PresetCard({
  label,
  tooltip,
  selected,
  onClick
}: PresetCardProps): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
        selected
          ? 'border-indigo-500 bg-indigo-500/10 text-white'
          : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
      }`}
    >
      <div className="flex items-center justify-center gap-1">
        <span className="font-medium">{label}</span>
        <Tooltip text={tooltip} />
      </div>
    </button>
  )
}
