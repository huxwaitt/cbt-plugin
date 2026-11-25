// Sample sessions play as CSS animations. This script works out when each row
// starts, copies what the person says into the prompt so it can be typed there,
// splits replies into words so they can stream, and toggles the class that runs
// it all. Times are passed to the stylesheet as custom properties.
const TYPE_MS = 26 // per character at the prompt
const WORD_MS = 38 // per word of a reply; the stylesheet uses the same step
const THINK_MS = 600

const set = (node, name, value) => node.style.setProperty(name, String(Math.round(value)))
const span = (className, text) => {
  const node = document.createElement('span')
  node.className = className
  if (text) node.textContent = text
  return node
}

// The person's line, typed character by character, with the caret riding on
// the newest character until the line is sent.
function typed(text, start, step, hold) {
  const node = span('typed')
  set(node, '--t', start)
  set(node, '--k', step)
  set(node, '--d', text.length * step + hold)
  ;[...text].forEach((char, i) => {
    const c = span('c', char)
    set(c, '--c', i)
    if (i === text.length - 1) set(c, '--h', step + hold)
    node.append(c)
  })
  return node
}

function thinking(start) {
  const node = span('think')
  node.setAttribute('aria-hidden', 'true')
  node.append(Object.assign(document.createElement('i'), { textContent: '*' }), 'Thinking…')
  set(node, '--t', start)
  set(node, '--d', THINK_MS)
  return node
}

function schedule(term) {
  const rows = [...term.querySelectorAll('.tl')]
  const input = term.querySelector('.term__in')
  let t = 300
  let waiting = false // the person has spoken and the model has not answered yet
  for (const row of rows) {
    const body = row.querySelector('p')
    if (row.classList.contains('tl--you')) {
      const text = body.textContent.trim()
      const step = Math.max(14, Math.min(TYPE_MS, 1100 / text.length))
      const hold = 260
      input?.append(typed(text, t, step, hold))
      t += text.length * step + hold
      set(row, '--t', t)
      t += 160
      waiting = true
    } else if (row.classList.contains('tl--out')) {
      set(row, '--t', t)
      t += 420
    } else {
      if (waiting) {
        row.append(thinking(t))
        t += THINK_MS
        waiting = false
      }
      set(row, '--t', t)
      if (body.hasAttribute('data-stream')) {
        const words = body.textContent.trim().split(/\s+/)
        body.textContent = ''
        words.forEach((word, i) => {
          const w = span('w', word)
          set(w, '--w', i)
          body.append(w, ' ')
        })
        t += words.length * WORD_MS + 400 + Math.min(900, words.length * 45)
      } else t += 760
    }
  }
  // The status line is the plugin's; in a first session it appears with the command.
  const status = term.querySelector('.term__status')
  if (status) set(status, '--t', rows[0]?.classList.contains('tl--cmd') ? rows[0].style.getPropertyValue('--t') : 0)
}

function play(term) {
  term.classList.remove('is-playing')
  void term.offsetWidth // restart the animations
  term.classList.add('is-playing')
}

export function initChats() {
  const terms = [...document.querySelectorAll('.term')]
  if (!terms.length) return
  terms.forEach(schedule)
  document.documentElement.classList.add('js-chat')

  const seen = new IntersectionObserver(
    entries => {
      for (const entry of entries)
        if (entry.isIntersecting) {
          play(entry.target)
          seen.unobserve(entry.target)
        }
    },
    { threshold: 0.3 },
  )
  terms.forEach(term => seen.observe(term))

  for (const button of document.querySelectorAll('[data-replay]'))
    button.addEventListener('click', () => play(button.closest('.term')))
  for (const root of document.querySelectorAll('[data-switch]'))
    root.addEventListener('switch', event => {
      const term = event.detail.panel.querySelector('.term')
      if (term && term.classList.contains('is-playing')) play(term)
    })
}
