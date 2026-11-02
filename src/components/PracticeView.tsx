import { useEffect, useState } from 'react'
import { buildChallengeText } from '../data/challenges'
import { LEVELS } from '../data/lessons'
import { useTypingEngine } from '../hooks/useTypingEngine'
import type { FinishOutcome } from '../hooks/useTypingEngine'
import { formatAccuracy, formatClock, formatSeconds, roundWpm } from '../lib/format'
import { nextLessonAfter } from '../lib/progress'
import { playFeedback } from '../lib/sound'
import type {
  Challenge,
  ChallengeRunSummary,
  Lesson,
  LessonRunSummary,
  Progress,
  TypingStats,
} from '../types'
import { FingerHint, VirtualKeyboard } from './VirtualKeyboard'
import { Stars } from './ui'

export type PracticeSession =
  | { kind: 'lesson'; lesson: Lesson }
  | { kind: 'challenge'; challenge: Challenge }

interface PracticeViewProps {
  session: PracticeSession
  progress: Progress
  backLabel: string
  onExit: () => void
  onRecordLesson: (lesson: Lesson, stats: TypingStats) => LessonRunSummary
  onRecordChallenge: (challenge: Challenge, stats: TypingStats, failed: boolean) => ChallengeRunSummary
  onStartLesson: (lesson: Lesson) => void
  onOpenLeaderboard: () => void
}

type RunResult =
  | { kind: 'lesson'; stats: TypingStats; summary: LessonRunSummary }
  | { kind: 'challenge'; stats: TypingStats; summary: ChallengeRunSummary; failed: boolean }

export function PracticeView({
  session,
  progress,
  backLabel,
  onExit,
  onRecordLesson,
  onRecordChallenge,
  onStartLesson,
  onOpenLeaderboard,
}: PracticeViewProps) {
  const [runKey, setRunKey] = useState(0)
  const [result, setResult] = useState<RunResult | null>(null)
  const [challengeText, setChallengeText] = useState(() =>
    session.kind === 'challenge' ? buildChallengeText(session.challenge) : '',
  )

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onExit])

  function handleFinish(stats: TypingStats, outcome: FinishOutcome) {
    if (result) return

    if (session.kind === 'lesson') {
      const summary = onRecordLesson(session.lesson, stats)
      playFeedback('finish', progress.sound)
      setResult({ kind: 'lesson', stats, summary })
      return
    }

    const failed = outcome === 'failed'
    const summary = onRecordChallenge(session.challenge, stats, failed)
    if (!failed) playFeedback('finish', progress.sound)
    setResult({ kind: 'challenge', stats, summary, failed })
  }

  function restart() {
    if (session.kind === 'challenge') {
      setChallengeText(buildChallengeText(session.challenge))
    }
    setResult(null)
    setRunKey((key) => key + 1)
  }

  const level = session.kind === 'lesson'
    ? LEVELS.find((item) => item.id === session.lesson.level)
    : null

  return (
    <div className="practice">
      <div className="practice-top">
        <button type="button" className="btn ghost back-btn" onClick={onExit}>
          ← {backLabel}
        </button>
        <div className="practice-heading">
          <p className="eyebrow">
            {session.kind === 'lesson'
              ? `等级 ${level?.name ?? ''} · 第 ${session.lesson.order} 课`
              : `计时挑战 · ${session.challenge.badge}`}
          </p>
          <h1>{session.kind === 'lesson' ? session.lesson.title : session.challenge.name}</h1>
        </div>
      </div>

      {result ? (
        <ResultPanel
          session={session}
          result={result}
          progress={progress}
          backLabel={backLabel}
          onRestart={restart}
          onExit={onExit}
          onStartLesson={onStartLesson}
          onOpenLeaderboard={onOpenLeaderboard}
        />
      ) : (
        <TypingSession
          key={runKey}
          text={session.kind === 'lesson' ? session.lesson.text : challengeText}
          lesson={session.kind === 'lesson' ? session.lesson : null}
          challenge={session.kind === 'challenge' ? session.challenge : null}
          sound={progress.sound}
          onFinish={handleFinish}
        />
      )}
    </div>
  )
}

interface TypingSessionProps {
  text: string
  lesson: Lesson | null
  challenge: Challenge | null
  sound: boolean
  onFinish: (stats: TypingStats, outcome: FinishOutcome) => void
}

function TypingSession({ text, lesson, challenge, sound, onFinish }: TypingSessionProps) {
  const durationMs = challenge ? challenge.durationSec * 1000 : undefined
  const engine = useTypingEngine({
    text,
    durationMs,
    maxWrong: challenge?.maxWrong,
    sound,
    onFinish,
  })

  const lastInput = engine.lastInput
  const targetChar = engine.cursor < text.length ? text[engine.cursor] : null
  const progressRatio = challenge
    ? Math.min(1, engine.elapsedMs / (challenge.durationSec * 1000))
    : Math.min(1, engine.cursor / text.length)
  const isWrong = lastInput?.ok === false
  const remaining = engine.remainingMs ?? 0
  const maxWrong = challenge?.maxWrong
  const lives = maxWrong !== undefined ? Math.max(0, maxWrong - engine.stats.wrong) : null

  return (
    <div className="practice-body">
      <section className="typing-card">
        <div className="typing-meta">
          <span>{lesson ? `${lesson.region} · 难度 ${lesson.difficulty}/4` : `${challenge?.badge} · ${challenge?.durationSec} 秒`}</span>
          <span className="typing-meta-right">
            {challenge ? (
              <>
                {lives !== null && (
                  <span className="lives" aria-label={`剩余 ${lives} 次失误机会`}>
                    {[0, 1, 2].map((index) => (
                      <span key={index} className={index < lives ? 'life' : 'life life-lost'}>
                        ♥
                      </span>
                    ))}
                  </span>
                )}
                <span className={remaining <= 10_000 ? 'countdown countdown-urgent' : 'countdown'}>
                  {formatClock(remaining)}
                </span>
              </>
            ) : (
              <span>目标 {lesson?.targetWpm} WPM · {lesson?.targetAccuracy}%</span>
            )}
          </span>
        </div>

        <div className="typing-progress" aria-hidden="true">
          <span style={{ width: `${progressRatio * 100}%` }} />
        </div>

        <TypingText text={text} cursor={engine.cursor} wrong={Boolean(isWrong && engine.cursor < text.length)} />

        <div className="typing-foot">
          <span>直接开始输入 · 计时从第一次按键开始</span>
          <span>英文输入 · Esc 退出</span>
        </div>
      </section>

      <p className="practice-tip">
        <span className="tip-label">提示</span>
        {lesson ? lesson.tip : challenge?.description}
      </p>

      <div className="stats-row">
        <Stat label="速度" value={`${roundWpm(engine.stats.wpm)}`} unit="WPM" />
        <Stat
          label="准确率"
          value={engine.status === 'idle' ? '—' : formatAccuracy(engine.stats.accuracy)}
        />
        <Stat
          label={challenge ? '剩余' : '用时'}
          value={challenge ? formatClock(remaining) : formatClock(engine.stats.elapsedMs)}
        />
        <Stat
          label="失误"
          value={String(engine.stats.wrong)}
          tone={engine.stats.wrong > 0 ? 'bad' : undefined}
        />
        <Stat
          label="连击"
          value={engine.combo > 0 ? String(engine.combo) : '—'}
          tone={engine.combo >= 10 ? 'good' : undefined}
        />
      </div>

      <div className="kb-panel">
        <FingerHint targetChar={targetChar} />
        <VirtualKeyboard targetChar={targetChar} pressed={lastInput} />
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  unit,
  tone,
}: {
  label: string
  value: string
  unit?: string
  tone?: 'good' | 'bad'
}) {
  return (
    <div className={`stat${tone ? ` stat-${tone}` : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">
        {value}
        {unit ? <span className="stat-unit">{unit}</span> : null}
      </span>
    </div>
  )
}

function wordWindowStart(text: string, cursor: number): number {
  if (cursor < 160) return 0
  let start = 0
  let guard = 0

  while (cursor >= start + 160 && guard < 200) {
    const candidate = text.lastIndexOf(' ', start + 100)
    start = candidate > start + 20 ? candidate + 1 : start + 80
    guard += 1
  }

  return start
}

function TypingText({ text, cursor, wrong }: { text: string; cursor: number; wrong: boolean }) {
  const windowSize = 200
  const start = wordWindowStart(text, cursor)
  let visibleEnd = Math.min(text.length, start + windowSize)
  if (visibleEnd < text.length) {
    const lastSpace = text.lastIndexOf(' ', visibleEnd)
    if (lastSpace > start + 120) visibleEnd = lastSpace
  }
  const chars = text.slice(start, visibleEnd).split('')

  return (
    <div className="typing-text" aria-label="练习文本">
      {chars.map((char, index) => {
        const absoluteIndex = start + index
        const classes = ['char']
        if (absoluteIndex < cursor) classes.push('char-ok')
        if (absoluteIndex === cursor) {
          classes.push('char-current')
          if (wrong) classes.push('char-wrong')
        }
        if (char === ' ') classes.push('char-space')

        return (
          <span className={classes.join(' ')} key={absoluteIndex}>
            {char}
          </span>
        )
      })}
    </div>
  )
}

function ResultPanel({
  session,
  result,
  progress,
  backLabel,
  onRestart,
  onExit,
  onStartLesson,
  onOpenLeaderboard,
}: {
  session: PracticeSession
  result: RunResult
  progress: Progress
  backLabel: string
  onRestart: () => void
  onExit: () => void
  onStartLesson: (lesson: Lesson) => void
  onOpenLeaderboard: () => void
}) {
  const lesson = session.kind === 'lesson' ? session.lesson : null
  const challenge = session.kind === 'challenge' ? session.challenge : null
  const isLesson = result.kind === 'lesson'
  const stars = isLesson ? result.summary.stars : 0
  const nextLesson = lesson ? nextLessonAfter(lesson.id, progress) : null

  let title = '挑战完成'
  let message = ''
  let eyebrow = '练习结算'

  if (result.kind === 'lesson' && lesson) {
    eyebrow = '练习结算'
    title = stars === 3 ? '三星到手' : stars === 2 ? '稳稳完成' : stars === 1 ? '完成本课' : '还差一颗星'
    message = lessonResultMessage(lesson, stars, result.stats)
  } else if (result.kind === 'challenge') {
    eyebrow = '挑战结算'
    if (result.failed) {
      title = '挑战失败'
      const allowed = challenge?.maxWrong ?? 3
      message = `第 ${allowed + 1} 次失误出现，本局结束，不计入积分榜。允许失误是 ${allowed} 次，下一次稳一点。`
    } else {
      title = result.summary.rank === 1 ? '本机第一' : '成绩有效'
      message = result.summary.recorded
        ? `已记入本地积分榜，本轮排名第 ${result.summary.rank} 名。`
        : '成绩有效，但还没进入前 10 名。调整节奏，再试一次。'
    }
  }

  return (
    <section className="result-card" aria-live="polite">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="result-title">{title}</h2>

      {isLesson ? (
        <div className="result-hero result-stars">
          <Stars value={stars} size="lg" />
        </div>
      ) : (
        <div className="result-hero">
          <span className="result-score">{roundWpm(result.stats.wpm)}</span>
          <span className="result-score-unit">WPM</span>
        </div>
      )}

      <p className="result-message">{message}</p>

      {result.kind === 'lesson' && result.summary.promotion ? (
        <div className="promotion-banner">
          晋级成功 · 已解锁「{result.summary.promotion}」
        </div>
      ) : null}

      {result.kind === 'challenge' && result.summary.rank === 1 && !result.failed ? (
        <div className="promotion-banner">刷新了本机最好的成绩</div>
      ) : null}

      <div className="result-grid">
        <div>
          <span>速度</span>
          <strong>{roundWpm(result.stats.wpm)}<small> WPM</small></strong>
        </div>
        <div>
          <span>准确率</span>
          <strong>{formatAccuracy(result.stats.accuracy)}</strong>
        </div>
        <div>
          <span>用时</span>
          <strong>{formatSeconds(result.stats.elapsedMs)}</strong>
        </div>
        <div>
          <span>失误</span>
          <strong>{result.stats.wrong}</strong>
        </div>
      </div>

      <div className="result-extra">
        {result.kind === 'lesson' ? (
          <span>
            历史最佳：{result.summary.bestStars} 星 · {roundWpm(result.summary.bestWpm)} WPM ·{' '}
            {formatAccuracy(result.summary.bestAccuracy)}
            {result.summary.newBest ? <em className="new-best">新纪录</em> : null}
          </span>
        ) : result.failed ? (
          <span>本局没有获得经验值，成绩也不会计入积分榜。</span>
        ) : (
          <span>
            本轮有效字符 {result.stats.typed} 个 · 历史最佳 {roundWpm(result.summary.bestWpm)} WPM
          </span>
        )}
        {result.summary.xp > 0 ? <span className="xp-badge">+{result.summary.xp} XP</span> : null}
      </div>

      <div className="result-actions">
        {result.kind === 'lesson' ? (
          <>
            <button type="button" className="btn ghost" onClick={onRestart}>
              再练一次
            </button>
            {nextLesson ? (
              <button type="button" className="btn primary" onClick={() => onStartLesson(nextLesson)}>
                下一课 · {nextLesson.title} →
              </button>
            ) : (
              <span className="result-done">全部课程已完成</span>
            )}
            <button type="button" className="btn ghost" onClick={onExit}>
              返回{backLabel}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn primary" onClick={onRestart}>
              再来一局
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={onOpenLeaderboard}
            >
              查看积分榜
            </button>
            <button type="button" className="btn ghost" onClick={onExit}>
              返回{backLabel}
            </button>
          </>
        )}
      </div>
    </section>
  )
}

function lessonResultMessage(lesson: Lesson, stars: number, stats: TypingStats): string {
  if (stars === 3) {
    return '准确率和速度都达到了目标。保持这个节奏，继续下一课。'
  }
  if (stars === 2) {
    return `准确率已达标，速度再快一点就能拿到三星（目标 ${lesson.targetWpm} WPM）。`
  }
  if (stars === 1) {
    return `本课完成。下一颗星需要准确率 ${lesson.targetAccuracy}%、速度 ${lesson.targetWpm} WPM（本轮准确率 ${formatAccuracy(stats.accuracy)}）。`
  }
  return '准确率需要达到 80% 才能完成本课。慢一点，把每个键按对再继续。'
}
