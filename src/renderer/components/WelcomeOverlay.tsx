import { useState } from 'react'

interface WelcomeOverlayProps {
  onDismiss: () => void
}

const STEPS = [
  'Drop your video file onto the app',
  'Choose how much to change the voice',
  'Click Anonymize and download your file'
]

export default function WelcomeOverlay({ onDismiss }: WelcomeOverlayProps): React.JSX.Element {
  const [step, setStep] = useState(0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Welcome to VoiceShield
        </h2>

        <div className="space-y-3 mb-8">
          {STEPS.map((description, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                i === step
                  ? 'bg-indigo-500/10 border border-indigo-500/30'
                  : 'border border-transparent opacity-50'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  i === step ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'
                }`}
              >
                {i + 1}
              </div>
              <p
                className={`text-sm mt-1 ${i === step ? 'text-slate-200' : 'text-slate-500'}`}
              >
                {description}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={onDismiss}
              className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
