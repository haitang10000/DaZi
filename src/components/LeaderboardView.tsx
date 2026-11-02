import { useState } from 'react'
import { CHALLENGES } from '../data/challenges'
import { formatAccuracy, formatDate, roundWpm } from '../lib/format'
import { leaderboard } from '../lib/progress'
import type { Challenge, Progress } from '../types'

interface LeaderboardViewProps {
  progress: Progress
  dataPath: string
  onRename: (name: string) => void
  onClearChallenge: (challengeId: string) => void
  onClearAllData: () => boolean
  onStartChallenge: (challenge: Challenge) => void
}

export function LeaderboardView({
  progress,
  dataPath,
  onRename,
  onClearChallenge,
  onClearAllData,
  onStartChallenge,
}: LeaderboardViewProps) {
  const [selectedId, setSelectedId] = useState(CHALLENGES[0].id)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmAll, setConfirmAll] = useState(false)
  const [allCleared, setAllCleared] = useState(false)

  const challenge = CHALLENGES.find((item) => item.id === selectedId) ?? CHALLENGES[0]
  const runs = leaderboard(progress, challenge.id)
  const best = runs[0]

  return (
    <div className="view">
      <div className="view-head">
        <div className="view-head-copy">
          <p className="eyebrow">本地积分榜</p>
          <h1>和昨天的自己比一场</h1>
          <p className="lead">
            每个挑战保留本机前 10 名的成绩。名字和成绩只保存在这台电脑上，随时可以修改。
          </p>
        </div>
        <NameForm
          key={progress.name}
          initialName={progress.name}
          onSave={(name) => {
            setAllCleared(false)
            onRename(name)
          }}
        />
      </div>

      <section className="board-card">
        <div className="board-tabs" role="tablist" aria-label="挑战项目">
          {CHALLENGES.map((item) => (
            <button
              type="button"
              key={item.id}
              role="tab"
              aria-selected={item.id === selectedId}
              className={item.id === selectedId ? 'board-tab is-active' : 'board-tab'}
              onClick={() => {
                setSelectedId(item.id)
                setConfirmClear(false)
              }}
            >
              {item.name}
              <span>{item.durationSec} 秒</span>
            </button>
          ))}
        </div>

        <div className="board-meta">
          <span>{challenge.description}</span>
          <span className="board-best">
            {best ? (
              <>
                个人最佳 <strong>{roundWpm(best.wpm)} WPM</strong> · {formatAccuracy(best.accuracy)}
              </>
            ) : (
              '还没有成绩'
            )}
          </span>
        </div>

        <div className="board-tools">
          {confirmClear ? (
            <span className="confirm-inline">
              清空「{challenge.name}」的全部记录？
              <button
                type="button"
                className="text-btn danger"
                onClick={() => {
                  onClearChallenge(challenge.id)
                  setConfirmClear(false)
                }}
              >
                确认清空
              </button>
              <button type="button" className="text-btn" onClick={() => setConfirmClear(false)}>
                取消
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="btn ghost small"
              disabled={runs.length === 0}
              onClick={() => setConfirmClear(true)}
            >
              清空记录
            </button>
          )}
        </div>

        {runs.length > 0 ? (
          <div className="board-table-wrap">
            <table className="board-table">
              <thead>
                <tr>
                  <th>名次</th>
                  <th>玩家</th>
                  <th>速度</th>
                  <th>准确率</th>
                  <th>日期</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run, index) => (
                  <tr key={run.id} className={run.name === progress.name ? 'is-me' : ''}>
                    <td>
                      <span className={`rank rank-${index + 1}`}>{index + 1}</span>
                    </td>
                    <td>
                      {run.name}
                      {run.name === progress.name ? <span className="you-badge">你</span> : null}
                    </td>
                    <td>
                      <strong>{roundWpm(run.wpm)}</strong>
                      <span className="cell-unit"> WPM</span>
                    </td>
                    <td>{formatAccuracy(run.accuracy)}</td>
                    <td>{formatDate(run.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="board-empty">
            <strong>这个挑战还没有记录</strong>
            <p>完成一次挑战，成绩就会出现在这里。</p>
            <button type="button" className="btn primary small" onClick={() => onStartChallenge(challenge)}>
              去挑战
            </button>
          </div>
        )}
      </section>

      <p className="local-note">
        积分榜是本地单机排行榜：数据不会上传网络，只会写入下方这台电脑上的数据文件。
      </p>

      <section className="data-card" aria-labelledby="local-data-title">
        <div className="data-card-copy">
          <p className="eyebrow" id="local-data-title">本机数据</p>
          <p className="data-card-lead">课程进度、昵称、设置与挑战成绩都保存在这一个文件中。</p>
          <code className="data-card-path" title={dataPath}>
            {dataPath || '未检测到桌面数据文件'}
          </code>
        </div>
        <div className="data-card-actions">
          {confirmAll ? (
            <span className="confirm-inline">
              清除全部数据后无法恢复，确定？
              <button
                type="button"
                className="text-btn danger"
                onClick={() => {
                  if (onClearAllData()) {
                    setConfirmAll(false)
                    setAllCleared(true)
                  }
                }}
              >
                确认清除
              </button>
              <button type="button" className="text-btn" onClick={() => setConfirmAll(false)}>
                取消
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="btn ghost small data-clear"
              onClick={() => {
                setAllCleared(false)
                setConfirmAll(true)
              }}
            >
              清除全部数据
            </button>
          )}
          {allCleared ? (
            <span className="data-cleared" role="status">
              已清除全部本机数据
            </span>
          ) : null}
        </div>
      </section>
    </div>
  )
}

function NameForm({ initialName, onSave }: { initialName: string; onSave: (name: string) => void }) {
  const [name, setName] = useState(initialName)

  return (
    <form
      className="name-form"
      onSubmit={(event) => {
        event.preventDefault()
        onSave(name)
      }}
    >
      <label htmlFor="player-name">玩家昵称</label>
      <div className="name-row">
        <input
          id="player-name"
          value={name}
          maxLength={12}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => onSave(name)}
          placeholder="打字新手"
        />
        <button type="submit" className="btn small">
          保存
        </button>
      </div>
      <span className="name-hint">用于成绩记录，最多 12 个字符</span>
    </form>
  )
}
