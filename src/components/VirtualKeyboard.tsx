import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import {
  FINGER_INFO,
  FINGER_LEGEND,
  KEY_ROWS,
  oppositeShift,
  resolveChar,
} from '../data/keyboard'
import type { KeyFeedback } from '../hooks/useTypingEngine'

interface VirtualKeyboardProps {
  targetChar?: string | null
  pressed?: KeyFeedback | null
  highlightChars?: string[]
  highlightIds?: string[]
  fingerTint?: boolean
  compact?: boolean
}

export function VirtualKeyboard({
  targetChar = null,
  pressed = null,
  highlightChars = [],
  highlightIds = [],
  fingerTint = false,
  compact = false,
}: VirtualKeyboardProps) {
  const target = targetChar ? resolveChar(targetChar) : null
  const pressedKey = pressed ? resolveChar(pressed.char) : null
  const shiftHint = target && target.shift ? oppositeShift(target.key) : null
  const scrollRef = useRef<HTMLDivElement>(null)
  const targetId = target?.key.id ?? null

  useEffect(() => {
    const container = scrollRef.current
    if (!container || !targetId) return
    const keyEl = container.querySelector<HTMLElement>(`[data-key="${targetId}"]`)
    if (!keyEl) return
    const keyRect = keyEl.getBoundingClientRect()
    const boxRect = container.getBoundingClientRect()
    const margin = 18
    let delta = 0
    if (keyRect.left < boxRect.left + margin) {
      delta = keyRect.left - boxRect.left - margin
    } else if (keyRect.right > boxRect.right - margin) {
      delta = keyRect.right - boxRect.right + margin
    }
    if (delta !== 0) container.scrollLeft += delta
  }, [targetId])

  const highlightedIds = new Set(highlightIds)
  for (const char of highlightChars) {
    const resolved = resolveChar(char)
    if (resolved) highlightedIds.add(resolved.key.id)
  }

  return (
    <div className={`keyboard-shell${compact ? ' keyboard-compact' : ''}`}>
      <div className="keyboard-scroll" ref={scrollRef}>
        <div className="keyboard" aria-hidden="true">
          {KEY_ROWS.map((row, rowIndex) => (
            <div className="kb-row" key={rowIndex}>
              {row.map((key) => {
                const classes = ['key']
                if (key.modifier) classes.push('key-mod')
                if (key.bump) classes.push('key-bump')
                if (fingerTint) classes.push('key-tinted')
                if (highlightedIds.has(key.id)) classes.push('key-highlight')
                if (shiftHint?.id === key.id) classes.push('key-shift')
                if (target?.key.id === key.id) classes.push('key-target')
                if (pressedKey?.key.id === key.id) {
                  classes.push(pressed?.ok ? 'key-pressed' : 'key-pressed-bad')
                }

                const style = {
                  flexGrow: key.width,
                  flexBasis: 0,
                  '--finger': FINGER_INFO[key.finger].color,
                } as CSSProperties

                return (
                  <div className={classes.join(' ')} style={style} key={key.id} data-key={key.id}>
                    {key.shift && key.base && key.shift.toLowerCase() !== key.base ? (
                      <span className="key-shift-label">{key.shift}</span>
                    ) : null}
                    <span className="key-label">{key.label}</span>
                    <span className="key-finger" />
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <FingerLegend />
    </div>
  )
}

export function FingerLegend() {
  return (
    <div className="finger-legend" aria-hidden="true">
      <span className="finger-legend-title">手指分工</span>
      {FINGER_LEGEND.map((item) => (
        <span className="legend-item" key={item.label}>
          <span className="legend-dot" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  )
}

export function FingerHint({ targetChar }: { targetChar: string | null }) {
  const resolved = targetChar ? resolveChar(targetChar) : null

  if (!resolved) {
    return (
      <div className="finger-hint finger-hint-empty">
        <span className="finger-hint-label">准备就绪</span>
        <span className="finger-hint-text">按下第一个键，计时自动开始</span>
      </div>
    )
  }

  const finger = FINGER_INFO[resolved.key.finger]
  const shift = resolved.shift ? oppositeShift(resolved.key) : null
  const display = resolved.key.base === ' ' ? '空格' : targetChar

  return (
    <div className="finger-hint">
      <span className="finger-dot" style={{ background: finger.color }} />
      <span className="finger-hint-label">下一个键</span>
      <kbd className="hint-key">{display}</kbd>
      <span className="finger-hint-text">
        {finger.name}
        {shift ? ` · 配合${shift.id === 'ShiftRight' ? '右' : '左'} Shift` : ''}
      </span>
    </div>
  )
}
