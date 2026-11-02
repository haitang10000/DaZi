export type Finger =
  | 'pinky-l'
  | 'ring-l'
  | 'middle-l'
  | 'index-l'
  | 'thumb'
  | 'index-r'
  | 'middle-r'
  | 'ring-r'
  | 'pinky-r'

export interface FingerInfo {
  name: string
  short: string
  color: string
}

export const FINGER_INFO: Record<Finger, FingerInfo> = {
  'pinky-l': { name: '左小指', short: '小指', color: '#dd9a9a' },
  'ring-l': { name: '左无名指', short: '无名指', color: '#e0b16c' },
  'middle-l': { name: '左中指', short: '中指', color: '#87bda1' },
  'index-l': { name: '左食指', short: '食指', color: '#7fa4d3' },
  thumb: { name: '拇指', short: '拇指', color: '#b3a2d2' },
  'index-r': { name: '右食指', short: '食指', color: '#7fa4d3' },
  'middle-r': { name: '右中指', short: '中指', color: '#87bda1' },
  'ring-r': { name: '右无名指', short: '无名指', color: '#e0b16c' },
  'pinky-r': { name: '右小指', short: '小指', color: '#dd9a9a' },
}

export interface KeyDef {
  id: string
  base?: string
  shift?: string
  label: string
  width: number
  finger: Finger
  modifier?: boolean
  home?: boolean
  bump?: boolean
}

export const KEY_ROWS: KeyDef[][] = [
  [
    { id: 'Backquote', base: '`', shift: '~', label: '`', width: 1, finger: 'pinky-l' },
    { id: 'Digit1', base: '1', shift: '!', label: '1', width: 1, finger: 'pinky-l' },
    { id: 'Digit2', base: '2', shift: '@', label: '2', width: 1, finger: 'ring-l' },
    { id: 'Digit3', base: '3', shift: '#', label: '3', width: 1, finger: 'middle-l' },
    { id: 'Digit4', base: '4', shift: '$', label: '4', width: 1, finger: 'index-l' },
    { id: 'Digit5', base: '5', shift: '%', label: '5', width: 1, finger: 'index-l' },
    { id: 'Digit6', base: '6', shift: '^', label: '6', width: 1, finger: 'index-r' },
    { id: 'Digit7', base: '7', shift: '&', label: '7', width: 1, finger: 'index-r' },
    { id: 'Digit8', base: '8', shift: '*', label: '8', width: 1, finger: 'middle-r' },
    { id: 'Digit9', base: '9', shift: '(', label: '9', width: 1, finger: 'ring-r' },
    { id: 'Digit0', base: '0', shift: ')', label: '0', width: 1, finger: 'pinky-r' },
    { id: 'Minus', base: '-', shift: '_', label: '-', width: 1, finger: 'pinky-r' },
    { id: 'Equal', base: '=', shift: '+', label: '=', width: 1, finger: 'pinky-r' },
    { id: 'Backspace', label: 'Backspace', width: 2, finger: 'pinky-r', modifier: true },
  ],
  [
    { id: 'Tab', label: 'Tab', width: 1.5, finger: 'pinky-l', modifier: true },
    { id: 'KeyQ', base: 'q', shift: 'Q', label: 'Q', width: 1, finger: 'pinky-l' },
    { id: 'KeyW', base: 'w', shift: 'W', label: 'W', width: 1, finger: 'ring-l' },
    { id: 'KeyE', base: 'e', shift: 'E', label: 'E', width: 1, finger: 'middle-l' },
    { id: 'KeyR', base: 'r', shift: 'R', label: 'R', width: 1, finger: 'index-l' },
    { id: 'KeyT', base: 't', shift: 'T', label: 'T', width: 1, finger: 'index-l' },
    { id: 'KeyY', base: 'y', shift: 'Y', label: 'Y', width: 1, finger: 'index-r' },
    { id: 'KeyU', base: 'u', shift: 'U', label: 'U', width: 1, finger: 'index-r' },
    { id: 'KeyI', base: 'i', shift: 'I', label: 'I', width: 1, finger: 'middle-r' },
    { id: 'KeyO', base: 'o', shift: 'O', label: 'O', width: 1, finger: 'ring-r' },
    { id: 'KeyP', base: 'p', shift: 'P', label: 'P', width: 1, finger: 'pinky-r' },
    { id: 'BracketLeft', base: '[', shift: '{', label: '[', width: 1, finger: 'pinky-r' },
    { id: 'BracketRight', base: ']', shift: '}', label: ']', width: 1, finger: 'pinky-r' },
    { id: 'Backslash', base: '\\', shift: '|', label: '\\', width: 1.5, finger: 'pinky-r' },
  ],
  [
    { id: 'CapsLock', label: 'Caps', width: 1.75, finger: 'pinky-l', modifier: true },
    { id: 'KeyA', base: 'a', shift: 'A', label: 'A', width: 1, finger: 'pinky-l', home: true },
    { id: 'KeyS', base: 's', shift: 'S', label: 'S', width: 1, finger: 'ring-l', home: true },
    { id: 'KeyD', base: 'd', shift: 'D', label: 'D', width: 1, finger: 'middle-l', home: true },
    { id: 'KeyF', base: 'f', shift: 'F', label: 'F', width: 1, finger: 'index-l', home: true, bump: true },
    { id: 'KeyG', base: 'g', shift: 'G', label: 'G', width: 1, finger: 'index-l' },
    { id: 'KeyH', base: 'h', shift: 'H', label: 'H', width: 1, finger: 'index-r' },
    { id: 'KeyJ', base: 'j', shift: 'J', label: 'J', width: 1, finger: 'index-r', home: true, bump: true },
    { id: 'KeyK', base: 'k', shift: 'K', label: 'K', width: 1, finger: 'middle-r', home: true },
    { id: 'KeyL', base: 'l', shift: 'L', label: 'L', width: 1, finger: 'ring-r', home: true },
    { id: 'Semicolon', base: ';', shift: ':', label: ';', width: 1, finger: 'pinky-r', home: true },
    { id: 'Quote', base: "'", shift: '"', label: "'", width: 1, finger: 'pinky-r' },
    { id: 'Enter', label: 'Enter', width: 2.25, finger: 'pinky-r', modifier: true },
  ],
  [
    { id: 'ShiftLeft', label: 'Shift', width: 2.25, finger: 'pinky-l', modifier: true },
    { id: 'KeyZ', base: 'z', shift: 'Z', label: 'Z', width: 1, finger: 'pinky-l' },
    { id: 'KeyX', base: 'x', shift: 'X', label: 'X', width: 1, finger: 'ring-l' },
    { id: 'KeyC', base: 'c', shift: 'C', label: 'C', width: 1, finger: 'middle-l' },
    { id: 'KeyV', base: 'v', shift: 'V', label: 'V', width: 1, finger: 'index-l' },
    { id: 'KeyB', base: 'b', shift: 'B', label: 'B', width: 1, finger: 'index-l' },
    { id: 'KeyN', base: 'n', shift: 'N', label: 'N', width: 1, finger: 'index-r' },
    { id: 'KeyM', base: 'm', shift: 'M', label: 'M', width: 1, finger: 'index-r' },
    { id: 'Comma', base: ',', shift: '<', label: ',', width: 1, finger: 'middle-r' },
    { id: 'Period', base: '.', shift: '>', label: '.', width: 1, finger: 'ring-r' },
    { id: 'Slash', base: '/', shift: '?', label: '/', width: 1, finger: 'pinky-r' },
    { id: 'ShiftRight', label: 'Shift', width: 2.75, finger: 'pinky-r', modifier: true },
  ],
  [
    { id: 'ControlLeft', label: 'Ctrl', width: 1.25, finger: 'pinky-l', modifier: true },
    { id: 'MetaLeft', label: 'Win', width: 1.25, finger: 'thumb', modifier: true },
    { id: 'AltLeft', label: 'Alt', width: 1.25, finger: 'thumb', modifier: true },
    { id: 'Space', base: ' ', label: '空格', width: 7.5, finger: 'thumb' },
    { id: 'AltRight', label: 'Alt', width: 1.25, finger: 'thumb', modifier: true },
    { id: 'MetaRight', label: 'Win', width: 1.25, finger: 'thumb', modifier: true },
    { id: 'ControlRight', label: 'Ctrl', width: 1.25, finger: 'pinky-r', modifier: true },
  ],
]

const CHAR_MAP = new Map<string, { key: KeyDef; shift: boolean }>()

for (const row of KEY_ROWS) {
  for (const key of row) {
    if (key.base) CHAR_MAP.set(key.base, { key, shift: false })
    if (key.shift) CHAR_MAP.set(key.shift, { key, shift: true })
  }
}

export function resolveChar(char: string): { key: KeyDef; shift: boolean } | null {
  return CHAR_MAP.get(char) ?? null
}

export function oppositeShift(key: KeyDef): KeyDef | null {
  const shift = KEY_ROWS.flat().find((item) => item.id === (key.finger.endsWith('-l') ? 'ShiftRight' : 'ShiftLeft'))
  return shift ?? null
}

export function findKey(id: string): KeyDef | null {
  return KEY_ROWS.flat().find((key) => key.id === id) ?? null
}

export const FINGER_LEGEND = [
  { label: '小指', color: FINGER_INFO['pinky-l'].color },
  { label: '无名指', color: FINGER_INFO['ring-l'].color },
  { label: '中指', color: FINGER_INFO['middle-l'].color },
  { label: '食指', color: FINGER_INFO['index-l'].color },
  { label: '拇指', color: FINGER_INFO.thumb.color },
] as const
