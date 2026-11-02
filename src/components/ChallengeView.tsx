import { CHALLENGES } from '../data/challenges'
import { bestRun, challengeRunCount } from '../lib/progress'
import { formatAccuracy, roundWpm } from '../lib/format'
import type { Challenge, Progress } from '../types'
import { ArrowIcon } from './ui'

interface ChallengeViewProps {
  progress: Progress
  onStart: (challenge: Challenge) => void
  onOpenLeaderboard: () => void
}

export function ChallengeView({ progress, onStart, onOpenLeaderboard }: ChallengeViewProps) {
  return (
    <div className="view">
      <div className="view-head">
        <div className="view-head-copy">
          <p className="eyebrow">计时挑战</p>
          <h1>给自己一小段时间</h1>
          <p className="lead">
            三场短挑战，检验练习成果。挑战开始后计时自动运行，结束时成绩会记入本地积分榜。
          </p>
          <div className="head-actions">
            <button type="button" className="btn ghost" onClick={onOpenLeaderboard}>
              查看本地积分榜 <ArrowIcon />
            </button>
          </div>
        </div>
      </div>

      <div className="challenge-grid">
        {CHALLENGES.map((challenge) => {
          const best = bestRun(progress, challenge.id)
          const count = challengeRunCount(progress, challenge.id)

          return (
            <article className="challenge-card" key={challenge.id}>
              <div className="challenge-top">
                <span className="challenge-badge">{challenge.badge}</span>
                <span className="challenge-time">{challenge.durationSec} 秒</span>
              </div>
              <div className="challenge-number">
                <strong>{challenge.durationSec}</strong>
                <span>秒</span>
              </div>
              <h3>{challenge.name}</h3>
              <p className="challenge-desc">{challenge.description}</p>
              <ul className="challenge-rules">
                {challenge.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
              <div className="challenge-best">
                {best ? (
                  <>
                    <span className="challenge-best-label">个人最佳</span>
                    <strong>{roundWpm(best.wpm)}<small> WPM</small></strong>
                    <span className="challenge-best-meta">
                      {formatAccuracy(best.accuracy)} · 共 {count} 次
                    </span>
                  </>
                ) : (
                  <span className="challenge-best-empty">还没有成绩，来留下第一个。</span>
                )}
              </div>
              <button type="button" className="btn primary block" onClick={() => onStart(challenge)}>
                开始挑战
              </button>
            </article>
          )
        })}
      </div>

      <p className="local-note">
        挑战文本会随机生成，每次都不一样。成绩只保存在本机数据文件，不会上传到任何服务器。
      </p>
    </div>
  )
}
