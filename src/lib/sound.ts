let context: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') return null
  if (!context) context = new AudioContext()
  if (context.state === 'suspended') void context.resume()
  return context
}

function playTone(
  audio: AudioContext,
  frequency: number,
  startOffset: number,
  duration: number,
  type: OscillatorType,
  volume: number,
) {
  const oscillator = audio.createOscillator()
  const gain = audio.createGain()
  const start = audio.currentTime + startOffset

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  oscillator.connect(gain)
  gain.connect(audio.destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.02)
}

export function playFeedback(kind: 'hit' | 'miss' | 'finish', enabled: boolean): void {
  if (!enabled) return
  try {
    const audio = getContext()
    if (!audio) return

    if (kind === 'hit') {
      playTone(audio, 660, 0, 0.035, 'sine', 0.018)
    } else if (kind === 'miss') {
      playTone(audio, 165, 0, 0.09, 'triangle', 0.035)
    } else {
      playTone(audio, 523.25, 0, 0.16, 'sine', 0.03)
      playTone(audio, 659.25, 0.09, 0.18, 'sine', 0.028)
      playTone(audio, 783.99, 0.18, 0.24, 'sine', 0.025)
    }
  } catch {
    // Audio is a nice-to-have; a blocked context must never break practice.
  }
}
