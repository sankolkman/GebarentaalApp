import { LETTERS, WORDS } from './letters'
import { checkWord, emptyStats, loadStats, mulberry32, pickLetter, pickWord, question, record, saveStats } from './logic'

const ids = LETTERS.map((l) => l.id)

describe('letters and words', () => {
  it('has the 26 letters', () => {
    expect(ids.join('')).toBe('abcdefghijklmnopqrstuvwxyz')
  })
  it('words only use a–z', () => {
    for (const w of WORDS) expect(w).toMatch(/^[a-z]+$/)
  })
})

describe('question', () => {
  it('has 4 unique options including the answer', () => {
    for (let seed = 1; seed < 30; seed++) {
      const q = question('k', mulberry32(seed))
      expect(q.options).toContain('k')
      expect(new Set(q.options).size).toBe(4)
      expect(['sign-to-letter', 'letter-to-sign']).toContain(q.mode)
    }
  })
})

describe('pickLetter', () => {
  it('prefers letters that went wrong', () => {
    const stats = emptyStats()
    stats.q = { right: 0, wrong: 6 }
    const rng = mulberry32(3)
    const picks = Array.from({ length: 200 }, () => pickLetter(stats, rng))
    const q = picks.filter((p) => p === 'q').length
    expect(q).toBeGreaterThan(200 / 26 * 2)
  })
  it('never repeats the previous letter', () => {
    const rng = mulberry32(5)
    let prev = 'a'
    for (let i = 0; i < 100; i++) {
      const p = pickLetter(emptyStats(), rng, prev)
      expect(p).not.toBe(prev)
      prev = p
    }
  })
})

describe('record and storage', () => {
  it('counts right and wrong', () => {
    let s = emptyStats()
    s = record(s, 'a', true)
    s = record(s, 'a', false)
    expect(s.a).toEqual({ right: 1, wrong: 1 })
  })
  it('round-trips and survives garbage', () => {
    const m = new Map<string, string>()
    const storage = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) } as Storage
    const s = record(emptyStats(), 'b', true)
    saveStats(s, storage)
    expect(loadStats(storage).b).toEqual({ right: 1, wrong: 0 })
    m.set('gebaren-stats-v1', '{nope')
    expect(loadStats(storage)).toEqual(emptyStats())
  })
})

describe('words', () => {
  it('checkWord ignores case and spaces', () => {
    expect(checkWord(' Koffie ', 'koffie')).toBe(true)
    expect(checkWord('kofie', 'koffie')).toBe(false)
  })
  it('pickWord avoids the previous word', () => {
    const rng = mulberry32(9)
    let prev = WORDS[0]
    for (let i = 0; i < 50; i++) {
      const w = pickWord(rng, prev)
      expect(w).not.toBe(prev)
      prev = w
    }
  })
})
