// The map instrument: a sample session on the left, the knowledge base in the
// middle, and an inspector on the right that says exactly what each lit point is.
import session from '../../data/session.json'
import { card } from './inspector.js'

const HOW = {
  context: 'In context',
  routed: 'Routed to',
  read: 'Read',
  armed: 'Standing by',
  tagged: 'Tagged',
  linked: 'Linked',
  recordRead: 'Read',
  written: 'Written',
}
const GROUPS = [
  ['protocol', 'Session protocol'],
  ['router', 'Router'],
  ['pages', 'Reference pages'],
  ['vocab', 'Vocabulary'],
  ['record', 'Your record'],
]
const WHO = { person: 'You', guide: 'Claude', plugin: 'Output' }
const ROW = { person: 'you', guide: 'say', plugin: 'out' }

const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value === null || value === undefined) continue
    if (key === 'class') node.className = value
    else if (key === 'text') node.textContent = value
    else node.setAttribute(key, value === true ? '' : value)
  }
  node.append(...children.flat(Infinity).filter(c => c !== null && c !== undefined && c !== false))
  return node
}

export async function initMap(root) {
  const stepsEl = root.querySelector('[data-steps]')
  const turnEl = root.querySelector('[data-turn]')
  const stage = root.querySelector('[data-stage]')
  const canvas = root.querySelector('canvas')
  const labels = root.querySelector('[data-labels]')
  const still = root.querySelector('[data-still]')
  const inspect = root.querySelector('[data-inspect]')
  const inspectTitle = root.querySelector('[data-inspect-title]')
  const back = root.querySelector('[data-inspect-back]')
  const playButton = root.querySelector('[data-map-play]')
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

  const [{ default: core }, sceneModule] = await Promise.all([
    import('../../data/kb-core.json'),
    import('./scene.js').catch(() => null),
  ])
  let detail = null
  import('../../data/kb-detail.json').then(m => {
    detail = m.default
    if (shown) show(shown.id, shown.pinned)
  })

  const data = {
    core,
    session,
    pages: new Map(core.pages.map(p => [p.id, p])),
    concepts: new Map(core.concepts.map(c => [c.id, c])),
    models: new Map(core.models.map(m => [m.id, m])),
    domains: new Map(core.domains.map(d => [d.id, d])),
    protocol: new Map(core.protocol.map(p => [p.id, p])),
    schemes: new Map(core.schemes.map(s => [s.p, s])),
    sources: new Map(core.sources.map(([key, kind]) => [`src:${key}`, { key, kind }])),
    record: new Map(session.record.map(r => [r.id, r])),
    get detail() {
      return detail
    },
  }

  // ---------------------------------------------------------------- labels
  const c = core.counts
  const layerText = {
    turn: ['This turn', 'what was just said'],
    protocol: ['Session protocol', `${core.protocol.length} sections, in context all session`],
    router: ['Router', `${c.domains} domains`],
    pages: ['Reference pages', `${c.pages} pages, ${c.pitfalls} pitfalls`],
    vocab: ['Vocabulary', `${c.concepts} concepts, ${c.models} models`],
    sources: ['Sources', `${c.sources.toLocaleString('en-US')} cited works`],
    record: ['Your record', 'files on your computer'],
  }
  for (const [key, [name, note]] of Object.entries(layerText))
    labels.append(
      el('div', { class: `layer-label layer-label--${key}`, 'data-layer': key }, el('b', { text: name }), el('span', { text: note })),
    )
  labels.append(el('div', { class: 'node-label', 'data-node-label': true, hidden: true }))

  // ---------------------------------------------------------------- scene
  let scene = null
  let current = 0
  let shown = null // { id, pinned } while a card is open
  if (sceneModule) {
    try {
      scene = sceneModule.createScene({
        canvas,
        labels,
        core,
        session,
        onHover: id => {
          if (shown?.pinned) return
          if (id) show(id, false)
          else list()
        },
        onPick: id => show(id, true),
      })
    } catch {
      scene = null
    }
  }
  if (!scene) {
    canvas.hidden = true
    labels.hidden = true
    stage.querySelector('.map__legend').hidden = true
    still.hidden = false
  }

  // ---------------------------------------------------------------- inspector
  const activation = id => session.steps[current].activates.filter(a => a.id === id)

  function list() {
    shown = null
    back.hidden = true
    inspectTitle.textContent = 'Used this turn'
    const step = session.steps[current]
    const groups = GROUPS.map(([layer, name]) => {
      const items = step.activates.filter(a => a.layer === layer)
      if (!items.length) return null
      return el(
        'div',
        { class: 'hits__group' },
        el('div', { class: 'hits__name' }, name, el('span', { text: String(items.length) })),
        items.map(a => {
          const amber = layer === 'record'
          const button = el(
            'button',
            { class: `hit${amber ? ' hit--amber' : ''}${a.how === 'armed' ? ' hit--armed' : ''}`, type: 'button', 'data-id': a.id },
            el('span', { class: 'hit__how', text: HOW[a.how] }),
            el('span', { class: 'hit__what' }, nameOf(a.id).map((text, k) => el('span', { class: k ? 'hit__id' : 'hit__name', text }))),
          )
          button.addEventListener('click', () => show(a.id, true))
          button.addEventListener('pointerenter', () => scene?.highlight(a.id))
          button.addEventListener('pointerleave', () => scene?.highlight(null))
          button.addEventListener('focus', () => scene?.highlight(a.id))
          button.addEventListener('blur', () => scene?.highlight(null))
          return button
        }),
      )
    })
    inspect.replaceChildren(el('div', { class: 'hits' }, groups))
    inspect.scrollTop = 0
  }

  // A plain name first, then the id or path the plugin itself uses.
  function nameOf(id) {
    if (data.record.has(id)) return [data.record.get(id).file]
    if (data.protocol.has(id)) return [data.protocol.get(id).t, 'protocol.md']
    const name = data.pages.get(id)?.t ?? data.concepts.get(id)?.l ?? data.models.get(id)?.l ?? data.domains.get(id)?.l
    return name ? [name, id] : [id]
  }

  function show(id, pinned) {
    shown = { id, pinned }
    back.hidden = !pinned
    inspectTitle.textContent = pinned ? 'Pinned' : 'Under the pointer'
    inspect.replaceChildren(card(id, { data, step: session.steps[current], activation: activation(id) }))
    inspect.scrollTop = 0
    if (pinned) scene?.highlight(id)
  }
  back.addEventListener('click', () => {
    scene?.highlight(null)
    list()
  })

  // ---------------------------------------------------------------- turns
  session.steps.forEach((step, i) => {
    const button = el(
      'button',
      { class: 'step', type: 'button' },
      el('span', { class: 'step__n', text: String(i + 1) }),
      step.label,
    )
    button.addEventListener('click', () => {
      stop()
      go(i)
    })
    stepsEl.append(el('li', {}, button))
  })

  function go(i, animate = true) {
    current = i
    const step = session.steps[i]
    ;[...stepsEl.querySelectorAll('.step')].forEach((button, k) => {
      if (k === i) button.setAttribute('aria-current', 'step')
      else button.removeAttribute('aria-current')
    })
    const log = el(
      'ol',
      { class: 'turn__log' },
      step.turns.map(turn =>
        el(
          'li',
          { class: `tl tl--${ROW[turn.who]}` },
          el('span', { class: 'visually-hidden', text: `${WHO[turn.who]}: ` }),
          el('p', { class: turn.who === 'plugin' ? 'tl__res' : 'tl__b', text: turn.text }),
        ),
      ),
    )
    const calls = el(
      'div',
      { class: 'calls' },
      el('p', { class: 'calls__head', text: step.calls.length === 1 ? 'One call behind it' : `${step.calls.length} calls behind it` }),
      step.calls.map((call, k) => {
        const button = el(
          'button',
          { class: 'call', type: 'button' },
          el('span', { text: call.tool }),
          el('span', { class: 'call__arg', text: call.args.replace(/\s+/g, ' ') }),
        )
        // A call opens the first thing it touched.
        const touched = step.activates.find(a => a.call === k)
        button.addEventListener('click', () => touched && show(touched.id, true))
        return button
      }),
    )
    turnEl.replaceChildren(el('h3', { text: step.title }), log, calls)
    turnEl.scrollTop = 0
    scene?.setStep(i, { animate })
    list()
  }

  // ---------------------------------------------------------------- playing
  let timer = null
  let visible = false
  let held = false // pointer or focus is inside the instrument
  const label = () => {
    playButton.textContent = timer ? 'Pause' : current === session.steps.length - 1 ? 'Play again' : 'Play the session'
  }
  function tick() {
    if (current >= session.steps.length - 1) return stop()
    go(current + 1)
    timer = setTimeout(tick, 6500)
  }
  function play() {
    if (timer) return
    if (current === session.steps.length - 1) go(0)
    timer = setTimeout(tick, 6500)
    label()
  }
  function stop() {
    clearTimeout(timer)
    timer = null
    label()
  }
  playButton.addEventListener('click', () => (timer ? stop() : play()))
  root.addEventListener('pointerenter', () => {
    held = true
  })
  root.addEventListener('pointerleave', () => {
    held = false
  })

  // The session plays itself once when it first comes into view, unless the
  // visitor is already using it or prefers no motion. It stops off-screen.
  let started = false
  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting
      if (!visible) stop()
      else if (!started && !reduce && !held) {
        started = true
        play()
      }
    },
    { threshold: 0.35 },
  ).observe(root)

  go(0, false)
  label()
}
