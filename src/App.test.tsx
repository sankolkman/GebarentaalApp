import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

beforeEach(() => localStorage.clear())

describe('App', () => {
  it('shows all 26 letters in the alphabet and opens one', async () => {
    const user = userEvent.setup()
    render(<App seed={1} />)
    const cells = document.querySelectorAll('.grid .cell')
    expect(cells).toHaveLength(26)
    await user.click(cells[1] as HTMLElement)
    expect(screen.getByRole('dialog', { name: 'Letter B' })).toBeInTheDocument()
  })

  it('recognise: a correct answer gives feedback and is remembered', async () => {
    const user = userEvent.setup()
    render(<App seed={2} />)
    await user.click(screen.getByRole('button', { name: 'Herkennen' }))
    const answer = (document.querySelector('[data-letter]') as HTMLElement).dataset.letter!
    const signToLetter = screen.queryByRole('heading', { name: 'Welke letter is dit?' })
    if (signToLetter) {
      await user.click(screen.getByRole('button', { name: answer.toUpperCase() }))
    } else {
      const options = Array.from(document.querySelectorAll('.sign-option')) as HTMLElement[]
      const right = options.find((o) => o.querySelector(`[data-letter="${answer}"]`))!
      await user.click(right)
    }
    expect(screen.getByRole('status')).toHaveTextContent('Goed!')
    expect(JSON.parse(localStorage.getItem('gebaren-stats-v1')!)[answer]).toEqual({ right: 1, wrong: 0 })
  })

  it('spell: typing the shown word is correct', async () => {
    const user = userEvent.setup()
    render(<App seed={3} />)
    await user.click(screen.getByRole('button', { name: 'Spellen' }))
    const word = Array.from(document.querySelectorAll('.word-row [data-letter]'))
      .map((el) => (el as HTMLElement).dataset.letter)
      .join('')
    await user.type(screen.getByRole('textbox', { name: 'Het woord' }), word.toUpperCase())
    await user.click(screen.getByRole('button', { name: 'Controleer' }))
    expect(screen.getByRole('status')).toHaveTextContent(`Goed! Er staat "${word}".`)
  })

  it('spell: reveal shows the word without saying it was right', async () => {
    const user = userEvent.setup()
    render(<App seed={4} />)
    await user.click(screen.getByRole('button', { name: 'Spellen' }))
    await user.type(screen.getByRole('textbox', { name: 'Het woord' }), 'xxx')
    await user.click(screen.getByRole('button', { name: 'Controleer' }))
    await user.click(screen.getByRole('button', { name: 'Laat het woord zien' }))
    expect(screen.getByRole('status')).toHaveTextContent('Er stond:')
    expect(screen.getByRole('status')).not.toHaveTextContent('Goed!')
  })
})
