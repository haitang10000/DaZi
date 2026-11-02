import { CHALLENGES } from '../data/challenges'
import { LESSONS, LESSON_BY_ID, LEVELS } from '../data/lessons'
import type {
  Challenge,
  ChallengeRun,
  ChallengeRunSummary,
  Lesson,
  LessonRunSummary,
  LevelId,
  LevelProgress,
  Progress,
  RequirementCheck,
  TypingStats,
} from '../types'

export const MAX_CHALLENGE_RUNS = 10
const MAX_LEVEL_ID = 4

export function starsFor(lesson: Lesson, stats: TypingStats): number {
  if (stats.accuracy >= lesson.targetAccuracy && stats.wpm >= lesson.targetWpm) return 3
  if (stats.accuracy >= lesson.targetAccuracy && stats.wpm >= lesson.targetWpm * 0.8) return 2
  if (stats.accuracy >= 80) return 1
  return 0
}

export function xpForRun(stats: TypingStats, stars: number, isChallenge = false): number {
  const base = Math.round(stats.typed * (0.8 + stats.accuracy / 250) * (isChallenge ? 1.4 : 1))
  return Math.max(0, base + stars * 12 + (isChallenge ? 15 : 0))
}

function lessonRecord(progress: Progress, lessonId: string) {
  return progress.lessons[lessonId]
}

export function levelProgress(progress: Progress, levelId: LevelId): LevelProgress {
  const level = LEVELS.find((item) => item.id === levelId) ?? LEVELS[0]
  const lessons = LESSONS.filter((lesson) => lesson.level === levelId)
  const completedLessons = lessons.filter((lesson) => (lessonRecord(progress, lesson.id)?.bestStars ?? 0) > 0)
  const stars = lessons.reduce((total, lesson) => total + (lessonRecord(progress, lesson.id)?.bestStars ?? 0), 0)
  const bestWpm = lessons.reduce(
    (best, lesson) => Math.max(best, lessonRecord(progress, lesson.id)?.bestWpm ?? 0),
    0,
  )
  const accuracySample = completedLessons
    .map((lesson) => lessonRecord(progress, lesson.id)?.bestAccuracy ?? 0)
    .filter((value) => value > 0)
  const avgAccuracy = accuracySample.length
    ? accuracySample.reduce((total, value) => total + value, 0) / accuracySample.length
    : 0

  const checks: RequirementCheck[] = [
    {
      label: '完成全部课程',
      detail: `${completedLessons.length}/${lessons.length} 课`,
      met: completedLessons.length === lessons.length,
    },
    {
      label: '收集星星',
      detail: `${stars}/${level.require.stars} 星`,
      met: stars >= level.require.stars,
    },
    {
      label: '最佳速度',
      detail: `${bestWpm.toFixed(0)}/${level.require.wpm} WPM`,
      met: bestWpm >= level.require.wpm,
    },
    {
      label: '平均准确率',
      detail: `${avgAccuracy.toFixed(1)}%/${level.require.accuracy}%`,
      met: avgAccuracy >= level.require.accuracy,
    },
  ]

  const mastered = checks.every((check) => check.met)

  return {
    level,
    stars,
    maxStars: lessons.length * 3,
    completed: completedLessons.length,
    total: lessons.length,
    avgAccuracy,
    bestWpm,
    checks,
    mastered,
    unlocked: levelId === 1 || levelProgress(progress, (levelId - 1) as LevelId).mastered,
  }
}

export function highestUnlockedLevel(progress: Progress): LevelId {
  let unlocked: LevelId = 1
  for (let id = 1; id <= MAX_LEVEL_ID; id += 1) {
    const level = id as LevelId
    if (level === 1 || levelProgress(progress, (level - 1) as LevelId).mastered) {
      unlocked = level
    } else {
      break
    }
  }
  return unlocked
}

export function recordLessonRun(
  progress: Progress,
  lesson: Lesson,
  stats: TypingStats,
): { progress: Progress; summary: LessonRunSummary } {
  const previous = progress.lessons[lesson.id]
  const stars = starsFor(lesson, stats)
  const xp = xpForRun(stats, stars)
  const record = {
    attempts: (previous?.attempts ?? 0) + 1,
    bestStars: Math.max(previous?.bestStars ?? 0, stars),
    bestWpm: Math.max(previous?.bestWpm ?? 0, stats.wpm),
    bestAccuracy: Math.max(previous?.bestAccuracy ?? 0, stats.accuracy),
    lastAt: Date.now(),
  }

  const next: Progress = {
    ...progress,
    xp: progress.xp + xp,
    lessons: { ...progress.lessons, [lesson.id]: record },
  }

  const unlockedBefore = highestUnlockedLevel(progress)
  const unlockedAfter = highestUnlockedLevel(next)
  const promotion =
    unlockedAfter > unlockedBefore
      ? LEVELS.find((level) => level.id === unlockedAfter)?.name ?? null
      : null

  return {
    progress: next,
    summary: {
      stars,
      xp,
      newBest:
        stars > (previous?.bestStars ?? 0) ||
        record.bestWpm > (previous?.bestWpm ?? 0) + 0.05 ||
        record.bestAccuracy > (previous?.bestAccuracy ?? 0) + 0.05,
      bestStars: record.bestStars,
      bestWpm: record.bestWpm,
      bestAccuracy: record.bestAccuracy,
      promotion,
    },
  }
}

function challengeComparator(a: ChallengeRun, b: ChallengeRun): number {
  if (b.wpm !== a.wpm) return b.wpm - a.wpm
  if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy
  return a.at - b.at
}

export function leaderboard(progress: Progress, challengeId: string): ChallengeRun[] {
  return progress.challengeRuns
    .filter((run) => run.challengeId === challengeId)
    .sort(challengeComparator)
    .slice(0, MAX_CHALLENGE_RUNS)
}

export function bestRun(progress: Progress, challengeId: string): ChallengeRun | null {
  return leaderboard(progress, challengeId)[0] ?? null
}

export function challengeRunCount(progress: Progress, challengeId: string): number {
  return progress.challengeRuns.filter((run) => run.challengeId === challengeId).length
}

export function recordChallengeRun(
  progress: Progress,
  challenge: Challenge,
  stats: TypingStats,
  failed: boolean,
): { progress: Progress; summary: ChallengeRunSummary } {
  const runs = progress.challengeRuns.filter((run) => run.challengeId === challenge.id)
  const bestWpm = runs.reduce((best, run) => Math.max(best, run.wpm), 0)

  if (failed) {
    return {
      progress,
      summary: {
        xp: 0,
        rank: 0,
        recorded: false,
        totalRuns: runs.length,
        bestWpm,
      },
    }
  }

  const xp = xpForRun(stats, 0, true)
  const run: ChallengeRun = {
    id: `${Date.now()}-b1xyfu`,
    challengeId: challenge.id,
    name: progress.name,
    wpm: stats.wpm,
    accuracy: stats.accuracy,
    chars: stats.typed,
    errors: stats.wrong,
    xp,
    at: Date.now(),
  }

  const forChallenge = [...runs, run].sort(challengeComparator)
  const rank = forChallenge.findIndex((item) => item.id === run.id) + 1
  const kept = forChallenge.slice(0, MAX_CHALLENGE_RUNS)
  const others = progress.challengeRuns.filter((item) => item.challengeId !== challenge.id)
  const next: Progress = {
    ...progress,
    xp: progress.xp + xp,
    challengeRuns: [...others, ...kept],
  }

  return {
    progress: next,
    summary: {
      xp,
      rank,
      recorded: rank <= MAX_CHALLENGE_RUNS,
      totalRuns: forChallenge.length,
      bestWpm: Math.max(bestWpm, stats.wpm),
    },
  }
}

export function clearChallengeRuns(progress: Progress, challengeId: string): Progress {
  return {
    ...progress,
    challengeRuns: progress.challengeRuns.filter((run) => run.challengeId !== challengeId),
  }
}

export function nextLessonAfter(lessonId: string, progress: Progress): Lesson | null {
  const index = LESSONS.findIndex((lesson) => lesson.id === lessonId)
  const next = index >= 0 ? LESSONS[index + 1] : undefined
  if (!next) return null
  if (!levelProgress(progress, next.level).unlocked) return null
  return next
}

export function overallStats(progress: Progress) {
  const completed = LESSONS.filter((lesson) => (progress.lessons[lesson.id]?.bestStars ?? 0) > 0).length
  const stars = LESSONS.reduce((total, lesson) => total + (progress.lessons[lesson.id]?.bestStars ?? 0), 0)
  const bestWpm = Object.values(progress.lessons).reduce((best, record) => Math.max(best, record.bestWpm), 0)
  return {
    completed,
    total: LESSONS.length,
    stars,
    maxStars: LESSONS.length * 3,
    bestWpm,
  }
}

export function lessonsForLevel(levelId: LevelId): Lesson[] {
  return LESSONS.filter((lesson) => lesson.level === levelId)
}

export function challengeById(id: string): Challenge | undefined {
  return CHALLENGES.find((challenge) => challenge.id === id)
}

export function lessonById(id: string): Lesson | undefined {
  return LESSON_BY_ID.get(id)
}
