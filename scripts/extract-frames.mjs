// Cuts a still (jpg) and a short clip (mp4) per letter from the Commons video
// "NGT handalfabet.webm" by Vera de Kok (CC BY-SA 4.0):
// https://commons.wikimedia.org/wiki/File:NGT_handalfabet.webm
//
// Usage: npm run frames -- <path/to/NGT_handalfabet.webm>
// Output: public/letters/<x>.jpg and public/clips/<x>.mp4
//
// Changes made: frames are cropped to remove the printed letter on the left
// (so it doesn't give away quiz answers) and scaled down.

import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ffmpeg from 'ffmpeg-static'

/** letter: [still time, clip start, clip end] in seconds, read from a 2 fps contact sheet */
const LETTERS = {
  a: [0.3, 0, 1],
  b: [1.3, 1, 2],
  c: [2.6, 2, 3],
  d: [3.6, 3, 4.5],
  e: [5.3, 5, 6],
  f: [6.5, 6, 7],
  g: [7.2, 7, 8],
  h: [8.8, 8.5, 9.5],
  i: [10.3, 10, 11],
  j: [11.5, 11, 12],
  k: [12.5, 12, 14],
  l: [15.0, 14.5, 15.5],
  m: [15.8, 15.5, 16.5],
  n: [17.0, 16.5, 18],
  o: [18.3, 18, 19],
  p: [20.3, 20, 21],
  q: [22.5, 22, 23.5],
  r: [25.5, 24.5, 27],
  s: [27.5, 27, 28.5],
  t: [28.8, 28.5, 29.5],
  u: [30.0, 29.5, 30.5],
  v: [31.3, 31, 32],
  w: [32.3, 32, 33],
  x: [33.3, 33, 34],
  y: [35.0, 34.5, 35.5],
  z: [36.0, 35.5, 37],
}

// source is 1280x720; the printed letter sits at x < 320
const CROP = 'crop=940:720:340:0,scale=480:-2'

const src = process.argv[2]
if (!src) {
  console.error('Usage: npm run frames -- <NGT_handalfabet.webm>')
  process.exit(1)
}
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
mkdirSync(resolve(root, 'public/letters'), { recursive: true })
mkdirSync(resolve(root, 'public/clips'), { recursive: true })

const run = (args) => execFileSync(ffmpeg, ['-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })

for (const [letter, [still, start, end]] of Object.entries(LETTERS)) {
  run(['-ss', String(still), '-i', src, '-frames:v', '1', '-vf', CROP, '-q:v', '4', resolve(root, `public/letters/${letter}.jpg`)])
  run([
    '-ss', String(start), '-to', String(end), '-i', src, '-an', '-vf', CROP,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '28', '-movflags', '+faststart',
    resolve(root, `public/clips/${letter}.mp4`),
  ])
  process.stdout.write(letter)
}
console.log('\ndone')
