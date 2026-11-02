import { useEffect, useRef, useState } from 'react'
import { ChallengeView } from './components/ChallengeView'
import { GuideView } from './components/GuideView'
import { LeaderboardView } from './components/LeaderboardView'
import { PracticeView } from './components/PracticeView'
import type { PracticeSession } from './components/PracticeView'
import { TrainingView } from './components/TrainingView'
import { LEVELS } from './data/lessons'
import {
  clearChallengeRuns,
  highestUnlockedLevel,
  recordChallengeRun,
  recordLessonRun,
} from './lib/progress'
import {
  clearAllProgress,
  createEmptyProgress,
  getDataPath,
  loadProgress,
  sanitizeName,
  saveProgress,
} from './lib/storage'
import type {
  Challenge,
  ChallengeRunSummary,
  Lesson,
  LessonRunSummary,
  Progress,
  TypingStats,
} from './types'

type View = 'train' | 'guide' | 'challenge' | 'leaderboard'

const NAV_ITEMS: { id: View; label: string }[] = [
  { id: 'train', label: '训练' },
  { id: 'guide', label: '入门指南' },
  { id: 'challenge', label: '挑战' },
  { id: 'leaderboard', label: '积分榜' },
]

function App() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress())
  const progressRef = useRef(progress)
  const [view, setView] = useState<View>('train')
  const [origin, setOrigin] = useState<View>('train')
  const [session, setSession] = useState<PracticeSession | null>(null)
  const [sessionKey, setSessionKey] = useState(0)
  const [dataPath] = useState(() => getDataPath())
  const [storageError, setStorageError] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  function persist(next: Progress) {
    const result = saveProgress(next)
    if (!result.ok) {
      setStorageError(result.error || '无法写入本机数据文件，请检查应用目录权限。')
      return
    }
    setStorageError((current) => (current ? '' : current))
  }

  function updateProgress(update: (current: Progress) => Progress) {
    const next = update(progressRef.current)
    if (next === progressRef.current) return
    progressRef.current = next
    setProgress(next)
    persist(next)
  }

  function go(next: View) {
    setSession(null)
    setView(next)
    window.scrollTo(0, 0)
  }

  function startLesson(lesson: Lesson) {
    setOrigin('train')
    setSession({ kind: 'lesson', lesson })
    setSessionKey((key) => key + 1)
    window.scrollTo(0, 0)
  }

  function startChallenge(challenge: Challenge) {
    setOrigin('challenge')
    setSession({ kind: 'challenge', challenge })
    setSessionKey((key) => key + 1)
    window.scrollTo(0, 0)
  }

  function exitPractice() {
    setSession(null)
    setView(origin)
    window.scrollTo(0, 0)
  }

  function handleRecordLesson(lesson: Lesson, stats: TypingStats): LessonRunSummary {
    const result = recordLessonRun(progressRef.current, lesson, stats)
    updateProgress(() => result.progress)
    return result.summary
  }

  function handleRecordChallenge(
    challenge: Challenge,
    stats: TypingStats,
    failed: boolean,
  ): ChallengeRunSummary {
    const result = recordChallengeRun(progressRef.current, challenge, stats, failed)
    updateProgress(() => result.progress)
    return result.summary
  }

  function handleRename(name: string) {
    const cleaned = sanitizeName(name)
    updateProgress((current) =>
      current.name === cleaned
        ? current
        : {
            ...current,
            name: cleaned,
            challengeRuns: current.challengeRuns.map((run) => ({ ...run, name: cleaned })),
          },
    )
  }

  function handleClearChallenge(challengeId: string) {
    updateProgress((current) => clearChallengeRuns(current, challengeId))
  }

  function toggleSound() {
    updateProgress((current) => ({ ...current, sound: !current.sound }))
  }

  function handleClearAllData(): boolean {
    const result = clearAllProgress()
    if (!result.ok) {
      setStorageError(result.error || '无法清除本机数据文件，请检查应用目录权限。')
      return false
    }
    const fresh = createEmptyProgress()
    progressRef.current = fresh
    setProgress(fresh)
    setStorageError('')
    return true
  }

  const currentLevel = LEVELS.find((level) => level.id === highestUnlockedLevel(progress)) ?? LEVELS[0]
  const backLabel = origin === 'challenge' ? '挑战' : '训练'

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <button type="button" className="brand" onClick={() => go('train')} aria-label="键径首页">
            <span className="brand-mark" aria-hidden="true">
              K
            </span>
            <span className="brand-text">
              <strong>键径</strong>
              <span>KeyPath</span>
            </span>
          </button>

          <nav className="nav" aria-label="主导航">
            {NAV_ITEMS.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`nav-item${view === item.id ? ' is-active' : ''}`}
                aria-current={view === item.id ? 'page' : undefined}
                onClick={() => go(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="topbar-right">
            <span className="level-pill">
              Lv.{currentLevel.id} · {currentLevel.name}
            </span>
            <span className="xp-pill" title="累计经验值">
              ✦ {progress.xp} XP
            </span>
            <button
              type="button"
              className="sound-toggle"
              onClick={toggleSound}
              aria-pressed={progress.sound}
              title={progress.sound ? '关闭按键音效' : '开启按键音效'}
            >
              <SoundIcon on={progress.sound} />
              <span>{progress.sound ? '音效开' : '静音'}</span>
            </button>
          </div>
        </div>
      </header>

      {storageError ? (
        <div className="storage-alert" role="alert">
          <strong>本机数据操作失败</strong>
          <span>{storageError}</span>
        </div>
      ) : null}

      <main className="page">
        {session ? (
          <PracticeView
            key={sessionKey}
            session={session}
            progress={progress}
            backLabel={backLabel}
            onExit={exitPractice}
            onRecordLesson={handleRecordLesson}
            onRecordChallenge={handleRecordChallenge}
            onStartLesson={startLesson}
            onOpenLeaderboard={() => go('leaderboard')}
          />
        ) : (
          <>
            {view === 'train' ? (
              <TrainingView
                progress={progress}
                onStartLesson={startLesson}
                onOpenGuide={() => go('guide')}
              />
            ) : null}
            {view === 'guide' ? (
              <GuideView onStartTraining={() => go('train')} onStartLesson={startLesson} />
            ) : null}
            {view === 'challenge' ? (
              <ChallengeView
                progress={progress}
                onStart={startChallenge}
                onOpenLeaderboard={() => go('leaderboard')}
              />
            ) : null}
            {view === 'leaderboard' ? (
              <LeaderboardView
                progress={progress}
                dataPath={dataPath}
                onRename={handleRename}
                onClearChallenge={handleClearChallenge}
                onClearAllData={handleClearAllData}
                onStartChallenge={startChallenge}
              />
            ) : null}
          </>
        )}
      </main>

      {!session ? (
        <footer className="footer">
          <span>键径 KeyPath · 开源打字练习</span>
          <span>所有数据保存在本机文件</span>
          <span>MIT License</span>
        </footer>
      ) : null}
    </div>
  )
}

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 10v4h3.5L12 18V6L7.5 10H4z" strokeLinejoin="round" />
      {on ? (
        <>
          <path d="M15.5 9.2a4 4 0 0 1 0 5.6" strokeLinecap="round" />
          <path d="M18 6.8a7.2 7.2 0 0 1 0 10.4" strokeLinecap="round" />
        </>
      ) : (
        <path d="M16 9.5l4 4m0-4l-4 4" strokeLinecap="round" />
      )}
    </svg>
  )
}

export default App
