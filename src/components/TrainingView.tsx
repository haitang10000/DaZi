import { useState } from 'react'
import { LEVELS, lessonsOfLevel } from '../data/lessons'
import { highestUnlockedLevel, levelProgress, overallStats } from '../lib/progress'
import { roundWpm } from '../lib/format'
import type { Lesson, LevelId, LevelProgress, Progress } from '../types'
import { ArrowIcon, CheckIcon, LockIcon, Stars } from './ui'

interface TrainingViewProps {
  progress: Progress
  onStartLesson: (lesson: Lesson) => void
  onOpenGuide: () => void
}

export function TrainingView({ progress, onStartLesson, onOpenGuide }: TrainingViewProps) {
  const [selectedLevel, setSelectedLevel] = useState<LevelId>(() => highestUnlockedLevel(progress))
  const statuses = LEVELS.map((level) => levelProgress(progress, level.id))
  const active = statuses.find((status) => status.level.id === selectedLevel) ?? statuses[0]
  const lessons = lessonsOfLevel(active.level.id)
  const overall = overallStats(progress)
  const masteredCount = statuses.filter((status) => status.mastered).length
  const recommended = lessons.find((lesson) => !(progress.lessons[lesson.id]?.bestStars > 0))

  return (
    <div className="view">
      <div className="view-head">
        <div className="view-head-copy">
          <p className="eyebrow">训练路线</p>
          <h1>从基准键，到盲打自由</h1>
          <p className="lead">
            16 节课程按键盘区域逐层拆解。每次练习都会记录速度、准确率与星星，达到晋级条件后自动解锁下一等级。
          </p>
          <div className="head-actions">
            <button type="button" className="btn ghost" onClick={onOpenGuide}>
              先看 5 分钟入门指南 <ArrowIcon />
            </button>
          </div>
        </div>
        <div className="overview-grid">
          <div className="overview-item">
            <span>已完成课程</span>
            <strong>
              {overall.completed}
              <small>/{overall.total}</small>
            </strong>
          </div>
          <div className="overview-item">
            <span>收集星星</span>
            <strong>
              {overall.stars}
              <small>/{overall.maxStars}</small>
            </strong>
          </div>
          <div className="overview-item">
            <span>最佳速度</span>
            <strong>
              {roundWpm(overall.bestWpm)}
              <small> WPM</small>
            </strong>
          </div>
        </div>
      </div>

      <div className="train-layout">
        <aside className="level-rail">
          <div className="rail-head">
            <span>等级路线</span>
            <span>{masteredCount}/4 已晋级</span>
          </div>
          {statuses.map((status, index) => {
            const previous = LEVELS[index - 1]
            return (
              <button
                type="button"
                key={status.level.id}
                className={`level-item${status.level.id === active.level.id ? ' is-active' : ''}${
                  status.unlocked ? '' : ' is-locked'
                }`}
                onClick={() => setSelectedLevel(status.level.id)}
                aria-current={status.level.id === active.level.id ? 'true' : undefined}
              >
                <span className="level-index">0{status.level.id}</span>
                <span className="level-item-body">
                  <span className="level-item-title">
                    <strong>{status.level.name}</strong>
                    <em>{status.level.english}</em>
                  </span>
                  <span className="bar bar-sm">
                    <span style={{ width: `${(status.stars / status.maxStars) * 100}%` }} />
                  </span>
                  <span className="level-item-meta">
                    {status.unlocked
                      ? `${status.stars}/${status.maxStars} 星 · ${status.completed}/${status.total} 课`
                      : `完成「${previous?.name ?? ''}」解锁`}
                  </span>
                </span>
                <span className="level-item-state">
                  {!status.unlocked ? (
                    <LockIcon />
                  ) : status.mastered ? (
                    <span className="mastered-dot">✓</span>
                  ) : null}
                </span>
              </button>
            )
          })}
        </aside>

        <section className="level-main">
          <div className="level-head">
            <div>
              <p className="eyebrow">
                等级 {active.level.id} · {active.level.english}
              </p>
              <h2>
                {active.level.name}
                <span className="level-tagline">{active.level.tagline}</span>
              </h2>
              <p className="level-focus">{active.level.focus}</p>
            </div>
            <div className="level-score">
              <span className="level-stars">
                {active.stars}
                <small>/{active.maxStars}</small>
              </span>
              <span className="level-score-label">本等级星星</span>
            </div>
          </div>

          {!active.unlocked ? (
            <div className="locked-note">
              <LockIcon />
              <span>
                先完成「{LEVELS[active.level.id - 2]?.name}」的晋级条件，这个等级就会自动解锁。下面可以先预览它的要求。
              </span>
            </div>
          ) : null}

          <RequirementCard status={active} />

          <div className="lesson-grid">
            {lessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                stars={progress.lessons[lesson.id]?.bestStars ?? 0}
                attempts={progress.lessons[lesson.id]?.attempts ?? 0}
                unlocked={active.unlocked}
                recommended={recommended?.id === lesson.id && active.unlocked}
                onStart={() => onStartLesson(lesson)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function RequirementCard({ status }: { status: LevelProgress }) {
  const metCount = status.checks.filter((check) => check.met).length
  const next = LEVELS.find((level) => level.id === status.level.id + 1)

  return (
    <div className={`requirements${status.mastered ? ' requirements-met' : ''}`}>
      <div className="requirements-head">
        <div>
          <p className="eyebrow">晋级条件</p>
          <h3>{status.mastered ? '条件已达成' : '四项要求全部达标，即可晋级'}</h3>
        </div>
        <span className="requirements-count">
          {metCount}<small>/4</small>
        </span>
      </div>
      <ul className="requirements-list">
        {status.checks.map((check) => (
          <li key={check.label} className={check.met ? 'req-met' : ''}>
            <span className="req-check">{check.met ? <CheckIcon /> : null}</span>
            <span className="req-label">{check.label}</span>
            <span className="req-detail">{check.detail}</span>
          </li>
        ))}
      </ul>
      {status.mastered ? (
        <p className="req-note">
          {next ? `下一等级「${next.name}」已解锁，继续向前。` : '四个等级全部完成，你已经是盲打高手。'}
        </p>
      ) : null}
    </div>
  )
}

function LessonCard({
  lesson,
  stars,
  attempts,
  unlocked,
  recommended,
  onStart,
}: {
  lesson: Lesson
  stars: number
  attempts: number
  unlocked: boolean
  recommended: boolean
  onStart: () => void
}) {
  return (
    <article
      className={`lesson-card${stars > 0 ? ' is-done' : ''}${unlocked ? '' : ' is-locked'}${
        recommended ? ' is-recommended' : ''
      }`}
    >
      <div className="lesson-top">
        <span className="lesson-no">{String(lesson.order).padStart(2, '0')}</span>
        <span className="region-chip">{lesson.region}</span>
        {recommended ? <span className="recommend-chip">推荐</span> : null}
        <span className="lesson-difficulty" aria-label={`难度 ${lesson.difficulty} / 4`}>
          {[1, 2, 3, 4].map((dot) => (
            <span key={dot} className={dot <= lesson.difficulty ? 'diff-dot diff-on' : 'diff-dot'} />
          ))}
        </span>
      </div>
      <h3>{lesson.title}</h3>
      <p className="lesson-summary">{lesson.summary}</p>
      <div className="lesson-meta">
        <span>
          <strong>{lesson.targetWpm}</strong> WPM
        </span>
        <span>
          <strong>{lesson.targetAccuracy}%</strong> 准确率
        </span>
        <Stars value={stars} size="sm" />
      </div>
      <div className="lesson-foot">
        <span className="lesson-best">{attempts > 0 ? `已练习 ${attempts} 次` : '尚未练习'}</span>
        <button
          type="button"
          className={`btn small${stars > 0 ? ' ghost' : ' primary'}`}
          disabled={!unlocked}
          onClick={onStart}
        >
          {!unlocked ? '尚未解锁' : stars > 0 ? '再练一次' : '开始练习'}
        </button>
      </div>
    </article>
  )
}
