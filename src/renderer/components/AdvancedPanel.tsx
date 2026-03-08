import Tooltip from './Tooltip'

type OutputFormat = 'same' | 'mp4' | 'mkv' | 'webm'

interface AdvancedPanelProps {
  pitchSemitones: number
  formant: number
  robotic: boolean
  echo: boolean
  outputFormat: OutputFormat
  outputFolder: string | null
  onPitchChange: (value: number) => void
  onFormantChange: (value: number) => void
  onRoboticChange: (value: boolean) => void
  onEchoChange: (value: boolean) => void
  onOutputFormatChange: (value: OutputFormat) => void
  onSelectOutputFolder: () => void
}

export default function AdvancedPanel({
  pitchSemitones,
  formant,
  robotic,
  echo,
  outputFormat,
  outputFolder,
  onPitchChange,
  onFormantChange,
  onRoboticChange,
  onEchoChange,
  onOutputFormatChange,
  onSelectOutputFolder
}: AdvancedPanelProps): React.JSX.Element {
  return (
    <div className="bg-slate-800 rounded-2xl p-6 space-y-6">
      <div>
        <div className="flex items-center gap-1 mb-2">
          <label className="text-sm font-medium text-slate-300">
            Pitch: {pitchSemitones > 0 ? '+' : ''}
            {pitchSemitones} semitones
          </label>
          <Tooltip text="Shifts how high or low the voice sounds. Negative = deeper, positive = higher." />
        </div>
        <input
          type="range"
          min={-8}
          max={8}
          step={0.5}
          value={pitchSemitones}
          onChange={(e) => onPitchChange(parseFloat(e.target.value))}
          className="w-full accent-indigo-500"
        />
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>-8</span>
          <span>0</span>
          <span>+8</span>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-1 mb-2">
          <label className="text-sm font-medium text-slate-300">
            Formant: {formant.toFixed(2)}
          </label>
          <Tooltip text="Changes the vocal fingerprint of the voice — the part that makes someone recognizable even when pitch is the same." />
        </div>
        <input
          type="range"
          min={0.8}
          max={1.4}
          step={0.01}
          value={formant}
          onChange={(e) => onFormantChange(parseFloat(e.target.value))}
          className="w-full accent-indigo-500"
        />
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>0.80</span>
          <span>1.10</span>
          <span>1.40</span>
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={robotic}
            onChange={(e) => onRoboticChange(e.target.checked)}
            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-500 accent-indigo-500"
          />
          <span className="text-sm text-slate-300">Robotic</span>
          <Tooltip text="Adds a mechanical warble. Makes it harder to identify but sounds more processed." />
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={echo}
            onChange={(e) => onEchoChange(e.target.checked)}
            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-500 accent-indigo-500"
          />
          <span className="text-sm text-slate-300">Echo</span>
          <Tooltip text="Adds a subtle echo. Can help mask identity in short clips." />
        </label>
      </div>

      <div>
        <div className="flex items-center gap-1 mb-2">
          <label className="text-sm font-medium text-slate-300">Output format</label>
          <Tooltip text="The file format of your anonymized video. Same as input is recommended unless you need a specific format." />
        </div>
        <select
          value={outputFormat}
          onChange={(e) => onOutputFormatChange(e.target.value as OutputFormat)}
          className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
        >
          <option value="same">Same as input</option>
          <option value="mp4">MP4</option>
          <option value="mkv">MKV</option>
          <option value="webm">WebM</option>
        </select>
      </div>

      <div>
        <div className="flex items-center gap-1 mb-2">
          <label className="text-sm font-medium text-slate-300">Output folder</label>
          <Tooltip text="Where the anonymized files will be saved. By default, saved next to the originals." />
        </div>
        <button
          onClick={onSelectOutputFolder}
          className="w-full text-left bg-slate-700 border border-slate-600 text-slate-200 rounded-lg px-3 py-2 text-sm hover:border-slate-500 transition-colors truncate"
        >
          {outputFolder || 'Same as input file (default)'}
        </button>
      </div>
    </div>
  )
}
