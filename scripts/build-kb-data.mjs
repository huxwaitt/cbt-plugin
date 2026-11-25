#!/usr/bin/env node
// Builds the data the site shows from a checkout of the cbt-self-help plugin.
//
//   node scripts/build-kb-data.mjs --plugin ../cbt-plugin
//
// Reads the plugin's protocol.md and kg/ folder and writes:
//   src/data/kb-core.json    ids, labels and links for every domain, page, concept, model and source
//   src/data/kb-detail.json  the text shown in the inspector: summaries, bottom lines, definitions
//   src/data/protocol.json   protocol.md split into its sections, word for word
//   src/data/excerpts.json   the notice, one page head and one vocabulary entry, word for word
// It then checks src/data/session.json against the plugin: every id it names
// must exist and every rule it quotes must be in protocol.md word for word.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const arg = name => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : undefined
}
const plugin = resolve(arg('plugin') ?? process.env.CBT_PLUGIN_DIR ?? join(root, '..', 'cbt-plugin'))
const kg = join(plugin, 'kg')
if (!existsSync(join(kg, '_graph.json'))) {
  console.error(`No knowledge graph at ${kg}. Pass --plugin <path to a cbt-plugin checkout>.`)
  process.exit(1)
}
const read = p => readFileSync(p, 'utf8')
const out = join(root, 'src', 'data')
mkdirSync(out, { recursive: true })

// ---------------------------------------------------------------- pages
const flow = v => v.replace(/^\[|\]$/g, '').split(',').map(s => s.trim()).filter(Boolean)
function parsePage(file) {
  const text = read(join(kg, file))
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!m) return null
  const fm = {}
  let block = null
  for (const line of m[1].split('\n')) {
    const item = line.match(/^\s+-\s+(.*)$/)
    if (item && block) {
      fm[block].push(item[1].trim())
      continue
    }
    const kv = line.match(/^([a-z_]+):\s*(.*)$/)
    if (!kv) continue
    const [, key, value] = kv
    if (value === '') {
      block = key
      fm[key] = []
    } else {
      block = null
      fm[key] = value.replace(/^"|"$/g, '')
    }
  }
  const bottom = (m[2].match(/^\*\*Bottom line:\*\*\s*(.+)$/m) ?? [])[1] ?? ''
  return {
    id: fm.id,
    t: fm.title,
    ty: fm.type,
    d: fm.depth,
    f: file,
    s: fm.summary,
    st: flow(fm.stage ?? ''),
    tp: flow(fm.topics ?? ''),
    c: flow(fm.concepts ?? ''),
    when: fm.applies_when ?? '',
    b: bottom.trim(),
    src: fm.sources ?? [],
    rel: (fm.related ?? [])
      .map(r => r.match(/id:\s*([^,}]+),\s*rel:\s*([^}]+)/))
      .filter(Boolean)
      .map(r => [r[1].trim(), r[2].trim()]),
    rev: fm.reviewed ?? '',
    ln: (text.match(/\n/g) ?? []).length,
  }
}

const graph = JSON.parse(read(join(kg, '_graph.json')))
const domains = graph.nodes
  .filter(n => n.kind === 'domain')
  .map(n => ({ id: n.id, l: n.label, p: n.path }))
const pages = []
for (const n of graph.nodes.filter(n => n.kind === 'page')) {
  const page = parsePage(n.file)
  if (!page || page.id !== n.id) throw new Error(`Cannot parse ${n.file}`)
  page.dom = n.domain
  pages.push(page)
}

// ---------------------------------------------------------------- vocabulary
const schemes = []
const concepts = []
let models = []
for (const name of readdirSync(join(kg, '_vocab')).filter(f => f.endsWith('.json')).sort()) {
  const data = JSON.parse(read(join(kg, '_vocab', name)))
  if (data.models) {
    models = data.models
      .filter(m => !m.deprecated)
      .map(m => ({
        id: m.id,
        l: m.label,
        g: m.group,
        s: m.summary,
        when: m.use_when,
        page: m.page,
        slots: m.slots.map(s => ({ id: s.id, l: s.label, q: s.prompt, v: s.vocab, r: s.rating })),
      }))
    continue
  }
  const live = data.concepts.filter(c => !c.deprecated)
  schemes.push({ p: data.prefix, t: data.title, d: data.description, n: live.length, file: `_vocab/${name}` })
  for (const c of live)
    concepts.push({
      id: c.id,
      l: c.label,
      g: c.group ?? '',
      def: c.definition ?? '',
      cw: c.client_wording ?? '',
      ex: c.example ?? '',
      see: c.see ?? [],
      rel: c.related ?? [],
    })
}

// ---------------------------------------------------------------- sources
const sources = graph.nodes
  .filter(n => n.kind === 'source')
  .map(n => [n.id, n.source_kind ?? 'other'])
const sourceLabel = Object.fromEntries(
  graph.nodes.filter(n => n.kind === 'source').map(n => [n.id, n.label]),
)

// ---------------------------------------------------------------- protocol
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const protocolText = read(join(plugin, 'protocol.md'))
const protocol = []
{
  const parts = protocolText.split(/^## /m)
  protocol.push({ id: 'protocol.session-mode', t: 'Session mode', text: parts[0].replace(/^# .*\n/, '').trim() })
  for (const part of parts.slice(1)) {
    const [title, ...rest] = part.split('\n')
    protocol.push({ id: `protocol.${slug(title)}`, t: title.trim(), text: rest.join('\n').trim() })
  }
}

// ---------------------------------------------------------------- write
const counts = {
  domains: domains.length,
  pages: pages.filter(p => p.ty !== 'pitfall').length,
  pitfalls: pages.filter(p => p.ty === 'pitfall').length,
  concepts: concepts.length,
  schemes: schemes.length,
  models: models.length,
  sources: sources.length,
  edges: graph.edges.length,
}

// The map is drawn from the core file; the detail file fills the inspector.
const core = {
  generated: graph.generated,
  counts,
  protocol: protocol.map(({ id, t, text }) => ({ id, t, words: text.split(/\s+/).length })),
  domains,
  pages: pages.map(p => ({
    id: p.id,
    t: p.t,
    ty: p.ty,
    dom: p.dom,
    c: p.c,
    rel: p.rel,
    sk: p.src.map(line => line.split(' § ')[0].trim()),
  })),
  schemes: schemes.map(({ p, t, n }) => ({ p, t, n })),
  concepts: concepts.map(({ id, l }) => ({ id, l })),
  models: models.map(({ id, l, page }) => ({ id, l, page })),
  sources,
}
const detail = {
  pages: Object.fromEntries(
    pages.map(({ id, d, f, s, st, tp, when, b, src, rev, ln }) => [id, { d, f, s, st, tp, when, b, src, rev, ln }]),
  ),
  concepts: Object.fromEntries(concepts.map(({ id, g, def, cw, ex, see }) => [id, { g, def, cw, ex, see }])),
  schemes: Object.fromEntries(schemes.map(({ p, d, file }) => [p, { d, file }])),
  models: Object.fromEntries(models.map(({ id, g, s, when, slots }) => [id, { g, s, when, slots }])),
  protocol: Object.fromEntries(protocol.map(({ id, text }) => [id, text])),
  sourceLabels: {},
}

// Check the demonstration against the plugin: every id must exist and every
// quoted rule must appear in protocol.md word for word.
const sessionPath = join(out, 'session.json')
const problems = []
if (existsSync(sessionPath)) {
  const session = JSON.parse(read(sessionPath))
  const known = new Set([
    ...pages.map(p => p.id),
    ...concepts.map(c => c.id),
    ...models.map(m => m.id),
    ...protocol.map(p => p.id),
    ...domains.map(d => d.id),
    ...session.record.map(r => r.id),
  ])
  const plain = s => s.replace(/[`*]/g, '').replace(/\s+/g, ' ').trim()
  const protocolPlain = plain(protocolText)
  const used = new Set()
  for (const step of session.steps)
    for (const a of step.activates ?? []) {
      if (!known.has(a.id)) problems.push(`step "${step.id}": unknown id ${a.id}`)
      if (a.call !== undefined && !step.calls[a.call]) problems.push(`step "${step.id}": ${a.id} names call ${a.call}`)
      used.add(a.id)
      for (const linked of a.links ?? []) if (!known.has(linked)) problems.push(`step "${step.id}": ${a.id} links to unknown id ${linked}`)
      for (const part of (a.quote ?? '').split('[…]'))
        if (part.trim() && !protocolPlain.includes(plain(part)))
          problems.push(`step "${step.id}": quote not in protocol.md: "${part.trim()}"`)
    }
  for (const p of pages)
    if (used.has(p.id))
      for (const line of p.src) {
        const key = line.split(' § ')[0].trim()
        if (sourceLabel[key]) detail.sourceLabels[key] = sourceLabel[key]
      }
}
if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}

// Short passages shown word for word on the Features and Safety pages.
const notice = (() => {
  const source = read(join(plugin, 'hooks', 'register.ts'))
  const body = (source.match(/const DISCLAIMER = \[([\s\S]*?)\]\.join/) ?? [])[1]
  if (!body) throw new Error('Cannot find DISCLAIMER in hooks/register.ts')
  return body
    .split('\n')
    .map(line => line.trim().replace(/,$/, ''))
    .filter(Boolean)
    .map(line => line.slice(1, -1).replace('${DATA}', '<your user folder>\\.cbt-self-help'))
    .join('\n')
})()
const pageHead = file => {
  const text = read(join(kg, file))
  const end = text.indexOf('\n', text.indexOf('**Bottom line:**'))
  return text.slice(0, end).trim()
}
const conceptEntry = (file, id) => {
  const entry = JSON.parse(read(join(kg, '_vocab', file))).concepts.find(c => c.id === id)
  if (!entry) throw new Error(`No concept ${id} in ${file}`)
  return JSON.stringify(entry, null, 2)
}
// The sample sessions on the home page name tools, arguments and results by
// hand. Each must still exist in the plugin's code, or the build stops.
{
  const home = read(join(root, 'index.html'))
  const source = read(join(plugin, 'hooks', 'register.ts'))
  const shown = [...home.matchAll(/<b>cbt-self-help - (\w+)<\/b> \(MCP\)(?:\(([^)]*)\))?<\/p><p class="tl__res">([^<]*)<\/p>/g)]
  for (const [, tool, args = '', result] of shown) {
    const fail = what => {
      throw new Error(`index.html shows ${what}, which the plugin does not have (tool ${tool})`)
    }
    if (!source.includes(`name: '${tool}'`)) fail(`the tool "${tool}"`)
    const key = args.match(/^(\w+):/)?.[1]
    if (key && !new RegExp(`\\b${key}: \\{`).test(source)) fail(`the argument "${key}"`)
    const model = args.match(/model_id: "([^"]+)"/)?.[1]
    if (model && !models.some(m => m.id === model)) fail(`the formulation model "${model}"`)
    const stem = result.split(/[(\d]/)[0].trim()
    if (!stem || !source.includes(stem)) fail(`the result "${result}"`)
  }
  if (!shown.length) throw new Error('index.html: no sample tool calls found to check')
}

// The refusals the plugin returns, copied from the code that enforces them.
const refusal = fragment => {
  const source = read(join(plugin, 'hooks', 'register.ts'))
  const line = source.split('\n').find(l => l.includes('deny:') && l.includes(fragment))
  const text = line && (line.match(/deny:\s*[`'](.*)[`']/) ?? [])[1]
  if (!text) throw new Error(`Cannot find the refusal containing "${fragment}" in hooks/register.ts`)
  return text.replace('${PLUGIN}', 'cbt-self-help').replace("${unknown.join(', ')}", '<the ids>')
}
const excerpts = {
  'refusal-tools': refusal('only the knowledge base can be read'),
  'refusal-guard': refusal('the session guard failed'),
  'refusal-vocab': refusal('unknown concept ids'),
  'refusal-discard': refusal('Not discarded'),
  notice,
  'page-validation': pageHead('06-therapeutic-relationship/responding-in-session/validation.md'),
  'concept-mind-reading': conceptEntry('cognitive-distortions.json', 'cd.mind-reading'),
}
writeFileSync(join(out, 'excerpts.json'), JSON.stringify(excerpts, null, 1))

const size = v => `${Math.round(Buffer.byteLength(JSON.stringify(v)) / 1024)} KB`
writeFileSync(join(out, 'kb-core.json'), JSON.stringify(core))
writeFileSync(join(out, 'kb-detail.json'), JSON.stringify(detail))
writeFileSync(join(out, 'protocol.json'), JSON.stringify({ sections: protocol }, null, 1))
console.log(
  `${domains.length} domains, ${pages.length} pages, ${concepts.length} concepts, ${models.length} models, ${sources.length} sources`,
)
console.log(`kb-core.json ${size(core)}, kb-detail.json ${size(detail)}, protocol.json ${protocol.length} sections`)
