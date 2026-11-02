import { useState } from 'react'
import { LESSONS, LEVELS } from '../data/lessons'
import type { Lesson } from '../types'
import { VirtualKeyboard } from './VirtualKeyboard'

interface GuideStep {
  kicker: string
  title: string
  body: string[]
  tip?: string
  keys?: string[]
  ids?: string[]
  tint?: boolean
}

const STEPS: GuideStep[] = [
  {
    kicker: '第 1 步 · 准备',
    title: '先坐下来，放松肩膀',
    body: [
      '屏幕顶部与视线大致平齐，眼睛离屏幕约一臂的距离。手肘自然弯曲成 90 度，手腕轻轻悬空，不要压在桌面上。',
      '每次练习 10 到 15 分钟，比一次练一小时更有效。累了就停下来，错误的动作练得越多越难改。',
    ],
    tip: '不追求快。整个软件里的速度要求，都会在准确率达标之后才变得重要。',
  },
  {
    kicker: '第 2 步 · 基准键',
    title: '找到双手的家：F 和 J',
    body: [
      '左手食指放在 F，右手食指放在 J。两个键上都有小凸起，闭着眼睛也能摸到。',
      '其余手指依次落下：左手 A S D，右手 K L ;。这八个键叫「基准键」，每一次移动之后都要回到这里。',
    ],
    tip: '找不到手位的时候，不要低头看键盘，用食指去摸 F 和 J 的凸起。',
    keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
  },
  {
    kicker: '第 3 步 · 分工',
    title: '每个手指，只负责自己的那一列',
    body: [
      '颜色代表手指的分工：小指、无名指、中指各自管一列，食指负责两列，拇指只负责空格。',
      '移动手指时，手掌和手腕保持不动，只让需要工作的那根手指伸出去。按完立刻归位。',
    ],
    tip: '刚开始慢一点没关系。用对指，比按得快重要得多。',
    tint: true,
  },
  {
    kicker: '第 4 步 · 上下排',
    title: '上排伸展，下排下探',
    body: [
      '上排从 Q 到 P，由基准键手指向上伸出去按。下排从 Z 到 /，手指向下弯，手腕不要跟着下沉。',
      '数字排在最上面：1 归左小指，2 到 5 依次由左无名指、中指、食指负责；右半边对称。',
    ],
    tip: '按上排时用指尖向上够，不要把整只手抬起来。',
    keys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
  },
  {
    kicker: '第 5 步 · 空格与 Shift',
    title: '拇指管空格，Shift 交给对侧',
    body: [
      '空格永远由拇指负责：左手拇指或右手拇指都可以，选一只舒服的手固定下来。',
      '需要大写或上档符号时按住 Shift。左手按键用右手 Shift，右手按键用左手 Shift，这样两只手可以同时工作。',
    ],
    tip: '退格只用来修正偶尔的错误，不要把「打错再删」当成习惯。',
    keys: [' '],
    ids: ['ShiftLeft', 'ShiftRight'],
  },
  {
    kicker: '第 6 步 · 路线',
    title: '四个等级，一步步升级',
    body: [
      '入门练基准键和上下排，中等开始左右手分区与数字排，老手加入大写、标点与短句，专家练习符号、长句与极限速度。',
      '每个等级有 4 节课。完成课程、积累星星、达到最佳速度和平均准确率，就能晋级。所有进度都会保存在本机。',
    ],
    tip: '如果只记得一件事：准确率优先。速度会在熟练之后自己出现。',
  },
]

export function GuideView({
  onStartTraining,
  onStartLesson,
}: {
  onStartTraining: () => void
  onStartLesson: (lesson: Lesson) => void
}) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="view">
      <div className="view-head">
        <div className="view-head-copy">
          <p className="eyebrow">入门指南</p>
          <h1>五分钟，学会正确地按键</h1>
          <p className="lead">
            不追求快。先把坐姿、手位和手指分工做对，速度是顺带的结果。看完这几步，就可以开始第一课。
          </p>
        </div>
      </div>

      <div className="guide-layout">
        <ol className="guide-steps">
          {STEPS.map((item, index) => (
            <li key={item.kicker}>
              <button
                type="button"
                className={`guide-step-btn${index === step ? ' is-active' : ''}`}
                onClick={() => setStep(index)}
                aria-current={index === step ? 'step' : undefined}
              >
                <span className="guide-step-no">{String(index + 1).padStart(2, '0')}</span>
                <span>{item.title}</span>
              </button>
            </li>
          ))}
        </ol>

        <article className="guide-card">
          <p className="eyebrow">{current.kicker}</p>
          <h2>{current.title}</h2>
          <div className="guide-body">
            {current.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          {current.tip ? <p className="guide-tip">{current.tip}</p> : null}

          {current.keys || current.ids || current.tint ? (
            <div className="guide-demo">
              <VirtualKeyboard
                highlightChars={current.keys}
                highlightIds={current.ids}
                fingerTint={current.tint}
                compact
              />
            </div>
          ) : null}

          {isLast ? (
            <ul className="route-list">
              {LEVELS.map((level) => (
                <li key={level.id}>
                  <span className="route-level">0{level.id}</span>
                  <span className="route-name">{level.name}</span>
                  <span className="route-focus">{level.focus}</span>
                  <span className="route-require">
                    {level.require.stars} 星 · {level.require.wpm} WPM · {level.require.accuracy}%
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="guide-nav">
            <button
              type="button"
              className="btn ghost"
              disabled={step === 0}
              onClick={() => setStep((value) => Math.max(0, value - 1))}
            >
              上一步
            </button>
            <span className="guide-dots" aria-hidden="true">
              {STEPS.map((item, index) => (
                <span key={item.kicker} className={index === step ? 'dot dot-on' : 'dot'} />
              ))}
            </span>
            {isLast ? (
              <div className="guide-final-actions">
                <button type="button" className="btn ghost" onClick={onStartTraining}>
                  返回训练
                </button>
                <button type="button" className="btn primary" onClick={() => onStartLesson(LESSONS[0])}>
                  开始第 1 课 →
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn primary"
                onClick={() => setStep((value) => Math.min(STEPS.length - 1, value + 1))}
              >
                下一步
              </button>
            )}
          </div>
        </article>
      </div>
    </div>
  )
}
