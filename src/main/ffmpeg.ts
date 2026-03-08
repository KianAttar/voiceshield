import { app } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'
import ffmpegStatic from 'ffmpeg-static'
import type { ProcessingOptions } from '../shared/types'

let rubberbandSupported: boolean | null = null
const activeProcesses = new Map<string, ChildProcess>()

export function _resetRubberbandCache(): void {
  rubberbandSupported = null
}

export function getFFmpegPath(): string {
  if (app.isPackaged) {
    const binary = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
    return path.join(process.resourcesPath, binary)
  }
  return ffmpegStatic
}

export function checkRubberbandSupport(): Promise<boolean> {
  if (rubberbandSupported !== null) return Promise.resolve(rubberbandSupported)

  return new Promise((resolve) => {
    const proc = spawn(getFFmpegPath(), ['-filters'], { windowsHide: true })
    let output = ''

    proc.stderr.on('data', (data: Buffer) => {
      output += data.toString()
    })
    proc.stdout.on('data', (data: Buffer) => {
      output += data.toString()
    })

    proc.on('close', () => {
      rubberbandSupported = output.includes('rubberband')
      resolve(rubberbandSupported)
    })

    proc.on('error', () => {
      rubberbandSupported = false
      resolve(false)
    })
  })
}

interface ProbeResult {
  hasAudio: boolean
  duration: number
}

export function probeFile(filePath: string): Promise<ProbeResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn(getFFmpegPath(), ['-i', filePath, '-hide_banner'], {
      windowsHide: true
    })
    let stderr = ''

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    proc.on('close', () => {
      const hasAudio = /Stream #\d+:\d+.*Audio:/.test(stderr)
      const durationMatch = stderr.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/)
      let duration = 0
      if (durationMatch) {
        duration =
          parseInt(durationMatch[1]) * 3600 +
          parseInt(durationMatch[2]) * 60 +
          parseInt(durationMatch[3]) +
          parseInt(durationMatch[4]) / 100
      }
      resolve({ hasAudio, duration })
    })

    proc.on('error', reject)
  })
}

export function buildFilterChain(options: ProcessingOptions, hasRubberband: boolean): string {
  const filters: string[] = []

  if (hasRubberband) {
    filters.push(
      `rubberband=pitch=${options.pitch.toFixed(4)}:formant=${options.formant.toFixed(4)}`
    )
  } else {
    const adjustedRate = Math.round(44100 * options.pitch)
    const tempoCorrection = (1 / options.pitch).toFixed(4)
    filters.push(`asetrate=${adjustedRate}`)
    filters.push(`atempo=${tempoCorrection}`)
    filters.push('aresample=48000')
  }

  if (options.robotic) {
    filters.push('vibrato=f=5:d=0.3')
  }
  if (options.echo) {
    filters.push('aecho=0.8:0.8:30:0.3')
  }

  return filters.join(',')
}

export function resolveOutputPath(
  inputPath: string,
  outputFolder: string | null,
  outputFormat: string
): string {
  const dir = outputFolder || path.dirname(inputPath)
  const ext = path.extname(inputPath)
  const base = path.basename(inputPath, ext)

  let outputExt = ext
  if (outputFormat !== 'same') {
    outputExt = '.' + outputFormat
  }

  let outputPath = path.join(dir, `${base}_anon${outputExt}`)
  let counter = 1
  while (fs.existsSync(outputPath)) {
    outputPath = path.join(dir, `${base}_anon_${counter}${outputExt}`)
    counter++
  }

  return outputPath
}

interface ProcessFileArgs {
  fileId: string
  inputPath: string
  options: ProcessingOptions
  onProgress: (fileId: string, percent: number) => void
  onComplete: (fileId: string, outputPath: string) => void
  onError: (fileId: string, message: string) => void
}

export function parseTime(h: string, m: string, s: string, cs: string): number {
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(cs) / 100
}

export function processFile({
  fileId,
  inputPath,
  options,
  onProgress,
  onComplete,
  onError
}: ProcessFileArgs): void {
  const run = async (): Promise<void> => {
    try {
      const hasRubberband = await checkRubberbandSupport()

      let probe: ProbeResult
      try {
        probe = await probeFile(inputPath)
      } catch {
        onError(
          fileId,
          "Couldn't access this file. Make sure it's not open in another app."
        )
        return
      }

      if (!probe.hasAudio) {
        onError(
          fileId,
          "This file doesn't seem to have an audio track. Nothing to anonymize."
        )
        return
      }

      const outputPath = resolveOutputPath(inputPath, options.outputFolder, options.outputFormat)
      const filterChain = buildFilterChain(options, hasRubberband)

      const args = ['-i', inputPath, '-c:v', 'copy', '-af', filterChain, '-y', outputPath]
      const proc = spawn(getFFmpegPath(), args, { windowsHide: true })
      activeProcesses.set(fileId, proc)

      let totalDuration = probe.duration

      proc.stderr.on('data', (data: Buffer) => {
        const line = data.toString()

        if (!totalDuration) {
          const durMatch = line.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/)
          if (durMatch) {
            totalDuration = parseTime(durMatch[1], durMatch[2], durMatch[3], durMatch[4])
          }
        }

        const timeMatch = line.match(/time=\s*(\d+):(\d+):(\d+)\.(\d+)/)
        if (timeMatch && totalDuration > 0) {
          const current = parseTime(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4])
          const progress = Math.min(Math.round((current / totalDuration) * 100), 99)
          onProgress(fileId, progress)
        }
      })

      proc.on('close', (code) => {
        activeProcesses.delete(fileId)
        if (code === 0) {
          onProgress(fileId, 100)
          onComplete(fileId, outputPath)
        } else {
          onError(
            fileId,
            'Processing failed. The file may be corrupted or use an unsupported codec.'
          )
        }
      })

      proc.on('error', () => {
        activeProcesses.delete(fileId)
        onError(
          fileId,
          "Couldn't access this file. Make sure it's not open in another app."
        )
      })
    } catch {
      onError(
        fileId,
        "Couldn't access this file. Make sure it's not open in another app."
      )
    }
  }

  run()
}

export function cancelProcess(fileId: string): void {
  const proc = activeProcesses.get(fileId)
  if (proc) {
    proc.kill('SIGTERM')
    activeProcesses.delete(fileId)
  }
}
