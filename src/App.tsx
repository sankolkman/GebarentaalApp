import { useEffect, useRef, useState } from 'react'
import { ATTRIBUTION, LETTERS, letterById, SOURCE_URL } from './letters'
import { checkWord, loadStats, mulberry32, pickLetter, pickWord, question, record, saveStats, type Question, type Stats } from './logic'

type Tab = 'alfabet' | 'herkennen' | 'spellen'

export default function App({ seed = Date.now() }: { seed?: number }) {
  const [tab, setTab] = useState<Tab>('alfabet')
  const [stats, setStats] = useState<Stats>(() => loadStats())
  const rng = useRef(mulberry32(seed)).current
  const onAnswer = (letter: string, right: boolean) =>
    setStats((s) => {
      const next = record(s, letter, right)
      saveStats(next)
      return next
    })

  return (
    <div className="app">
      <header className="top">
        <h1>🤟 Vingeralfabet</h1>
        <p className="muted">Nederlandse Gebarentaal (NGT)</p>
        <nav className="tabs" aria-label="Onderdelen">
          {(['alfabet', 'herkennen', 'spellen'] as Tab[]).map((t) => (
            <button key={t} className={tab === t ? 'on' : ''} aria-pressed={tab === t} onClick={() => setTab(t)}>
              {t === 'alfabet' ? 'Alfabet' : t === 'herkennen' ? 'Herkennen' : 'Spellen'}
            </button>
          ))}
        </nav>
      </header>
      <main>
        {tab === 'alfabet' && <Alphabet stats={stats} />}
        {tab === 'herkennen' && <Recognise stats={stats} rng={rng} onAnswer={onAnswer} />}
        {tab === 'spellen' && <Spell rng={rng} />}
      </main>
      <footer className="attribution">
        {ATTRIBUTION}{' '}
        <a href={SOURCE_URL} target="_blank" rel="noreferrer">
          Bron
        </a>
      </footer>
    </div>
  )
}

/** photo of a handshape, with a button to play the short video clip */
function Sign({ letter, size = 'big', label }: { letter: string; size?: 'big' | 'small'; label: string }) {
  const l = letterById(letter)!
  const [playing, setPlaying] = useState(l.moves && size === 'big')
  useEffect(() => setPlaying(l.moves && size === 'big'), [l, size])
  return (
    <figure className={`sign ${size}`} data-letter={letter}>
      {playing ? (
        <video src={l.clip} poster={l.image} autoPlay loop muted playsInline aria-label={label} />
      ) : (
        <img src={l.image} alt={label} />
      )}
      {size === 'big' && (
        <button className="mini" onClick={() => setPlaying((p) => !p)}>
          {playing ? '⏸ Foto' : '▶ Beweging'}
        </button>
      )}
      {l.moves && size === 'big' && <span className="badge">beweegt</span>}
    </figure>
  )
}

function Alphabet({ stats }: { stats: Stats }) {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <section>
      <p className="muted">Tik op een letter om de handvorm te zien. Bij J en Z beweegt de hand.</p>
      <div className="grid">
        {LETTERS.map((l) => {
          const s = stats[l.id]
          const known = s && s.right > 0 && s.right >= s.wrong * 2
          return (
            <button key={l.id} className={`cell ${known ? 'known' : ''}`} onClick={() => setOpen(l.id)}>
              <img src={l.image} alt="" />
              <span>{l.id.toUpperCase()}</span>
            </button>
          )
        })}
      </div>
      {open && (
        <div className="sheet" role="dialog" aria-label={`Letter ${open.toUpperCase()}`}>
          <div className="sheet-inner">
            <h2 className="big-letter">{open.toUpperCase()}</h2>
            <Sign letter={open} label={`Handvorm voor de letter ${open.toUpperCase()}`} />
            <button className="btn" onClick={() => setOpen(null)}>
              Sluiten
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function Recognise({ stats, rng, onAnswer }: { stats: Stats; rng: () => number; onAnswer(l: string, right: boolean): void }) {
  const [q, setQ] = useState<Question>(() => question(pickLetter(stats, rng), rng))
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState({ right: 0, total: 0 })

  const choose = (opt: string) => {
    if (picked) return
    setPicked(opt)
    const right = opt === q.answer
    onAnswer(q.answer, right)
    setScore((s) => ({ right: s.right + (right ? 1 : 0), total: s.total + 1 }))
  }
  const next = () => {
    setQ(question(pickLetter(stats, rng, q.answer), rng))
    setPicked(null)
  }
  const cls = (opt: string) => (!picked ? '' : opt === q.answer ? 'right' : opt === picked ? 'wrong' : '')

  return (
    <section>
      <p className="muted">
        Score deze sessie: {score.right} / {score.total}
      </p>
      {q.mode === 'sign-to-letter' ? (
        <>
          <h2>Welke letter is dit?</h2>
          <Sign letter={q.answer} label="Welke letter is deze handvorm?" />
          <div className="options letters">
            {q.options.map((o) => (
              <button key={o} className={`btn option ${cls(o)}`} onClick={() => choose(o)} disabled={!!picked}>
                {o.toUpperCase()}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <h2>
            Welke handvorm is de <span className="big-letter inline">{q.answer.toUpperCase()}</span>?
          </h2>
          <div className="options signs">
            {q.options.map((o, i) => (
              <button
                key={o}
                className={`option sign-option ${cls(o)}`}
                onClick={() => choose(o)}
                disabled={!!picked}
                aria-label={`Handvorm ${i + 1}`}
              >
                <Sign letter={o} size="small" label={`Handvorm ${i + 1}`} />
              </button>
            ))}
          </div>
        </>
      )}
      {picked && (
        <div className={`feedback ${picked === q.answer ? 'good' : 'bad'}`} role="status">
          <strong>{picked === q.answer ? 'Goed!' : `Helaas, dit is de ${q.answer.toUpperCase()}.`}</strong>
          <button className="btn primary" onClick={next} autoFocus>
            Volgende
          </button>
        </div>
      )}
    </section>
  )
}

function Spell({ rng }: { rng: () => number }) {
  const [word, setWord] = useState(() => pickWord(rng))
  const [input, setInput] = useState('')
  const [result, setResult] = useState<boolean | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [step, setStep] = useState<number | null>(null)

  useEffect(() => {
    if (step === null) return
    if (step >= word.length) {
      const t = setTimeout(() => setStep(null), 800)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setStep(step + 1), 1100)
    return () => clearTimeout(t)
  }, [step, word])

  const next = () => {
    setWord(pickWord(rng, word))
    setInput('')
    setResult(null)
    setRevealed(false)
    setStep(null)
  }

  return (
    <section>
      <h2>Welk woord wordt hier gespeld?</h2>
      <p className="muted">Lees de handvormen van links naar rechts, of speel ze één voor één af.</p>
      {step !== null && step < word.length ? (
        <div className="flash">
          <Sign letter={word[step]} size="small" label={`Letter ${step + 1} van ${word.length}`} />
          <p className="muted">
            {step + 1} / {word.length}
          </p>
        </div>
      ) : (
        <div className="word-row">
          {word.split('').map((ch, i) => (
            <Sign key={i} letter={ch} size="small" label={`Letter ${i + 1} van ${word.length}`} />
          ))}
        </div>
      )}
      <button className="btn" onClick={() => setStep(0)} disabled={step !== null}>
        ▶ Eén voor één afspelen
      </button>
      <form
        className="answer"
        onSubmit={(e) => {
          e.preventDefault()
          if (input.trim()) setResult(checkWord(input, word))
        }}
      >
        <input
          aria-label="Het woord"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setResult(null)
          }}
          placeholder="Typ het woord"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          readOnly={result === true || revealed}
        />
        {result !== true && !revealed && (
          <button className="btn primary" type="submit" disabled={!input.trim()}>
            Controleer
          </button>
        )}
      </form>
      {(result !== null || revealed) && (
        <div className={`feedback ${result ? 'good' : 'bad'}`} role="status">
          <strong>
            {result ? `Goed! Er staat "${word}".` : revealed ? `Er stond: "${word}".` : 'Nog niet goed, kijk nog eens.'}
          </strong>
          {result || revealed ? (
            <button className="btn primary" onClick={next} autoFocus>
              Volgend woord
            </button>
          ) : (
            <button className="btn" onClick={() => setRevealed(true)}>
              Laat het woord zien
            </button>
          )}
        </div>
      )}
    </section>
  )
}
