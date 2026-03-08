import { useState, useCallback } from 'react'
import DropZone from './components/DropZone'
import PresetCard from './components/PresetCard'
import FileQueueItem from './components/FileQueueItem'
import AdvancedPanel from './components/AdvancedPanel'
import WelcomeOverlay from './components/WelcomeOverlay'
import StatusBadge from './components/StatusBadge'
import { useFileQueue } from './hooks/useFileQueue'
import { useSettings } from './hooks/useSettings'
import { useProcessing } from './hooks/useProcessing'
import type { ProcessingOptions } from '../shared/types'

const PRESET_TOOLTIPS = {
  subtle:
    'Slightly changes the voice. May still sound familiar to someone who knows the speaker well.',
  moderate:
    'Recommended for most cases. Voice is clearly changed but still easy to understand.',
  strong:
    'Maximum anonymization. Voice will sound noticeably different — best for high-sensitivity recordings.'
} as const

const STATUS_MESSAGES: Record<string, string> = {
  idle: 'Ready — drop a file to get started',
  processing: 'Anonymizing... this may take a moment for large files',
  done: 'Done! Your anonymized file is ready.'
}

export default function App(): React.JSX.Element {
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem('voiceshield-onboarded')
  })

  const { files, addFiles, removeFile, updateStatus, updateProgress, clearCompleted } =
    useFileQueue()
  const {
    settings,
    setPreset,
    toggleAdvanced,
    setPitch,
    setFormant,
    setRobotic,
    setEcho,
    setOutputFormat,
    setOutputFolder,
    getPitchRatio
  } = useSettings()

  const getOptions = useCallback(
    (): ProcessingOptions => ({
      pitch: getPitchRatio(),
      formant: settings.formant,
      robotic: settings.robotic,
      echo: settings.echo,
      outputFormat: settings.outputFormat,
      outputFolder: settings.outputFolder
    }),
    [settings.formant, settings.robotic, settings.echo, settings.outputFormat, settings.outputFolder, getPitchRatio]
  )

  const { state, startProcessing, hasRubberband, outputFolders } = useProcessing({
    files,
    updateStatus,
    updateProgress,
    getOptions
  })

  const dismissWelcome = useCallback(() => {
    localStorage.setItem('voiceshield-onboarded', 'true')
    setShowWelcome(false)
  }, [])

  const showGuide = useCallback(() => {
    setShowWelcome(true)
  }, [])

  const handleSelectOutputFolder = useCallback(async () => {
    const folder = await window.api.selectFolder()
    if (folder) setOutputFolder(folder)
  }, [setOutputFolder])

  const hasIdleFiles = files.some((f) => f.status === 'idle')
  const isProcessing = state === 'processing'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col">
      {showWelcome && <WelcomeOverlay onDismiss={dismissWelcome} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">VoiceShield</h1>
          <p className="text-sm text-slate-500">{STATUS_MESSAGES[state]}</p>
        </div>
        <StatusBadge />
      </div>

      {hasRubberband === false && (
        <div className="mb-4 px-4 py-2 bg-amber-950 border border-amber-800 rounded-lg text-amber-400 text-sm">
          Running in basic mode — anonymization quality may be slightly reduced.
        </div>
      )}

      <DropZone onFilesAdded={addFiles} disabled={isProcessing} />

      <div className="flex gap-3 mt-6">
        <PresetCard
          label="Subtle"
          tooltip={PRESET_TOOLTIPS.subtle}
          selected={settings.preset === 'subtle'}
          onClick={() => setPreset('subtle')}
        />
        <PresetCard
          label="Moderate"
          tooltip={PRESET_TOOLTIPS.moderate}
          selected={settings.preset === 'moderate'}
          onClick={() => setPreset('moderate')}
        />
        <PresetCard
          label="Strong"
          tooltip={PRESET_TOOLTIPS.strong}
          selected={settings.preset === 'strong'}
          onClick={() => setPreset('strong')}
        />
      </div>

      <button
        onClick={toggleAdvanced}
        className="mt-4 text-sm text-slate-400 hover:text-slate-200 transition-colors self-start"
      >
        {settings.advancedMode ? 'Hide advanced options' : 'Show advanced options'}
      </button>

      {settings.advancedMode && (
        <div className="mt-3">
          <AdvancedPanel
            pitchSemitones={settings.pitchSemitones}
            formant={settings.formant}
            robotic={settings.robotic}
            echo={settings.echo}
            outputFormat={settings.outputFormat}
            outputFolder={settings.outputFolder}
            onPitchChange={setPitch}
            onFormantChange={setFormant}
            onRoboticChange={setRobotic}
            onEchoChange={setEcho}
            onOutputFormatChange={setOutputFormat}
            onSelectOutputFolder={handleSelectOutputFolder}
          />
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-400">Files ({files.length})</h2>
            {state === 'done' && (
              <button
                onClick={clearCompleted}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear completed
              </button>
            )}
          </div>
          {files.map((file) => (
            <FileQueueItem key={file.id} file={file} onRemove={removeFile} />
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        {hasIdleFiles && !isProcessing && (
          <button
            onClick={startProcessing}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors"
          >
            Anonymize
          </button>
        )}
        {state === 'done' && outputFolders.length > 0 && (
          <button
            onClick={() => window.api.openFolder(outputFolders[0])}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl border border-slate-700 transition-colors"
          >
            Open Output Folder
          </button>
        )}
      </div>

      <div className="mt-auto pt-6 text-center">
        <button
          onClick={showGuide}
          className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          Show guide again
        </button>
      </div>
    </div>
  )
}
