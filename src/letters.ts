export interface Letter {
  /** lowercase a–z */
  id: string
  image: string
  clip: string
  /** the handshape moves (watch the clip, not just the photo) */
  moves: boolean
}

const MOVING = new Set(['j', 'z'])

export const LETTERS: Letter[] = 'abcdefghijklmnopqrstuvwxyz'.split('').map((id) => ({
  id,
  image: `./letters/${id}.jpg`,
  clip: `./clips/${id}.mp4`,
  moves: MOVING.has(id),
}))

export const letterById = (id: string) => LETTERS.find((l) => l.id === id)

/** short Dutch words and names to spell, roughly from easy to harder */
export const WORDS = [
  'ja', 'nee', 'hoi', 'kat', 'hond', 'mama', 'papa', 'oma', 'opa', 'huis',
  'boek', 'fiets', 'thee', 'brood', 'water', 'zon', 'regen', 'school', 'werk', 'auto',
  'anna', 'piet', 'jan', 'lisa', 'tom', 'emma', 'daan', 'sara', 'bram', 'noor',
  'koffie', 'vrienden', 'gebaren', 'welkom', 'dank', 'sorry', 'graag', 'mooi', 'vrij', 'quiz',
]

export const ATTRIBUTION =
  'Handvormen: video "NGT handalfabet" door Vera de Kok, CC BY-SA 4.0, via Wikimedia Commons. ' +
  'Bijgesneden en in losse beelden en fragmenten geknipt.'
export const SOURCE_URL = 'https://commons.wikimedia.org/wiki/File:NGT_handalfabet.webm'
