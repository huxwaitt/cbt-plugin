// Transcripts play as CSS animations. This script only works out when each
// line starts, splits replies into words so they can stream, and toggles the
// class that runs the animation.
const WORD_MS = 42

function schedule(chat) {
  let t = 250
  for (const line of chat.querySelectorAll('.line')) {
    const say = line.querySelector('.line__say')
    line.style.setProperty('--t', String(Math.round(t)))
    const words = say.textContent.trim().split(/\s+/)
    if (say.hasAttribute('data-stream')) {
      say.textContent = ''
      words.forEach((word, i) => {
        const span = document.createElement('span')
        span.className = 'w'
        span.style.setProperty('--w', String(i))
        span.textContent = word
        say.append(span, ' ')
      })
      t += 300 + words.length * WORD_MS + 800
    } else if (line.classList.contains('line--tool')) t += 700
    else if (line.classList.contains('line--plugin')) t += 1500
    else t += 600 + Math.min(1500, words.length * 80)
  }
}

function play(chat) {
  chat.classList.remove('is-playing')
  void chat.offsetWidth // restart the animations
  chat.classList.add('is-playing')
}

export function initChats() {
  const chats = [...document.querySelectorAll('.chat')]
  if (!chats.length) return
  chats.forEach(schedule)
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
  chats.forEach(chat => seen.observe(chat))

  for (const button of document.querySelectorAll('[data-replay]'))
    button.addEventListener('click', () => play(button.closest('.chat')))
  for (const root of document.querySelectorAll('[data-switch]'))
    root.addEventListener('switch', event => {
      const chat = event.detail.panel.querySelector('.chat')
      if (chat && chat.classList.contains('is-playing')) play(chat)
    })
}
