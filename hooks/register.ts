import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

// Where things live. The knowledge graph is the clinical reference; the record
// is the person's own data and stays on this computer.
// The knowledge graph ships inside the plugin, in kg\. Set when the session starts.
let KG = ''
const DATA = 'C:\\Users\\huxle\\.cbt-self-help'
// The plugin's working copy; the wiki pages beside it are generated from it.
const RECORD = `${DATA}\\_data.json`
const FORMULATION_EXPORT = `${DATA}\\formulation-latest.json`
const page = () => `file:///${KG.replace(/\\/g, '/')}/formulation/index.html`

const PLUGIN = 'cbt-self-help'
const TOOL = (name: string) => `mcp__${PLUGIN}__${name}`

const DISCLAIMER = [
  'CBT self-help session',
  '',
  'This is a guided self-help tool based on cognitive behavioral therapy (CBT) techniques.',
  'It is not therapy and does not replace a therapist, doctor or other professional care.',
  'The creator claims no therapeutic benefit and accepts no legal liability for its use.',
  'It is an AI and can be wrong. Your session notes are saved only on this computer',
  `(${DATA}); /cbt-record shows them and /cbt-forget confirm erases them.`,
  '',
  'If you are in crisis or thinking about harming yourself: US: call or text 988, or 911.',
  'UK: Samaritans 116 123, text SHOUT to 85258, NHS 111, or 999. Elsewhere: findahelpline.com.',
  '',
  'Type /cbt-end at any time to wrap up.',
].join('\n')

const active = atom({ plugin: 'cbt-self-help', key: 'active' } as const, false, {
  shape: 'active-1',
})

type ConceptRef = { id: string; rating: number | null }
type Slot = { concepts: ConceptRef[]; free_text: string }
type Session = {
  number: number
  date: string
  mood: number | null
  phq9: number | null
  gad7: number | null
  agenda: string
  summary: string
  techniques: string[]
  homework_review: string
  homework: string
  risk_screened: boolean
  risk_flag: boolean
  risk_note: string
  feedback: string
  pages_used: string[]
  concepts: string[]
  // Written as the session goes: open until closed.
  status: 'open' | 'closed' | 'not wrapped up'
  notes: { time: string; text: string }[]
}
type Profile = {
  preferred_name?: string
  goals?: string[]
  concerns?: string
  strengths?: string
  supports?: string
  current_care?: string
  notes?: string
}
type CbtRecord = {
  format: 'cbt-self-help-record'
  version: 1
  created: string
  profile: Profile
  formulation: { model_id: string; slots: Record<string, Slot>; updated: string } | null
  sessions: Session[]
  // Index of the topic pages; their bodies live only in topics\<slug>.md.
  topics?: { slug: string; title: string; summary: string; updated: string }[]
}

type ModelInfo = {
  id: string
  label: string
  slots: { id: string; label: string; rating: string | null }[]
}
type Vocab = { labels: Map<string, string>; models: Map<string, ModelInfo> }

let vocabCache: Vocab | null = null
let protocolCache: string | null = null

const today = () => new Date().toISOString().slice(0, 10)
const norm = (p: string) => p.replace(/\//g, '\\').toLowerCase()
const isInside = (p: string, root: string) => {
  const a = norm(p)
  const b = norm(root)
  return a === b || a.startsWith(b.endsWith('\\') ? b : `${b}\\`)
}

const emptyRecord = (): CbtRecord => ({
  format: 'cbt-self-help-record',
  version: 1,
  created: today(),
  profile: {},
  formulation: null,
  sessions: [],
})

async function loadRecord($: any): Promise<CbtRecord> {
  if (!(await $.fs.exists(RECORD))) return emptyRecord()
  const text = String(await $.fs.read(RECORD)).trim()
  if (!text) return emptyRecord()
  return JSON.parse(text) as CbtRecord
}
async function saveRecord($: any, rec: CbtRecord) {
  await $.fs.write(RECORD, JSON.stringify(rec, null, 2))
  await renderWiki($, rec)
}

const pad = (n: number) => String(n).padStart(3, '0')
const q = (v: unknown) => JSON.stringify(v ?? '')
const list = (xs: string[]) => `[${xs.join(', ')}]`
const or = (v: unknown, empty = 'not recorded') =>
  v === null || v === undefined || v === '' ? empty : String(v)

// Writes the person's record as a small wiki: router, profile, formulation,
// a session index and one page per session. Pages link to knowledge graph
// pages and vocabulary ids, so the record joins the same graph.
async function renderWiki($: any, rec: CbtRecord) {
  const vocab = await loadVocab($)
  const label = (id: string) => `${vocab.labels.get(id) ?? id} (\`${id}\`)`
  const p = rec.profile
  const sessions = rec.sessions

  await $.fs.write(`${DATA}\\_index.md`, [
    '# CBT self-help record',
    '',
    'Personal record kept by the cbt-self-help plugin. Not therapy and not a clinical record.',
    'Generated from `_data.json` after every change: edits made here by hand are overwritten.',
    '',
    '| File | What it holds |',
    '|---|---|',
    '| [profile.md](profile.md) | Name, goals, concerns, strengths, supports, current care |',
    '| [formulation.md](formulation.md) | The current CBT formulation, coded with the vocabulary |',
    `| [topics/_index.md](topics/_index.md) | What is known about each theme, kept current (${(rec.topics ?? []).length} topics) |`,
    `| [sessions/_index.md](sessions/_index.md) | One row per session (${sessions.length} so far) |`,
    '',
    `Reference knowledge: \`${KG}\`. Page ids in \`related\` and vocabulary ids in \`concepts\` point there.`,
    '',
  ].join('\n'))

  await $.fs.write(`${DATA}\\_schema.md`, [
    '# Record schema',
    '',
    'Pages: `profile.md`, `formulation.md`, `sessions/_index.md`, `sessions/session-NNN.md`.',
    'Session frontmatter: `id`, `date`, `status` (open, closed, not wrapped up), `mood` (0 to 10), `phq9`,',
    '`gad7`, `risk_screened`, `risk_flag`, `concepts` (vocabulary ids from the knowledge graph `_vocab`),',
    '`related` (knowledge graph page ids used in the session).',
    '',
  ].join('\n'))

  await $.fs.write(`${DATA}\\profile.md`, [
    '---',
    'id: record.profile',
    `name: ${q(p.preferred_name)}`,
    `sessions: ${sessions.length}`,
    `updated: ${today()}`,
    '---',
    '',
    `# Profile${p.preferred_name ? `: ${p.preferred_name}` : ''}`,
    '',
    '## Goals',
    ...((p.goals ?? []).length ? (p.goals ?? []).map(g => `- ${g}`) : ['Not set yet.']),
    '',
    `## Main concerns\n${or(p.concerns)}`,
    '',
    `## Strengths\n${or(p.strengths)}`,
    '',
    `## Supports\n${or(p.supports)}`,
    '',
    `## Current care\n${or(p.current_care)}`,
    '',
    `## Notes\n${or(p.notes, 'None.')}`,
    '',
  ].join('\n'))

  const f = rec.formulation
  const model = f ? vocab.models.get(f.model_id) : undefined
  const fConcepts = f ? Object.values(f.slots).flatMap(sl => sl.concepts.map(c => c.id)) : []
  const fBody: string[] = []
  if (!f || !model) fBody.push('No formulation yet. It is built together during sessions.', '')
  else
    for (const slot of model.slots) {
      const saved = f.slots[slot.id]
      const items = (saved?.concepts ?? []).map(
        c => `- ${label(c.id)}${c.rating !== null ? `: ${c.rating}/100` : ''}`,
      )
      fBody.push(`## ${slot.label}`, ...items)
      if (saved?.free_text) fBody.push(`> ${saved.free_text}`)
      if (!items.length && !saved?.free_text) fBody.push('Not filled in yet.')
      fBody.push('')
    }
  await $.fs.write(`${DATA}\\formulation.md`, [
    '---',
    'id: record.formulation',
    `model: ${f?.model_id ?? 'none'}`,
    `concepts: ${list([...new Set(fConcepts)])}`,
    `updated: ${f?.updated ?? today()}`,
    '---',
    '',
    `# Formulation${model ? `: ${model.label}` : ''}`,
    '',
    ...fBody,
    'Export for the formulation page: `/cbt-formulation`.',
    '',
  ].join('\n'))

  const cell = (v: unknown) => or(v, '').replace(/\|/g, '/').replace(/\n/g, ' ')
  await $.fs.write(`${DATA}\\topics\\_index.md`, [
    '# Topics',
    '',
    'What is understood about each theme so far, written and revised by Claude across sessions.',
    'Each claim cites the session it came from. Read them, and correct anything that is wrong.',
    '',
    '| Topic | Summary | Updated |',
    '|---|---|---|',
    ...(rec.topics ?? []).map(t => `| [${cell(t.title)}](${t.slug}.md) | ${cell(t.summary)} | ${t.updated} |`),
    '',
  ].join('\n'))
  await $.fs.write(`${DATA}\\sessions\\_index.md`, [
    '# Sessions',
    '',
    '| Session | Date | Status | Mood | PHQ-9 | GAD-7 | Practice task |',
    '|---|---|---|---|---|---|---|',
    ...sessions.map(
      s =>
        `| [${pad(s.number)}](session-${pad(s.number)}.md) | ${s.date} | ${s.status} | ${cell(s.mood)} | ${cell(s.phq9)} | ${cell(s.gad7)} | ${cell(s.homework)} |`,
    ),
    '',
  ].join('\n'))

  for (const s of sessions) {
    const concepts = s.concepts ?? []
    await $.fs.write(`${DATA}\\sessions\\session-${pad(s.number)}.md`, [
      '---',
      `id: sessions.session-${pad(s.number)}`,
      `date: ${s.date}`,
      `status: ${s.status}`,
      `mood: ${s.mood ?? 'null'}`,
      `phq9: ${s.phq9 ?? 'null'}`,
      `gad7: ${s.gad7 ?? 'null'}`,
      `risk_screened: ${s.risk_screened}`,
      `risk_flag: ${s.risk_flag}`,
      `concepts: ${list(concepts)}`,
      'related:',
      ...s.pages_used.map(id => `  - {id: ${id}, rel: see-also}`),
      '---',
      '',
      `# Session ${s.number}: ${s.date}`,
      '',
      `## Summary\n${or(s.summary, 'Not written yet.')}`,
      '',
      `## Agenda\n${or(s.agenda)}`,
      '',
      `## Last practice task\n${or(s.homework_review)}`,
      '',
      '## Notes',
      ...(s.notes.length ? s.notes.map(n => `- ${n.time} ${n.text}`) : ['None yet.']),
      '',
      `## Techniques\n${s.techniques.length ? s.techniques.join(', ') : 'None recorded.'}`,
      '',
      `## Practice task for next time\n${or(s.homework, 'Not agreed yet.')}`,
      '',
      `## Feedback\n${or(s.feedback)}`,
      '',
      ...(s.risk_flag ? [`## Safety\n${or(s.risk_note)}`, ''] : []),
      ...(concepts.length ? ['## Patterns noticed', ...concepts.map(c => `- ${label(c)}`), ''] : []),
    ].join('\n'))
  }
}

// Opens a new session in the record and saves it straight away. A session
// left open by an earlier chat is marked as not wrapped up.
async function openSession($: any): Promise<number> {
  const rec = await loadRecord($)
  for (const s of rec.sessions) if (s.status === 'open') s.status = 'not wrapped up'
  const number = rec.sessions.length + 1
  rec.sessions.push({
    number,
    date: today(),
    mood: null,
    phq9: null,
    gad7: null,
    agenda: '',
    summary: '',
    techniques: [],
    homework_review: '',
    homework: '',
    risk_screened: false,
    risk_flag: false,
    risk_note: '',
    feedback: '',
    pages_used: [],
    concepts: [],
    status: 'open',
    notes: [],
  })
  await saveRecord($, rec)
  return number
}

async function loadVocab($: any): Promise<Vocab> {
  if (vocabCache) return vocabCache
  const labels = new Map<string, string>()
  const models = new Map<string, ModelInfo>()
  for (const entry of await $.fs.list(`${KG}\\_vocab`)) {
    if (entry.kind !== 'file' || !entry.name.endsWith('.json')) continue
    const data = JSON.parse(String(await $.fs.read(`${KG}\\_vocab\\${entry.name}`)))
    for (const c of data.concepts ?? []) if (!c.deprecated) labels.set(c.id, c.label)
    for (const m of data.models ?? [])
      models.set(m.id, {
        id: m.id,
        label: m.label,
        slots: (m.slots ?? []).map((s: any) => ({
          id: s.id,
          label: s.label,
          rating: s.rating ?? null,
        })),
      })
  }
  vocabCache = { labels, models }
  return vocabCache
}

async function loadProtocol($: any) {
  if (protocolCache === null)
    protocolCache = String(await $.fs.read(`${$.plugin.root}\\protocol.md`)).split('{{KG}}').join(KG)
  return protocolCache
}

async function setActive($: any, isOn: boolean) {
  await update($, active, () => isOn)
  $.ui.status(isOn ? 'CBT self-help session' : undefined)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    KG = `${$.plugin.root}\\kg`
    for (const command of [
      { name: 'cbt-session', description: 'Start a guided CBT self-help session (not therapy)' },
      { name: 'cbt-end', description: 'Wrap up and save the current CBT self-help session' },
      { name: 'cbt-record', description: 'Show your saved CBT self-help record' },
      { name: 'cbt-formulation', description: 'Export your formulation for the formulation page' },
      {
        name: 'cbt-forget',
        description: 'Erase your saved CBT self-help record',
        argumentHint: 'confirm',
      },
    ])
      await $.command.register(command)

    await $.tool.register({
      name: 'record_read',
      description:
        'Read the person\'s CBT self-help record: profile, formulation, and every earlier session (mood, measures, homework, risk notes). Call first in every session.',
      inputSchema: { type: 'object', properties: {} },
      isDeferred: false,
    })
    await $.tool.register({
      name: 'profile_update',
      description:
        'Update the person\'s profile in the CBT self-help record. Only the fields given are changed; goals replaces the whole list.',
      inputSchema: {
        type: 'object',
        properties: {
          preferred_name: { type: 'string' },
          goals: { type: 'array', items: { type: 'string' } },
          concerns: { type: 'string', description: 'Main concerns in plain words' },
          strengths: { type: 'string' },
          supports: { type: 'string', description: 'People and resources they can lean on' },
          current_care: { type: 'string', description: 'Current therapist, doctor, medication, as they described it' },
          notes: { type: 'string' },
        },
      },
      isDeferred: false,
    })
    await $.tool.register({
      name: 'formulation_update',
      description:
        'Set or update the shared CBT formulation. model_id is a formulation model id from _vocab/formulation-models.json (for example fm.five-part). Each slot entry names a slot id of that model, concept ids from the fixed vocabulary (with a 0 to 100 rating where the slot is rated), and the person\'s own words. Slots not given are kept. Changing model_id starts a fresh formulation. Unknown ids are rejected.',
      inputSchema: {
        type: 'object',
        properties: {
          model_id: { type: 'string' },
          slots: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                slot: { type: 'string' },
                concepts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: { id: { type: 'string' }, rating: { type: 'number' } },
                    required: ['id'],
                  },
                },
                free_text: { type: 'string', description: 'The person\'s own words for this box' },
              },
              required: ['slot'],
            },
          },
        },
        required: ['model_id', 'slots'],
      },
      isDeferred: false,
    })
    await $.tool.register({
      name: 'topic_write',
      description:
        'Create or rewrite one topic page of the person\'s wiki (topics\\<slug>.md): what is understood so far about one theme (for example sleep, work stress, a core belief, triggers, what helps). Write the whole page in plain prose, keeping what is still true from the current version (record_read shows it, including any edits the person made by hand). Cite the session each claim came from as [session-004]. No diagnosis, no method details.',
      inputSchema: {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'lowercase-hyphen file name, for example work-stress' },
          title: { type: 'string' },
          summary: { type: 'string', description: 'One sentence for the topic index' },
          body: { type: 'string', description: 'The page body in Markdown, without frontmatter' },
          concepts: { type: 'array', items: { type: 'string' }, description: 'Vocabulary ids this topic involves' },
          related: { type: 'array', items: { type: 'string' }, description: 'Knowledge base page ids relevant to this topic' },
          sessions: { type: 'array', items: { type: 'number' }, description: 'Session numbers this page draws on' },
        },
        required: ['slug', 'title', 'summary', 'body'],
      },
      isDeferred: false,
    })
    const SESSION_FIELDS = {
      mood: { type: 'number', description: 'Mood check, 0 to 10' },
      phq9: { type: 'number', description: 'PHQ-9 total' },
      gad7: { type: 'number', description: 'GAD-7 total' },
      agenda: { type: 'string' },
      homework_review: { type: 'string', description: 'How the last practice task went' },
      summary: { type: 'string', description: 'What was covered and learned so far, in plain words (replaces the earlier summary)' },
      homework: { type: 'string', description: 'The practice task agreed for next time' },
      feedback: { type: 'string', description: "The person's feedback on the session" },
      risk_screened: { type: 'boolean' },
      risk_flag: { type: 'boolean', description: 'True if any risk came up (once true it stays true)' },
      risk_note: { type: 'string', description: 'Short factual note and actions taken; no method details' },
      techniques: { type: 'array', items: { type: 'string' }, description: 'Added to the list' },
      pages_used: { type: 'array', items: { type: 'string' }, description: 'Knowledge base page ids, added to the list' },
      concepts: {
        type: 'array',
        items: { type: 'string' },
        description: 'Vocabulary ids for patterns that came up (thinking traps, emotions, behaviors and so on), added to the list',
      },
      note: { type: 'string', description: 'One line for the session timeline: what just happened or was learned' },
    }
    await $.tool.register({
      name: 'session_note',
      description:
        'Write to the current session record as you go: call after each step (mood check, safety screen, measures, homework review, agenda, each insight or technique, summary, practice task, feedback). Only the fields given change; techniques, pages_used and note are added. Never put method details in risk_note or note.',
      inputSchema: { type: 'object', properties: SESSION_FIELDS },
      isDeferred: false,
    })
    await $.tool.register({
      name: 'session_close',
      description:
        'Close the current session and end session mode, after the summary, practice task and feedback have been written with session_note. Accepts the same fields as a last update. Call at once if the person leaves early or safety ended the session.',
      inputSchema: { type: 'object', properties: SESSION_FIELDS },
      isDeferred: false,
    })

    return next(e)
  })

  // Session mode adds the protocol to the system prompt.
  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)
    if (!(await read($, active))) return composed
    return {
      sections: [
        ...composed.sections,
        { id: `${PLUGIN}:protocol`, text: await loadProtocol($), scope: 'session' as const },
      ],
    }
  })

  on('command.run', { command: 'cbt-session' }, async $ => {
    if (await read($, active)) return { text: 'A CBT self-help session is already running.' }
    const number = await openSession($)
    await setActive($, true)
    void $.prompt.submit({
      text: `[Session start] Begin CBT self-help session ${number} now, following the session protocol. Call record_read first, and write to the record with session_note as you go.`,
    })
    return { text: DISCLAIMER }
  })

  on('command.run', { command: 'cbt-end' }, async $ => {
    if (!(await read($, active))) return { text: 'No CBT self-help session is running.' }
    void $.prompt.submit({
      text: '[Wrap-up] I would like to end the session now. Please briefly summarize, agree a practice task, ask for my feedback, then close the session.',
    })
    return { text: 'Wrapping up the session.' }
  })

  on('command.run', { command: 'cbt-record' }, async $ => {
    const rec = await loadRecord($)
    if (rec.sessions.length === 0 && !rec.formulation)
      return { text: `No sessions saved yet. Your record will be a small wiki in ${DATA}.` }
    const p = rec.profile
    const last = rec.sessions[rec.sessions.length - 1]
    const series = (key: 'mood' | 'phq9' | 'gad7') =>
      rec.sessions
        .filter(s => s[key] !== null && s[key] !== undefined)
        .map(s => `${s.date}: ${s[key]}`)
        .join(', ') || 'none yet'
    const lines = [
      `CBT self-help record (${DATA}\\_index.md)`,
      `Name: ${p.preferred_name ?? 'not set'}`,
      `Goals: ${(p.goals ?? []).join('; ') || 'not set'}`,
      `Sessions: ${rec.sessions.length}${last ? `, last on ${last.date}` : ''}`,
      `Mood (0 to 10): ${series('mood')}`,
      `PHQ-9: ${series('phq9')}`,
      `GAD-7: ${series('gad7')}`,
      `Current practice task: ${last?.homework || 'none'}`,
      `Formulation model: ${rec.formulation?.model_id ?? 'none yet'}`,
    ]
    if (last?.summary) lines.push('', `Last session: ${last.summary}`)
    return { text: lines.join('\n') }
  })

  on('command.run', { command: 'cbt-formulation' }, async $ => {
    const rec = await loadRecord($)
    if (!rec.formulation) return { text: 'There is no formulation yet. It is built during sessions.' }
    const vocab = await loadVocab($)
    const model = vocab.models.get(rec.formulation.model_id)
    if (!model) return { text: `The saved model ${rec.formulation.model_id} is no longer in the vocabulary.` }
    const exported = {
      format: 'cbt-case-formulation',
      format_version: 1,
      exported: new Date().toISOString(),
      model: { id: model.id, label: model.label },
      header: {
        client_code: '',
        date: today(),
        therapist: 'CBT self-help plugin',
        session_number: rec.sessions.length || null,
      },
      slots: model.slots.map(s => {
        const saved = rec.formulation!.slots[s.id] ?? { concepts: [], free_text: '' }
        return {
          id: s.id,
          label: s.label,
          rating_type: s.rating,
          concepts: saved.concepts.map(c => ({
            id: c.id,
            label: vocab.labels.get(c.id) ?? null,
            rating: s.rating ? c.rating : null,
          })),
          free_text: saved.free_text,
        }
      }),
    }
    await $.fs.write(FORMULATION_EXPORT, JSON.stringify(exported, null, 2))
    return {
      text: [
        `Formulation exported to ${FORMULATION_EXPORT}`,
        `Open ${page()} in your browser, choose Import JSON, and pick that file.`,
      ].join('\n'),
    }
  })

  on('command.run', { command: 'cbt-forget' }, async ($, e) => {
    if (e.args.trim() !== 'confirm')
      return { text: 'This erases every saved session, your profile and formulation. To do it, type: /cbt-forget confirm' }
    for (const dir of ['sessions', 'topics'])
      if (await $.fs.exists(`${DATA}\\${dir}`))
        for (const f of await $.fs.list(`${DATA}\\${dir}`))
          if (f.kind === 'file') await $.fs.write(`${DATA}\\${dir}\\${f.name}`, '')
    if (await $.fs.exists(FORMULATION_EXPORT)) await $.fs.write(FORMULATION_EXPORT, '')
    await saveRecord($, emptyRecord())
    await setActive($, false)
    return { text: 'Your CBT self-help record has been erased.' }
  })

  // One hook serves the plugin's tools and, during a session, blocks every
  // tool except reading the knowledge base.
  on('tool.call', async ($, e, next) => {
    const args = e as any
    const tool = String(e.tool)

    if (tool === TOOL('record_read')) {
      const rec = await loadRecord($)
      if (rec.sessions.length === 0 && !rec.formulation && Object.keys(rec.profile).length === 0)
        return { result: 'No record yet: this is the first session.' }
      const topics: string[] = []
      for (const t of rec.topics ?? []) {
        const path = `${DATA}\\topics\\${t.slug}.md`
        if (await $.fs.exists(path)) topics.push(`=== topics\\${t.slug}.md ===\n${String(await $.fs.read(path))}`)
      }
      return {
        result: [JSON.stringify({ ...rec, topics: undefined }, null, 2), '', 'TOPIC PAGES', ...topics].join('\n'),
      }
    }

    if (tool === TOOL('topic_write')) {
      const slug = String(args.slug ?? '')
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 60)
        return { deny: 'slug must be lowercase letters, digits and hyphens, for example work-stress.' }
      const concepts: string[] = args.concepts ?? []
      if (concepts.length) {
        const vocab = await loadVocab($)
        const unknown = concepts.filter(c => !vocab.labels.has(c))
        if (unknown.length) return { deny: `Not saved: unknown concept ids ${unknown.join(', ')}.` }
      }
      const related: string[] = args.related ?? []
      const sessionsUsed: number[] = args.sessions ?? []
      await $.fs.write(`${DATA}\\topics\\${slug}.md`, [
        '---',
        `id: topics.${slug}`,
        `title: ${q(args.title)}`,
        `summary: ${q(args.summary)}`,
        `concepts: ${list(concepts)}`,
        `sessions: ${list(sessionsUsed.map(n => `session-${pad(n)}`))}`,
        'related:',
        ...related.map(id => `  - {id: ${id}, rel: see-also}`),
        `updated: ${today()}`,
        '---',
        '',
        `# ${args.title}`,
        '',
        String(args.body).trim(),
        '',
      ].join('\n'))
      const rec = await loadRecord($)
      const entry = { slug, title: String(args.title), summary: String(args.summary), updated: today() }
      rec.topics = [...(rec.topics ?? []).filter(t => t.slug !== slug), entry].sort((a, b) => a.slug.localeCompare(b.slug))
      await saveRecord($, rec)
      return { result: `Topic page topics\\${slug}.md saved.` }
    }

    if (tool === TOOL('profile_update')) {
      const rec = await loadRecord($)
      const fields = ['preferred_name', 'goals', 'concerns', 'strengths', 'supports', 'current_care', 'notes']
      for (const f of fields) if (args[f] !== undefined) (rec.profile as any)[f] = args[f]
      await saveRecord($, rec)
      return { result: 'Profile updated.' }
    }

    if (tool === TOOL('formulation_update')) {
      const vocab = await loadVocab($)
      const model = vocab.models.get(args.model_id)
      if (!model) return { deny: `Unknown formulation model "${args.model_id}". Use an id from _vocab/formulation-models.json.` }
      const slotIds = new Set(model.slots.map(s => s.id))
      const problems: string[] = []
      for (const s of args.slots ?? []) {
        if (!slotIds.has(s.slot)) problems.push(`slot "${s.slot}" is not in ${model.id} (slots: ${[...slotIds].join(', ')})`)
        for (const c of s.concepts ?? []) if (!vocab.labels.has(c.id)) problems.push(`unknown concept "${c.id}"`)
      }
      if (problems.length) return { deny: `Not saved: ${problems.join('; ')}.` }
      const rec = await loadRecord($)
      const fresh = !rec.formulation || rec.formulation.model_id !== model.id
      const slots: Record<string, Slot> = fresh ? {} : { ...rec.formulation!.slots }
      for (const s of args.slots ?? [])
        slots[s.slot] = {
          concepts: (s.concepts ?? []).map((c: any) => ({ id: c.id, rating: typeof c.rating === 'number' ? c.rating : null })),
          free_text: s.free_text ?? slots[s.slot]?.free_text ?? '',
        }
      rec.formulation = { model_id: model.id, slots, updated: today() }
      await saveRecord($, rec)
      return { result: `Formulation saved (${model.label}).` }
    }

    if (tool === TOOL('session_note') || tool === TOOL('session_close')) {
      const rec = await loadRecord($)
      const current = [...rec.sessions].reverse().find(s => s.status === 'open')
      if (!current) return { deny: 'No session is open. The person starts one with /cbt-session.' }
      for (const k of ['mood', 'phq9', 'gad7'] as const) if (typeof args[k] === 'number') current[k] = args[k]
      for (const k of ['agenda', 'homework_review', 'summary', 'homework', 'feedback', 'risk_note'] as const)
        if (typeof args[k] === 'string') current[k] = args[k]
      if (args.risk_screened === true) current.risk_screened = true
      if (args.risk_flag === true) current.risk_flag = true
      for (const t of args.techniques ?? []) if (!current.techniques.includes(t)) current.techniques.push(t)
      for (const p of args.pages_used ?? []) if (!current.pages_used.includes(p)) current.pages_used.push(p)
      if (args.concepts?.length) {
        const vocab = await loadVocab($)
        const unknown = args.concepts.filter((c: string) => !vocab.labels.has(c))
        if (unknown.length) return { deny: `Not saved: unknown concept ids ${unknown.join(', ')}.` }
        current.concepts = current.concepts ?? []
        for (const c of args.concepts) if (!current.concepts.includes(c)) current.concepts.push(c)
      }
      if (typeof args.note === 'string' && args.note.trim())
        current.notes.push({ time: new Date().toISOString().slice(11, 16), text: args.note.trim() })
      if (tool === TOOL('session_close')) {
        current.status = 'closed'
        await saveRecord($, rec)
        await setActive($, false)
        return { result: `Session ${current.number} closed and saved. Session mode is now off.` }
      }
      await saveRecord($, rec)
      return { result: `Saved to session ${current.number}.` }
    }

    if (!(await read($, active))) return next(e)

    // During a session: knowledge base reading only.
    const allowedRoots = [KG, DATA, $.plugin.root]
    const target: string | undefined =
      tool === 'Read' ? args.file_path : tool === 'Grep' || tool === 'Glob' ? args.path : undefined
    if (tool === 'ToolSearch') return next(e)
    if ((tool === 'Read' || tool === 'Grep' || tool === 'Glob') && target && allowedRoots.some(r => isInside(target, r)))
      return next(e)
    if ((tool === 'Grep' || tool === 'Glob') && !target)
      return { deny: `During a CBT self-help session, give a path inside ${KG}.` }
    return {
      deny: `${PLUGIN}: during a CBT self-help session only the knowledge base can be read and the session record saved. End the session (save it) before other work.`,
    }
  }).catch(($, e, next) =>
    next.called ? next(e) : { deny: `${PLUGIN}: the session guard failed, so this call was refused.` },
  )
}
