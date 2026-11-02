import type { Challenge } from '../types'

export const CHALLENGES: Challenge[] = [
  {
    id: 'home-30',
    name: '基准键冲刺',
    badge: '基础',
    durationSec: 30,
    pool: 'home',
    description: '只用基准键，30 秒内尽量多、尽量准地敲出字符。',
    rules: ['仅使用 A S D F G H J K L 与空格', '时间结束时自动结算', '成绩计入本地积分榜'],
  },
  {
    id: 'sprint-60',
    name: '60 秒竞速',
    badge: '速度',
    durationSec: 60,
    pool: 'words',
    description: '常用词连续输入，比速度，更比准确率。',
    rules: ['常用词随机排列', '计时从第一次按键开始', '速度相同按准确率排名'],
  },
  {
    id: 'flawless-45',
    name: '无失误 45 秒',
    badge: '稳定',
    durationSec: 45,
    maxWrong: 3,
    pool: 'words',
    description: '最多允许 3 次失误，稳定输出才算赢。',
    rules: ['出现第 4 次失误立即结束', '结束时成绩有效', '失误不进入积分榜'],
  },
]

export const CHALLENGE_BY_ID = new Map(CHALLENGES.map((challenge) => [challenge.id, challenge]))

const HOME_WORDS = [
  'as', 'ask', 'dad', 'fad', 'sad', 'lad', 'lass', 'fall', 'hall', 'half',
  'flag', 'glad', 'glass', 'salad', 'flask', 'gash', 'hash', 'dash', 'flash',
  'all', 'add', 'had', 'has', 'gas', 'jag', 'saga', 'gala', 'alas', 'shall',
  'ah', 'aha', 'ash', 'asks', 'fads', 'flags', 'glads', 'shad', 'slag', 'gaff',
]

const COMMON_WORDS = [
  'the', 'and', 'you', 'for', 'that', 'with', 'have', 'this', 'from', 'they',
  'will', 'say', 'her', 'she', 'our', 'when', 'make', 'like', 'time', 'just',
  'know', 'take', 'into', 'your', 'some', 'them', 'then', 'look', 'only',
  'come', 'over', 'also', 'back', 'after', 'work', 'first', 'well', 'year',
  'give', 'most', 'very', 'want', 'good', 'much', 'need', 'help', 'here',
  'move', 'kind', 'hand', 'high', 'keep', 'last', 'long', 'little', 'own',
  'under', 'while', 'again', 'place', 'group', 'problem', 'though', 'light',
  'around', 'people', 'world', 'still', 'between', 'through', 'because',
  'before', 'young', 'number', 'system', 'better', 'sound', 'every', 'great',
  'small', 'think', 'three', 'house', 'large', 'never', 'other', 'right',
]

function mulberry32(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value = (value + 0x6d2b79f5) >>> 0
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function buildChallengeText(challenge: Challenge, seed = Date.now()): string {
  const words = challenge.pool === 'home' ? HOME_WORDS : COMMON_WORDS
  const random = mulberry32(seed)
  const target = 900
  const parts: string[] = []
  let length = 0
  let previous = ''

  while (length < target) {
    const word = words[Math.floor(random() * words.length)]
    if (word === previous) continue
    parts.push(word)
    length += word.length + 1
    previous = word
  }

  return parts.join(' ')
}
