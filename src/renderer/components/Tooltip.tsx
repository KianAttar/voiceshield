import { useState, useRef, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  text: string
}

export default function Tooltip({ text }: TooltipProps): React.JSX.Element {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!visible || !triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    const pad = 8

    let top = triggerRect.top - tooltipRect.height - pad
    if (top < pad) {
      top = triggerRect.bottom + pad
    }

    let left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
    if (left < pad) left = pad
    if (left + tooltipRect.width > window.innerWidth - pad) {
      left = window.innerWidth - tooltipRect.width - pad
    }

    setCoords({ top, left })
  }, [visible])

  const show = useCallback(() => setVisible(true), [])
  const hide = useCallback(() => setVisible(false), [])

  return (
    <>
      <button
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="w-4 h-4 rounded-full bg-slate-700 text-slate-400 text-[10px] inline-flex items-center justify-center hover:bg-slate-600 hover:text-slate-300 transition-colors cursor-help ml-1 shrink-0"
        type="button"
        aria-label="More info"
      >
        ?
      </button>
      {visible &&
        createPortal(
          <div
            ref={tooltipRef}
            style={{ position: 'fixed', top: coords.top, left: coords.left }}
            className="z-50 max-w-xs px-3 py-2 text-sm text-slate-200 bg-slate-800 border border-slate-700 rounded-lg shadow-xl pointer-events-none"
          >
            {text}
          </div>,
          document.body
        )}
    </>
  )
}
