import { LETTERS, WORDS } from './letters'

export type Stats = Record<string, { right: number; wrong: number }>

export interface Question {
  answer: string
  /** sign-to-letter: see a hand, choose the letter; letter-to-sign: see a letter, choose the hand */
  mode: 'sign-to-letter' | 'letter-to-sign'
  options: string[]
}

const KEY = 'gebaren-stats-v1'

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function emptyStats(): Stats {
  return Object.fromEntries(LETTERS.map((l) => [l.id, { right: 0, wrong: 0 }]))
}

export function record(s: Stats, letter: string, right: boolean): Stats {
  const cur = s[letter] ?? { right: 0, wrong: 0 }
  return { ...s, [letter]: { right: cur.right + (right ? 1 : 0), wrong: cur.wrong + (right ? 0 : 1) } }
}

/** weighted random letter: unseen and often-wrong letters come up more */
export function pickLetter(s: Stats, rng: () => number, previous?: string): string {
  const weights = LETTERS.map((l) => {
    if (l.id === previous) return 0
    const { right, wrong } = s[l.id] ?? { right: 0, wrong: 0 }
    return 1 + wrong * 2 + (right + wrong === 0 ? 1 : 0) - Math.min(right, 4) * 0.15
  })
  let r = rng() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < LETTERS.length; i++) {
    r -= weights[i]
    if (r <= 0 && weights[i] > 0) return LETTERS[i].id
  }
  return LETTERS.find((l) => l.id !== previous)!.id
}

export function question(answer: string, rng: () => number): Question {
  const others = shuffle(
    LETTERS.map((l) => l.id).filter((id) => id !== answer),
    rng,
  ).slice(0, 3)
  return {
    answer,
    mode: rng() < 0.5 ? 'sign-to-letter' : 'letter-to-sign',
    options: shuffle([answer, ...others], rng),
  }
}

export function pickWord(rng: () => number, previous?: string): string {
  const pool = WORDS.filter((w) => w !== previous)
  return pool[Math.floor(rng() * pool.length)]
}

export function checkWord(input: string, word: string): boolean {
  return input.trim().toLowerCase().replace(/\s+/g, '') === word
}

export function loadStats(storage: Storage | undefined = safeStorage()): Stats {
  try {
    const raw = storage?.getItem(KEY)
    if (!raw) return emptyStats()
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return emptyStats()
    return { ...emptyStats(), ...parsed }
  } catch {
    return emptyStats()
  }
}

export function saveStats(s: Stats, storage: Storage | undefined = safeStorage()): void {
  try {
    storage?.setItem(KEY, JSON.stringify(s))
  } catch {
    /* ignore: progress stays in memory */
  }
}

function safeStorage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}
