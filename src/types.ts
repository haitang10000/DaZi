export type LevelId = 1 | 2 | 3 | 4

export interface LevelDef {
  id: LevelId
  name: string
  english: string
  tagline: string
  focus: string
  require: {
    stars: number
    wpm: number
    accuracy: number
  }
}

export interface Lesson {
  id: string
  level: LevelId
  order: number
  difficulty: 1 | 2 | 3 | 4
  title: string
  region: string
  summary: string
  tip: string
  text: string
  targetWpm: number
  targetAccuracy: number
}

export interface TypingStats {
  wpm: number
  accuracy: number
  elapsedMs: number
  correct: number
  wrong: number
  typed: number
}

export interface LessonRecord {
  attempts: number
  bestStars: number
  bestWpm: number
  bestAccuracy: number
  lastAt: number
}

export interface ChallengeRun {
  id: string
  challengeId: string
  name: string
  wpm: number
  accuracy: number
  chars: number
  errors: number
  xp: number
  at: number
}

export interface Progress {
  version: 1
  name: string
  xp: number
  sound: boolean
  lessons: Record<string, LessonRecord>
  challengeRuns: ChallengeRun[]
  createdAt: number
}

export interface RequirementCheck {
  label: string
  detail: string
  met: boolean
}

export interface LevelProgress {
  level: LevelDef
  stars: number
  maxStars: number
  completed: number
  total: number
  avgAccuracy: number
  bestWpm: number
  checks: RequirementCheck[]
  mastered: boolean
  unlocked: boolean
}

export interface LessonRunSummary {
  stars: number
  xp: number
  newBest: boolean
  bestStars: number
  bestWpm: number
  bestAccuracy: number
  promotion: string | null
}

export interface ChallengeRunSummary {
  xp: number
  rank: number
  recorded: boolean
  totalRuns: number
  bestWpm: number
}

export interface Challenge {
  id: string
  name: string
  badge: string
  durationSec: number
  maxWrong?: number
  pool: 'home' | 'words'
  description: string
  rules: string[]
}

export interface DesktopBridgeResult<T = unknown> {
  ok: boolean
  data?: T
  path?: string
  error?: string
}

export interface DesktopBridge {
  load: () => DesktopBridgeResult<unknown>
  save: (progress: Progress) => DesktopBridgeResult
  clear: () => DesktopBridgeResult
  dataPath: () => string
}

declare global {
  interface Window {
    keypath?: DesktopBridge
  }
}
