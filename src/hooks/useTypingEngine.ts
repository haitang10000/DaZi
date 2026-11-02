import { useCallback, useEffect, useRef, useState } from 'react'
import { playFeedback } from '../lib/sound'
import type { TypingStats } from '../types'

export type FinishOutcome = 'completed' | 'timeout' | 'failed'
export type EngineStatus = 'idle' | 'running' | 'finished'

export interface KeyFeedback {
  char: string
  ok: boolean
  nonce: number
}

export interface EngineOptions {
  text: string
  durationMs?: number
  maxWrong?: number
  sound: boolean
  onFinish: (stats: TypingStats, outcome: FinishOutcome) => void
}

export interface TypingEngine {
  cursor: number
  status: EngineStatus
  stats: TypingStats
  lastInput: KeyFeedback | null
  combo: number
  bestCombo: number
  elapsedMs: number
  remainingMs: number | null
  outcome: FinishOutcome | null
}

export function useTypingEngine(options: EngineOptions): TypingEngine {
  const [cursor, setCursor] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [status, setStatus] = useState<EngineStatus>('idle')
  const [lastInput, setLastInput] = useState<KeyFeedback | null>(null)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [outcome, setOutcome] = useState<FinishOutcome | null>(null)

  const cursorRef = useRef(0)
  const correctRef = useRef(0)
  const wrongRef = useRef(0)
  const comboRef = useRef(0)
  const bestComboRef = useRef(0)
  const startedAtRef = useRef<number | null>(null)
  const statusRef = useRef<EngineStatus>('idle')
  const finishedRef = useRef(false)
  const optionsRef = useRef(options)

  useEffect(() => {
    optionsRef.current = options
  })

  const finishRun = useCallback((result: FinishOutcome) => {
    if (finishedRef.current) return
    finishedRef.current = true
    statusRef.current = 'finished'

    const current = optionsRef.current
    const startedAt = startedAtRef.current
    const now = Date.now()
    let finalElapsed = startedAt ? Math.max(250, now - startedAt) : 0
    if (result === 'timeout' && current.durationMs !== undefined) {
      finalElapsed = current.durationMs
    }

    const correct = correctRef.current
    const wrong = wrongRef.current
    const typed = cursorRef.current
    const wpm = finalElapsed > 0 ? (typed / 5) / (finalElapsed / 60000) : 0
    const accuracy = correct + wrong > 0 ? (correct / (correct + wrong)) * 100 : 100

    setStatus('finished')
    setElapsedMs(finalElapsed)
    setOutcome(result)
    current.onFinish(
      {
        wpm: Math.min(400, wpm),
        accuracy,
        elapsedMs: finalElapsed,
        correct,
        wrong,
        typed,
      },
      result,
    )
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (event.isComposing || event.key === 'Escape') return
      if (event.key.length !== 1) return
      if (statusRef.current === 'finished') return
      if (event.repeat) return

      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }

      event.preventDefault()

      const now = Date.now()
      if (statusRef.current === 'idle') {
        startedAtRef.current = now
        statusRef.current = 'running'
        setStatus('running')
      }

      const current = optionsRef.current
      const text = current.text
      const index = cursorRef.current
      const expected = text[index]
      const isCorrect = event.key === expected

      setLastInput({ char: event.key, ok: isCorrect, nonce: now })

      if (!isCorrect) {
        wrongRef.current += 1
        setWrongCount(wrongRef.current)
        comboRef.current = 0
        setCombo(0)
        playFeedback('miss', current.sound)

        if (current.maxWrong !== undefined && wrongRef.current > current.maxWrong) {
          finishRun('failed')
        }
        return
      }

      playFeedback('hit', current.sound)
      cursorRef.current = index + 1
      correctRef.current += 1
      comboRef.current += 1
      if (comboRef.current > bestComboRef.current) {
        bestComboRef.current = comboRef.current
        setBestCombo(comboRef.current)
      }

      setCursor(cursorRef.current)
      setCorrectCount(correctRef.current)
      setCombo(comboRef.current)

      if (cursorRef.current >= text.length) {
        finishRun('completed')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [finishRun])

  useEffect(() => {
    if (status !== 'running') return
    const interval = window.setInterval(() => {
      const startedAt = startedAtRef.current
      if (startedAt === null) return
      const value = Date.now() - startedAt
      setElapsedMs(value)
      if (options.durationMs !== undefined && value >= options.durationMs) {
        finishRun('timeout')
      }
    }, 100)

    return () => window.clearInterval(interval)
  }, [status, options.durationMs, finishRun])

  const totalKeystrokes = correctCount + wrongCount
  const accuracy = totalKeystrokes > 0 ? (correctCount / totalKeystrokes) * 100 : 100
  const liveWpm = cursor > 0 && elapsedMs > 0 ? (cursor / 5) / (elapsedMs / 60000) : 0
  const stats: TypingStats = {
    wpm: Math.min(400, liveWpm),
    accuracy,
    elapsedMs,
    correct: correctCount,
    wrong: wrongCount,
    typed: cursor,
  }

  const remainingMs = options.durationMs !== undefined ? Math.max(0, options.durationMs - elapsedMs) : null

  return {
    cursor,
    status,
    stats,
    lastInput,
    combo,
    bestCombo,
    elapsedMs,
    remainingMs,
    outcome,
  }
}
