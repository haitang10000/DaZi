import type { ChallengeRun, DesktopBridgeResult, LessonRecord, Progress } from '../types'

const DEFAULT_NAME = '打字新手'

export function sanitizeName(name: string): string {
  const trimmed = name.trim().slice(0, 12)
  return trimmed || DEFAULT_NAME
}

export function createEmptyProgress(): Progress {
  return {
    version: 1,
    name: DEFAULT_NAME,
    xp: 0,
    sound: true,
    lessons: {},
    challengeRuns: [],
    createdAt: Date.now(),
  }
}

function numberOr(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function clampNumber(value: unknown, min: number, max: number): number {
  return Math.min(max, Math.max(min, numberOr(value)))
}

function readLessonRecord(raw: unknown): LessonRecord | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const attempts = numberOr(record.attempts)
  if (attempts <= 0) return null

  return {
    attempts,
    bestStars: clampNumber(record.bestStars, 0, 3),
    bestWpm: Math.max(0, numberOr(record.bestWpm)),
    bestAccuracy: clampNumber(record.bestAccuracy, 0, 100),
    lastAt: numberOr(record.lastAt, Date.now()),
  }
}

function readChallengeRun(raw: unknown): ChallengeRun | null {
  if (!raw || typeof raw !== 'object') return null
  const run = raw as Record<string, unknown>
  if (typeof run.id !== 'string' || typeof run.challengeId !== 'string') return null
  if (typeof run.name !== 'string') return null

  return {
    id: run.id,
    challengeId: run.challengeId,
    name: sanitizeName(run.name),
    wpm: Math.max(0, numberOr(run.wpm)),
    accuracy: clampNumber(run.accuracy, 0, 100),
    chars: Math.max(0, numberOr(run.chars)),
    errors: Math.max(0, numberOr(run.errors)),
    xp: Math.max(0, numberOr(run.xp)),
    at: numberOr(run.at, Date.now()),
  }
}

function normalize(raw: unknown): Progress {
  const base = createEmptyProgress()
  if (!raw || typeof raw !== 'object') return base

  const data = raw as Record<string, unknown>
  const lessons: Record<string, LessonRecord> = {}

  if (data.lessons && typeof data.lessons === 'object' && !Array.isArray(data.lessons)) {
    for (const [id, value] of Object.entries(data.lessons)) {
      const record = readLessonRecord(value)
      if (record) lessons[id] = record
    }
  }

  const challengeRuns = Array.isArray(data.challengeRuns)
    ? data.challengeRuns.map(readChallengeRun).filter((run): run is ChallengeRun => run !== null)
    : []

  return {
    version: 1,
    name: sanitizeName(typeof data.name === 'string' ? data.name : base.name),
    xp: Math.max(0, numberOr(data.xp)),
    sound: typeof data.sound === 'boolean' ? data.sound : true,
    lessons,
    challengeRuns,
    createdAt: numberOr(data.createdAt, Date.now()),
  }
}

function desktopBridge() {
  return typeof window !== 'undefined' ? window.keypath : undefined
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function loadProgress(): Progress {
  const bridge = desktopBridge()
  if (!bridge) return createEmptyProgress()
  try {
    const result = bridge.load()
    if (!result.ok) return createEmptyProgress()
    return normalize(result.data)
  } catch {
    return createEmptyProgress()
  }
}

export function saveProgress(progress: Progress): DesktopBridgeResult {
  const bridge = desktopBridge()
  if (!bridge) return { ok: false, error: '请通过键径 KeyPath 桌面应用运行' }
  try {
    const result = bridge.save(progress)
    return {
      ok: Boolean(result.ok),
      path: result.path,
      error: result.error,
    }
  } catch (error) {
    return { ok: false, error: errorText(error) }
  }
}

export function clearAllProgress(): DesktopBridgeResult {
  const bridge = desktopBridge()
  if (!bridge) return { ok: false, error: '请通过键径 KeyPath 桌面应用运行' }
  try {
    const result = bridge.clear()
    return {
      ok: Boolean(result.ok),
      path: result.path,
      error: result.error,
    }
  } catch (error) {
    return { ok: false, error: errorText(error) }
  }
}

export function getDataPath(): string {
  const bridge = desktopBridge()
  if (!bridge) return ''
  try {
    return bridge.dataPath()
  } catch {
    return ''
  }
}
