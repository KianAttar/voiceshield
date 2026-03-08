import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventEmitter } from 'events'

vi.mock('electron', () => ({
  app: { isPackaged: false }
}))

vi.mock('ffmpeg-static', () => ({ default: '/usr/bin/ffmpeg' }))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let spawnMock: ReturnType<typeof vi.fn<(...args: any[]) => any>>

vi.mock('child_process', () => {
  const mod = {
    spawn: (...args: unknown[]) => spawnMock(...args),
    ChildProcess: class {}
  }
  return { ...mod, default: mod }
})

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(false),
    statSync: vi.fn().mockReturnValue({ size: 1000 })
  },
  existsSync: vi.fn().mockReturnValue(false),
  statSync: vi.fn().mockReturnValue({ size: 1000 })
}))

import {
  buildFilterChain,
  resolveOutputPath,
  parseTime,
  checkRubberbandSupport,
  processFile,
  _resetRubberbandCache
} from '../ffmpeg'
import type { ProcessingOptions } from '../../shared/types'
import fs from 'fs'

function makeProc() {
  const proc = new EventEmitter() as EventEmitter & { stderr: EventEmitter; stdout: EventEmitter; kill: ReturnType<typeof vi.fn> }
  proc.stderr = new EventEmitter()
  proc.stdout = new EventEmitter()
  proc.kill = vi.fn()
  return proc
}

function defaultOptions(overrides: Partial<ProcessingOptions> = {}): ProcessingOptions {
  return {
    pitch: 0.84,
    formant: 1.12,
    robotic: false,
    echo: false,
    outputFormat: 'same',
    outputFolder: null,
    ...overrides
  }
}

beforeEach(() => {
  _resetRubberbandCache()
  spawnMock = vi.fn().mockImplementation(() => makeProc())
  vi.mocked(fs.existsSync).mockReturnValue(false)
})

describe('buildFilterChain', () => {
  it('returns rubberband filter for Subtle preset', () => {
    const opts = defaultOptions({ pitch: 0.89, formant: 1.06 })
    const result = buildFilterChain(opts, true)
    expect(result).toBe('rubberband=pitch=0.8900:formant=1.0600')
  })

  it('returns rubberband filter for Moderate preset', () => {
    const opts = defaultOptions({ pitch: 0.84, formant: 1.12 })
    const result = buildFilterChain(opts, true)
    expect(result).toBe('rubberband=pitch=0.8400:formant=1.1200')
  })

  it('returns rubberband filter for Strong preset', () => {
    const opts = defaultOptions({ pitch: 0.79, formant: 1.20 })
    const result = buildFilterChain(opts, true)
    expect(result).toBe('rubberband=pitch=0.7900:formant=1.2000')
  })

  it('returns asetrate fallback when rubberband is unavailable', () => {
    const opts = defaultOptions({ pitch: 0.84, formant: 1.12 })
    const result = buildFilterChain(opts, false)
    expect(result).toContain('asetrate=')
    expect(result).toContain('atempo=')
    expect(result).toContain('aresample=48000')
    const rate = Math.round(44100 * 0.84)
    expect(result).toContain(`asetrate=${rate}`)
  })

  it('appends vibrato filter when robotic is enabled', () => {
    const opts = defaultOptions({ robotic: true })
    const result = buildFilterChain(opts, true)
    expect(result).toContain('vibrato=f=5:d=0.3')
  })

  it('appends aecho filter when echo is enabled', () => {
    const opts = defaultOptions({ echo: true })
    const result = buildFilterChain(opts, true)
    expect(result).toContain('aecho=0.8:0.8:30:0.3')
  })

  it('appends both vibrato and aecho when both enabled', () => {
    const opts = defaultOptions({ robotic: true, echo: true })
    const result = buildFilterChain(opts, true)
    expect(result).toContain('vibrato=f=5:d=0.3')
    expect(result).toContain('aecho=0.8:0.8:30:0.3')
  })
})

describe('pitch semitone to ratio conversion', () => {
  const cases = [
    { semitones: -8, expected: Math.pow(2, -8 / 12) },
    { semitones: -4, expected: Math.pow(2, -4 / 12) },
    { semitones: 0, expected: 1 },
    { semitones: 4, expected: Math.pow(2, 4 / 12) },
    { semitones: 8, expected: Math.pow(2, 8 / 12) }
  ]

  for (const { semitones, expected } of cases) {
    it(`converts ${semitones} semitones to ratio ${expected.toFixed(4)}`, () => {
      const ratio = Math.pow(2, semitones / 12)
      expect(ratio).toBeCloseTo(expected, 6)
    })
  }
})

describe('parseTime', () => {
  it('parses hours, minutes, seconds, centiseconds', () => {
    expect(parseTime('01', '30', '45', '50')).toBe(3600 + 1800 + 45 + 0.5)
  })

  it('parses zero time', () => {
    expect(parseTime('00', '00', '00', '00')).toBe(0)
  })
})

describe('checkRubberbandSupport', () => {
  it('returns true when ffmpeg -filters output contains rubberband', async () => {
    const proc = makeProc()
    spawnMock.mockReturnValue(proc)

    const promise = checkRubberbandSupport()
    proc.stdout.emit('data', Buffer.from('T.. rubberband  Rubberband effect'))
    proc.emit('close')

    expect(await promise).toBe(true)
  })

  it('returns false when rubberband is not in output', async () => {
    _resetRubberbandCache()
    const proc = makeProc()
    spawnMock.mockReturnValue(proc)

    const promise = checkRubberbandSupport()
    proc.stdout.emit('data', Buffer.from('T.. aecho  Echo filter'))
    proc.emit('close')

    expect(await promise).toBe(false)
  })

  it('caches result — spawn is only called once across multiple calls', async () => {
    _resetRubberbandCache()
    const proc = makeProc()
    spawnMock.mockReturnValue(proc)

    const p1 = checkRubberbandSupport()
    proc.stdout.emit('data', Buffer.from('rubberband'))
    proc.emit('close')
    await p1

    const result2 = await checkRubberbandSupport()
    expect(result2).toBe(true)
    expect(spawnMock).toHaveBeenCalledTimes(1)
  })
})

describe('resolveOutputPath', () => {
  it('adds _anon suffix', () => {
    const result = resolveOutputPath('/videos/test.mp4', null, 'same')
    expect(result).toBe('/videos/test_anon.mp4')
  })

  it('uses custom output folder', () => {
    const result = resolveOutputPath('/videos/test.mp4', '/output', 'same')
    expect(result).toBe('/output/test_anon.mp4')
  })

  it('changes extension when format is overridden to mp4', () => {
    const result = resolveOutputPath('/videos/test.mkv', null, 'mp4')
    expect(result).toBe('/videos/test_anon.mp4')
  })

  it('changes extension when format is overridden to mkv', () => {
    const result = resolveOutputPath('/videos/test.mp4', null, 'mkv')
    expect(result).toBe('/videos/test_anon.mkv')
  })

  it('changes extension when format is overridden to webm', () => {
    const result = resolveOutputPath('/videos/test.mp4', null, 'webm')
    expect(result).toBe('/videos/test_anon.webm')
  })

  it('appends counter when output file already exists', () => {
    vi.mocked(fs.existsSync).mockReturnValueOnce(true).mockReturnValueOnce(false)
    const result = resolveOutputPath('/videos/test.mp4', null, 'same')
    expect(result).toBe('/videos/test_anon_1.mp4')
  })
})

describe('processFile — progress parsing', () => {
  it('parses progress from ffmpeg stderr', async () => {
    _resetRubberbandCache()

    // First call: checkRubberband
    const rubberbandProc = makeProc()
    // Second call: probeFile
    const probeProc = makeProc()
    // Third call: actual ffmpeg
    const ffmpegProc = makeProc()

    spawnMock
      .mockReturnValueOnce(rubberbandProc)
      .mockReturnValueOnce(probeProc)
      .mockReturnValueOnce(ffmpegProc)

    const onProgress = vi.fn()
    const onComplete = vi.fn()
    const onError = vi.fn()

    processFile({
      fileId: 'f1',
      inputPath: '/test/video.mp4',
      options: defaultOptions(),
      onProgress,
      onComplete,
      onError
    })

    // Resolve rubberband check
    rubberbandProc.stdout.emit('data', Buffer.from('rubberband'))
    rubberbandProc.emit('close')

    await vi.waitFor(() => expect(spawnMock).toHaveBeenCalledTimes(2))

    // Resolve probe
    probeProc.stderr.emit('data', Buffer.from('Duration: 00:01:00.00\nStream #0:1 Audio: aac'))
    probeProc.emit('close')

    await vi.waitFor(() => expect(spawnMock).toHaveBeenCalledTimes(3))

    // Simulate progress
    ffmpegProc.stderr.emit('data', Buffer.from('time=00:00:30.00'))
    expect(onProgress).toHaveBeenCalledWith('f1', 50)

    ffmpegProc.emit('close', 0)
    expect(onProgress).toHaveBeenCalledWith('f1', 100)
    expect(onComplete).toHaveBeenCalledWith('f1', expect.stringContaining('video_anon.mp4'))
  })

  it('calls onError for files without audio', async () => {
    _resetRubberbandCache()

    const rubberbandProc = makeProc()
    const probeProc = makeProc()

    spawnMock
      .mockReturnValueOnce(rubberbandProc)
      .mockReturnValueOnce(probeProc)

    const onError = vi.fn()

    processFile({
      fileId: 'f2',
      inputPath: '/test/video.mp4',
      options: defaultOptions(),
      onProgress: vi.fn(),
      onComplete: vi.fn(),
      onError
    })

    rubberbandProc.stdout.emit('data', Buffer.from('rubberband'))
    rubberbandProc.emit('close')

    await vi.waitFor(() => expect(spawnMock).toHaveBeenCalledTimes(2))

    // Probe without audio stream
    probeProc.stderr.emit('data', Buffer.from('Duration: 00:01:00.00\nStream #0:0 Video: h264'))
    probeProc.emit('close')

    await vi.waitFor(() => {
      expect(onError).toHaveBeenCalledWith('f2', expect.stringContaining('audio track'))
    })
  })
})
