// Builds the detail card for one point on the map. Everything shown comes from
// the plugin's own files (kb-core.json, kb-detail.json) or from the sample session.
const HOW = {
  context: 'In context this turn',
  routed: 'Routed to this turn',
  read: 'Read this turn',
  armed: 'Standing by',
  tagged: 'Tagged this turn',
  linked: 'Linked this turn',
  recordRead: 'Read this turn',
  written: 'Written this turn',
}
const DEPTH = { L1: 'orientation', L2: 'working knowledge', L3: 'specialist detail' }
const win = path => path.replace(/\//g, '\\')

const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value === null || value === undefined) continue
    if (key === 'class') node.className = value
    else if (key === 'text') node.textContent = value
    else node.setAttribute(key, value === true ? '' : value)
  }
  node.append(...children.flat().filter(c => c !== null && c !== undefined && c !== false))
  return node
}
const section = (title, ...children) => el('div', { class: 'card__sec' }, el('h4', { text: title }), children)
const facts = rows =>
  el(
    'dl',
    { class: 'card__facts' },
    rows.filter(([, value]) => value).flatMap(([name, value, mono]) => [el('dt', { text: name }), el('dd', { class: mono ? 'mono' : null, text: value })]),
  )
const more = (shown, total, noun) => (total > shown ? el('p', { class: 'card__more', text: `and ${total - shown} more ${noun}` }) : null)
const idList = (items, limit, noun) => [
  el(
    'ul',
    { class: 'card__list' },
    items.slice(0, limit).map(([id, note]) => el('li', {}, el('span', { class: 'mono', text: id }), note ? el('small', { text: note }) : null)),
  ),
  more(Math.min(limit, items.length), items.length, noun),
]
const pending = () => el('p', { class: 'card__more', text: 'Loading the text of this item.' })

function why(activation, step) {
  if (!activation.length) return section('This turn', el('p', { text: 'Not used in this turn. It is part of the knowledge base the session can reach.' }))
  return activation.map(a => {
    const call = a.call !== undefined ? step.calls[a.call] : null
    return section(
      'Why it lit up',
      el('p', { class: 'why', text: a.why }),
      a.quote ? el('p', { class: 'card__quote', text: `“${a.quote}”` }) : null,
      call ? el('pre', { text: call.args ? `${call.tool} ${call.args}\n→ ${call.result}` : `${call.tool}\n→ ${call.result}` }) : null,
    )
  })
}

function top(kind, title, id, activation, amber = false) {
  return el(
    'div',
    { class: 'card__top' },
    el(
      'div',
      { class: 'card__chips' },
      el('span', { class: 'chip', text: kind }),
      activation.length
        ? el('span', { class: `chip ${amber ? 'chip--amber' : 'chip--cool'}`, text: HOW[activation[0].how] })
        : el('span', { class: 'chip', text: 'Not used this turn' }),
    ),
    el('p', { class: 'card__title', text: title }),
    id ? el('p', { class: 'card__id', text: id }) : null,
  )
}

export function card(id, { data, step, activation }) {
  const detail = data.detail
  const label = other => data.concepts.get(other)?.l ?? data.models.get(other)?.l ?? data.pages.get(other)?.t ?? ''

  if (id === 'turn') {
    return el(
      'div',
      { class: 'card card--amber' },
      top('Turn', step.title, null, [{ how: 'context' }], true),
      section('What was said', step.turns.map(t => el('p', { text: t.text }))),
      section('Calls behind it', el('ul', { class: 'card__list' }, step.calls.map(c => el('li', {}, el('span', { class: 'mono', text: c.tool }), el('small', { text: c.result }))))),
    )
  }

  if (data.pages.has(id)) {
    const page = data.pages.get(id)
    const d = detail?.pages[id]
    const pitfall = page.ty === 'pitfall'
    return el(
      'div',
      { class: 'card' },
      top(pitfall ? 'Pitfall page' : 'Reference page', page.t, id, activation),
      why(activation, step),
      d
        ? [
            section('Bottom line', el('p', { text: d.b })),
            section(
              'The file',
              facts([
                ['Path', `kg\\${win(d.f)}`, true],
                ['Type', page.ty],
                ['Depth', d.d.split('-').map(k => `${k} ${DEPTH[k]}`).join(' to ')],
                ['Stage', d.st.join(', ')],
                ['Topics', d.tp.join(', ')],
                ['Reviewed', d.rev],
              ]),
            ),
            section('Applies when', el('p', { text: d.when })),
          ]
        : pending(),
      page.c.length ? section(`Vocabulary it tags (${page.c.length})`, idList(page.c.map(c => [c, label(c)]), 8, 'concepts')) : null,
      page.rel.length ? section(`Related pages (${page.rel.length})`, idList(page.rel.map(([other, rel]) => [other, rel]), 6, 'pages')) : null,
      d
        ? section(
            `Sources it cites (${d.src.length})`,
            el(
              'ul',
              { class: 'card__list' },
              d.src.slice(0, 5).map(line => {
                const [key, where] = line.split(' § ')
                return el('li', {}, el('span', { class: 'mono', text: key }), el('small', { text: detail.sourceLabels[key] ?? where ?? '' }))
              }),
            ),
            more(Math.min(5, d.src.length), d.src.length, 'sources'),
          )
        : null,
    )
  }

  if (data.models.has(id)) {
    const model = data.models.get(id)
    const d = detail?.models[id]
    return el(
      'div',
      { class: 'card' },
      top('Formulation model', model.l, id, activation),
      why(activation, step),
      d
        ? [
            section('What it maps', el('p', { text: d.s })),
            section('Use when', el('p', { text: d.when })),
            section(
              `Its ${d.slots.length} boxes`,
              el(
                'ul',
                { class: 'card__list' },
                d.slots.map(s => el('li', {}, el('span', { class: 'mono', text: s.id }), el('small', { text: `${s.l}. Filled from ${s.v.join(', ')}${s.r ? `, rated for ${s.r}` : ''}.` }))),
              ),
            ),
            section('The file', facts([['Path', 'kg\\_vocab\\formulation-models.json', true], ['Taught on', model.page, true], ['Group', d.g]])),
          ]
        : pending(),
    )
  }

  if (data.concepts.has(id)) {
    const concept = data.concepts.get(id)
    const d = detail?.concepts[id]
    const scheme = data.schemes.get(id.split('.')[0])
    const file = detail?.schemes[scheme.p]?.file
    return el(
      'div',
      { class: 'card' },
      top('Vocabulary concept', concept.l, id, activation),
      why(activation, step),
      d
        ? [
            d.def ? section('Definition', el('p', { text: d.def })) : null,
            d.cw ? section('In plain words', el('p', { text: d.cw })) : null,
            d.ex ? section('Example', el('p', { text: d.ex })) : null,
            section('The scheme', facts([['Scheme', `${scheme.t} (${scheme.n})`], ['Group', d.g], ['Path', file ? `kg\\${win(file)}` : '', true]])),
            d.see.length
              ? section(`Pages that discuss it (${d.see.length})`, idList(d.see.map(p => [p, data.pages.get(p)?.t ?? '']), 6, 'pages'))
              : section('Pages that discuss it', el('p', { text: 'No page tags this concept yet.' })),
          ]
        : pending(),
    )
  }

  if (data.domains.has(id)) {
    const domain = data.domains.get(id)
    const pages = data.core.pages.filter(p => p.dom === id)
    const pitfalls = pages.filter(p => p.ty === 'pitfall').length
    return el(
      'div',
      { class: 'card' },
      top('Domain', domain.l, id, activation),
      why(activation, step),
      section('The folder', facts([['Path', `kg\\${win(domain.p)}\\`, true], ['Index', `kg\\${win(domain.p)}\\_index.md`, true], ['Holds', `${pages.length - pitfalls} pages, ${pitfalls} pitfalls`]])),
      section('Its pages', idList(pages.filter(p => p.ty !== 'pitfall').map(p => [p.id.split('.').pop(), p.t]), 8, 'pages')),
    )
  }

  if (data.protocol.has(id)) {
    const part = data.protocol.get(id)
    return el(
      'div',
      { class: 'card' },
      top('Protocol section', part.t, 'protocol.md', activation),
      why(activation, step),
      section('The file', facts([['Path', 'protocol.md, in the plugin folder', true], ['Length', `${part.words} words`], ['Loaded', 'into the system prompt while a session is open']])),
      section('The whole section', detail ? el('pre', { text: detail.protocol[id] }) : pending()),
    )
  }

  if (data.sources.has(id)) {
    const source = data.sources.get(id)
    const citing = data.core.pages.filter(p => p.sk.includes(source.key))
    const full = detail?.sourceLabels[source.key]
    return el(
      'div',
      { class: 'card' },
      top('Source', source.key, null, activation),
      activation.length ? why(activation, step) : section('This turn', el('p', { text: citing.some(p => step.activates.some(a => a.id === p.id && a.how === 'read')) ? 'Cited by a page that was read this turn.' : 'Not behind any page read this turn.' })),
      section('The citation', full ? el('p', { text: full }) : el('p', { text: 'The full reference is the row with this key in kg\\_sources.md.' }), facts([['Kind', source.kind], ['Listed in', 'kg\\_sources.md', true]])),
      section(`Pages that cite it (${citing.length})`, idList(citing.map(p => [p.id, p.t]), 6, 'pages')),
    )
  }

  const file = data.record.get(id)
  return el(
    'div',
    { class: 'card card--amber' },
    top('Record file', file.file, `.cbt-self-help\\${file.file}`, activation, true),
    why(activation, step),
    section('What it holds', el('p', { text: file.what })),
    section('What it looks like', el('pre', { text: file.preview }), el('p', { class: 'card__more', text: 'A sample in the plugin\'s real format. Yours stays on your computer.' })),
  )
}
