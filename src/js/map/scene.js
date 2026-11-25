// The knowledge base drawn as six stacked layers. Every point is a real item
// from the plugin: a protocol section, a domain, a page, a vocabulary concept,
// a cited source or a file in the person's record. A turn of the sample
// session lights the points it used and the links between them.
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const W = 7.8
const D = 5
export const LAYERS = [
  { key: 'protocol', y: 4.5, w: W, d: 1.6 },
  { key: 'router', y: 3.0, w: W, d: D },
  { key: 'pages', y: 1.3, w: W, d: D },
  { key: 'vocab', y: -0.5, w: W, d: D },
  { key: 'sources', y: -2.2, w: W, d: D },
  { key: 'record', y: -4.2, w: 5.6, d: 2.2 },
]
const STAGE = { turn: 0, protocol: 0.1, router: 0.5, pages: 0.9, vocab: 1.3, sources: 1.5, record: 1.8 }
const GOLDEN = Math.PI * (3 - Math.sqrt(5))

// Colors come from the page's own tokens, so the scene and the page cannot drift apart.
function tokenColors() {
  const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  const style = getComputedStyle(document.documentElement)
  const read = name => {
    probe.clearRect(0, 0, 1, 1)
    probe.fillStyle = style.getPropertyValue(name).trim()
    probe.fillRect(0, 0, 1, 1)
    const [r, g, b] = probe.getImageData(0, 0, 1, 1).data
    return new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace)
  }
  return {
    paper2: read('--color-paper-2'),
    paper3: read('--color-paper-3'),
    rule: read('--color-rule'),
    rule2: read('--color-rule-2'),
    muted: read('--color-muted'),
    ink: read('--color-ink'),
    ink2: read('--color-ink-2'),
    cool: read('--color-cool'),
    amber: read('--color-accent'),
  }
}

const VERT = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aAlpha;
  attribute float aRing;
  uniform float uScale;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vRing;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = max(1.5, aSize * uScale / -mv.z);
    vColor = aColor;
    vAlpha = aAlpha;
    vRing = aRing;
  }
`
const FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vRing;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.4, d);
    if (vRing > 0.5) a *= smoothstep(0.26, 0.34, d);
    gl_FragColor = vec4(vColor, vAlpha * a);
    #include <colorspace_fragment>
  }
`

const ease = t => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3)

export function createScene({ canvas, labels, core, session, onHover, onPick }) {
  const colors = tokenColors()
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

  // ---------------------------------------------------------------- nodes
  const nodes = []
  const index = new Map()
  const add = node => {
    node.i = nodes.length
    nodes.push(node)
    index.set(node.id, node)
    return node
  }
  const layerOf = Object.fromEntries(LAYERS.map((l, i) => [l.key, { ...l, i }]))
  const spiral = (cx, cz, k, step) => {
    const r = step * Math.sqrt(k + 0.5)
    const a = k * GOLDEN
    return [cx + r * Math.cos(a), cz + r * Math.sin(a) * 0.86]
  }

  // The turn itself: where a message enters.
  add({ id: 'turn', layer: 'turn', x: 0, y: 5.7, z: 0, size: 3.4, person: true, label: 'This turn' })

  core.protocol.forEach((section, k) => {
    const x = -W / 2 + 0.6 + (k * (W - 1.2)) / (core.protocol.length - 1)
    add({ id: section.id, layer: 'protocol', x, y: layerOf.protocol.y, z: 0, size: 2.6, label: section.t })
  })

  // Pages sit in one cluster per domain; the domain's point hangs above its cluster.
  const cols = 8
  const rows = Math.ceil(core.domains.length / cols)
  const pagesByDomain = new Map(core.domains.map(d => [d.id, []]))
  for (const page of core.pages) pagesByDomain.get(page.dom).push(page)
  core.domains.forEach((domain, k) => {
    const cx = -W / 2 + ((k % cols) + 0.5) * (W / cols)
    const cz = -D / 2 + (Math.floor(k / cols) + 0.5) * (D / rows)
    add({ id: domain.id, layer: 'router', x: cx, y: layerOf.router.y, z: cz, size: 2.4, label: domain.l })
    pagesByDomain.get(domain.id).forEach((page, j) => {
      const [x, z] = spiral(cx, cz, j, 0.105)
      add({
        id: page.id,
        layer: 'pages',
        x,
        y: layerOf.pages.y,
        z,
        size: page.ty === 'pitfall' ? 1.4 : 1.9,
        dim: page.ty === 'pitfall',
        label: page.id,
      })
    })
  })

  // Vocabulary: one cluster per scheme, plus the formulation models.
  const groups = [...core.schemes.map(s => ({ key: s.p, items: [] })), { key: 'fm', items: core.models }]
  const byPrefix = new Map(groups.map(g => [g.key, g]))
  for (const concept of core.concepts) byPrefix.get(concept.id.split('.')[0]).items.push(concept)
  const vcols = 8
  const vrows = Math.ceil(groups.length / vcols)
  groups.forEach((group, k) => {
    const cx = -W / 2 + ((k % vcols) + 0.5) * (W / vcols)
    const cz = -D / 2 + (Math.floor(k / vcols) + 0.5) * (D / vrows)
    group.items.forEach((item, j) => {
      const [x, z] = spiral(cx, cz, j, 0.062)
      add({ id: item.id, layer: 'vocab', x, y: layerOf.vocab.y, z, size: 1.35, label: item.id })
    })
  })

  // Sources: an even field, sorted by kind.
  const sorted = [...core.sources].sort((a, b) => a[1].localeCompare(b[1]) || a[0].localeCompare(b[0]))
  const scols = 58
  const srows = Math.ceil(sorted.length / scols)
  sorted.forEach(([key], k) => {
    const x = -W / 2 + 0.15 + ((k % scols) / (scols - 1)) * (W - 0.3)
    const z = -D / 2 + 0.15 + (Math.floor(k / scols) / (srows - 1)) * (D - 0.3)
    add({ id: `src:${key}`, layer: 'sources', x, y: layerOf.sources.y, z, size: 0.95, dim: true, label: key })
  })

  // The person's record: a small plate of files beneath the stack.
  session.record.forEach((file, k) => {
    const per = Math.ceil(session.record.length / 2)
    const x = -layerOf.record.w / 2 + 0.6 + ((k % per) * (layerOf.record.w - 1.2)) / (per - 1)
    const z = k < per ? -0.45 : 0.45
    add({ id: file.id, layer: 'record', x, y: layerOf.record.y, z, size: 2.4, person: true, label: file.file })
  })

  // Reverse links, used when a point is hovered.
  const pagesOfConcept = new Map()
  const pagesOfSource = new Map()
  for (const page of core.pages) {
    for (const c of page.c) (pagesOfConcept.get(c) ?? pagesOfConcept.set(c, []).get(c)).push(page.id)
    for (const s of page.sk) (pagesOfSource.get(s) ?? pagesOfSource.set(s, []).get(s)).push(page.id)
  }
  const pageById = new Map(core.pages.map(p => [p.id, p]))
  const modelById = new Map(core.models.map(m => [m.id, m]))

  // ---------------------------------------------------------------- three
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 200)
  const target = new THREE.Vector3(0, 0.55, 0)
  const AZIMUTH = 0.5
  const POLAR = 1.18

  const N = nodes.length
  const position = new Float32Array(N * 3)
  const aSize = new Float32Array(N)
  const aColor = new Float32Array(N * 3)
  const aAlpha = new Float32Array(N)
  const aRing = new Float32Array(N)
  nodes.forEach(n => position.set([n.x, n.y, n.z], n.i * 3))

  const pointMaterial = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: { uScale: { value: 1 } },
    transparent: true,
    depthTest: false,
    depthWrite: false,
  })
  const lineMaterial = () =>
    new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthTest: false, depthWrite: false })

  // Nodes were added layer by layer, so each layer is one contiguous run.
  const runs = {}
  nodes.forEach(n => {
    runs[n.layer] ??= { start: n.i, count: 0 }
    runs[n.layer].count++
  })
  const pointSets = []
  const makePoints = (key, order) => {
    const { start, count } = runs[key]
    const geometry = new THREE.BufferGeometry()
    const attr = (name, array, size) =>
      geometry.setAttribute(name, new THREE.BufferAttribute(array.subarray(start * size, (start + count) * size), size))
    attr('position', position, 3)
    attr('aSize', aSize, 1)
    attr('aColor', aColor, 3)
    attr('aAlpha', aAlpha, 1)
    attr('aRing', aRing, 1)
    const points = new THREE.Points(geometry, pointMaterial)
    points.frustumCulled = false
    points.renderOrder = order
    scene.add(points)
    pointSets.push(geometry)
  }

  // Bottom layers draw first, so each plate dims what lies beneath it.
  ;[...LAYERS].reverse().forEach((layer, k) => {
    const order = k * 10
    const person = layer.key === 'record'
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(layer.w, layer.d),
      new THREE.MeshBasicMaterial({
        color: colors.paper2,
        transparent: true,
        opacity: 0.55,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    )
    plate.rotation.x = -Math.PI / 2
    plate.position.y = layer.y
    plate.renderOrder = order
    scene.add(plate)
    const hw = layer.w / 2
    const hd = layer.d / 2
    const edge = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(
        [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd], [-hw, -hd]].map(([x, z]) => new THREE.Vector3(x, layer.y, z)),
      ),
      new THREE.LineBasicMaterial({ color: person ? colors.amber : colors.rule2, transparent: true, opacity: person ? 0.55 : 1, depthTest: false }),
    )
    edge.renderOrder = order + 1
    scene.add(edge)
    makePoints(layer.key, order + 3)
    layer.order = order
  })
  makePoints('turn', 70)

  // Faint fans from each domain to its pages: the structure of the router.
  {
    const verts = []
    for (const page of core.pages) {
      const a = index.get(page.dom)
      const b = index.get(page.id)
      verts.push(a.x, a.y, a.z, b.x, b.y, b.z)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3))
    const fans = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({ color: colors.rule, transparent: true, opacity: 0.55, depthTest: false }),
    )
    fans.renderOrder = 35
    scene.add(fans)
  }

  // Lines for the current turn and for the hovered point are rebuilt in place.
  const MAX_SEG = 1400
  const makeLines = order => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_SEG * 6), 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_SEG * 6), 3))
    geometry.setDrawRange(0, 0)
    const lines = new THREE.LineSegments(geometry, lineMaterial())
    lines.frustumCulled = false
    lines.renderOrder = order
    scene.add(lines)
    return geometry
  }
  const turnLines = makeLines(80)
  const hoverLines = makeLines(85)

  // Pulses that travel along the turn's lines.
  const MAX_PULSE = 160
  const pulseGeometry = new THREE.BufferGeometry()
  const pulsePos = new Float32Array(MAX_PULSE * 3)
  const pulseColor = new Float32Array(MAX_PULSE * 3)
  const pulseAlpha = new Float32Array(MAX_PULSE)
  pulseGeometry.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3))
  pulseGeometry.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(MAX_PULSE).fill(1.5), 1))
  pulseGeometry.setAttribute('aColor', new THREE.BufferAttribute(pulseColor, 3))
  pulseGeometry.setAttribute('aAlpha', new THREE.BufferAttribute(pulseAlpha, 1))
  pulseGeometry.setAttribute('aRing', new THREE.BufferAttribute(new Float32Array(MAX_PULSE), 1))
  pulseGeometry.setDrawRange(0, 0)
  const pulses = new THREE.Points(pulseGeometry, pointMaterial)
  pulses.frustumCulled = false
  pulses.renderOrder = 90
  scene.add(pulses)

  const controls = new OrbitControls(camera, canvas)
  controls.enableZoom = false
  controls.enablePan = false
  controls.enableDamping = true
  controls.dampingFactor = 0.09
  controls.rotateSpeed = 0.5
  controls.minAzimuthAngle = AZIMUTH - 0.75
  controls.maxAzimuthAngle = AZIMUTH + 0.75
  controls.minPolarAngle = 0.85
  controls.maxPolarAngle = 1.42
  controls.target.copy(target)
  canvas.style.touchAction = 'pan-y' // a vertical swipe still scrolls the page

  // ---------------------------------------------------------------- state
  const from = new Float32Array(N) // intensity each point is leaving
  const to = new Float32Array(N) // intensity each point is heading for
  const at = new Float32Array(N) // seconds into the turn at which it changes
  const ring = new Uint8Array(N)
  let turnEdges = []
  let clock = 0
  let turnLength = 0
  let hovered = null
  let hot = null // highlighted from the list
  let running = false
  let lastFrame = 0
  let awakeUntil = 0

  const idle = node => {
    if (node.person) return [colors.amber, node.layer === 'turn' ? 0.9 : 0.5]
    if (node.layer === 'protocol' || node.layer === 'router') return [colors.muted, 0.75]
    if (node.dim) return [colors.rule2, 0.8]
    return [colors.muted, 0.72]
  }
  const paint = () => {
    const tmp = new THREE.Color()
    for (const node of nodes) {
      const i = node.i
      const v = from[i] + (to[i] - from[i]) * ease((clock - at[i]) / 0.45)
      const [base, baseAlpha] = idle(node)
      const lit = node.person ? colors.amber : colors.cool
      tmp.copy(base).lerp(lit, Math.min(1, v * 1.4))
      const emphasis = node === hovered || node === hot ? 1.5 : 1
      aColor.set([tmp.r, tmp.g, tmp.b], i * 3)
      aAlpha[i] = baseAlpha + (1 - baseAlpha) * Math.min(1, v * 1.6)
      aSize[i] = node.size * (1 + 1.5 * v) * emphasis
      aRing[i] = ring[i] && v > 0.5 ? 1 : 0
    }
    for (const geometry of pointSets)
      for (const name of ['aColor', 'aAlpha', 'aSize', 'aRing']) geometry.attributes[name].needsUpdate = true
  }

  const writeLines = (geometry, edges, time) => {
    const pos = geometry.attributes.position.array
    const col = geometry.attributes.color.array
    const count = Math.min(edges.length, MAX_SEG)
    for (let k = 0; k < count; k++) {
      const e = edges[k]
      const v = time === null ? 1 : ease((time - e.delay) / 0.5)
      const c = e.person ? colors.amber : colors.cool
      const s = v * e.strength
      pos.set([e.a.x, e.a.y, e.a.z, e.b.x, e.b.y, e.b.z], k * 6)
      // Faded by mixing toward the ground, so a faint line never glows.
      for (const o of [0, 3])
        col.set(
          [
            colors.paper3.r + (c.r - colors.paper3.r) * s,
            colors.paper3.g + (c.g - colors.paper3.g) * s,
            colors.paper3.b + (c.b - colors.paper3.b) * s,
          ],
          k * 6 + o,
        )
    }
    geometry.setDrawRange(0, count * 2)
    geometry.attributes.position.needsUpdate = true
    geometry.attributes.color.needsUpdate = true
  }

  const writePulses = () => {
    let n = 0
    for (const e of turnEdges) {
      if (n >= MAX_PULSE || !e.pulse) continue
      const t = (clock - e.delay) / 0.55
      if (t <= 0 || t >= 1) continue
      const k = ease(t)
      pulsePos.set([e.a.x + (e.b.x - e.a.x) * k, e.a.y + (e.b.y - e.a.y) * k, e.a.z + (e.b.z - e.a.z) * k], n * 3)
      const c = e.person ? colors.amber : colors.cool
      pulseColor.set([c.r, c.g, c.b], n * 3)
      pulseAlpha[n] = Math.sin(Math.PI * t)
      n++
    }
    pulseGeometry.setDrawRange(0, n)
    pulseGeometry.attributes.position.needsUpdate = true
    pulseGeometry.attributes.aColor.needsUpdate = true
    pulseGeometry.attributes.aAlpha.needsUpdate = true
  }

  // ---------------------------------------------------------------- a turn
  function setStep(stepIndex, { animate = true } = {}) {
    const step = session.steps[stepIndex]
    // Settle where everything is now, then set new targets.
    for (let i = 0; i < N; i++) {
      from[i] = from[i] + (to[i] - from[i]) * ease((clock - at[i]) / 0.45)
      to[i] = 0
      at[i] = 0
      ring[i] = 0
    }
    const edges = []
    const edge = (a, b, delay, strength, person = false, pulse = true) => {
      const na = index.get(a)
      const nb = index.get(b)
      if (na && nb) edges.push({ a: na, b: nb, delay, strength, person, pulse })
    }
    const light = (id, value, when) => {
      const node = index.get(id)
      if (!node) return
      if (value > to[node.i]) {
        to[node.i] = value
        at[node.i] = when
      }
    }
    const active = step.activates
    const has = id => active.some(a => a.id === id)
    light('turn', 1, 0)

    const context = active.filter(a => a.layer === 'protocol')
    for (const a of context) {
      light(a.id, 1, STAGE.protocol + 0.35)
      edge('turn', a.id, STAGE.turn, 0.9, true)
    }
    const hub = has('protocol.the-knowledge-base') ? 'protocol.the-knowledge-base' : context[0]?.id
    for (const a of active.filter(a => a.layer === 'router')) {
      light(a.id, 1, STAGE.router + 0.4)
      if (a.how === 'armed') ring[index.get(a.id).i] = 1
      if (hub) edge(hub, a.id, STAGE.router, a.how === 'armed' ? 0.4 : 0.85, false, a.how !== 'armed')
    }
    for (const a of active.filter(a => a.layer === 'pages')) {
      const page = pageById.get(a.id)
      light(a.id, 1, STAGE.pages + 0.4)
      if (a.how === 'armed') ring[index.get(a.id).i] = 1
      edge(page.dom, a.id, STAGE.pages, a.how === 'armed' ? 0.4 : 0.9, false, a.how !== 'armed')
      light(page.dom, 0.55, STAGE.router + 0.4)
      if (a.how !== 'read') continue
      // What a page that was read brings with it: its concepts and its sources.
      for (const c of page.c) {
        light(c, 0.42, STAGE.vocab + 0.45)
        edge(a.id, c, STAGE.vocab, 0.2, false, false)
      }
      for (const s of page.sk) {
        light(`src:${s}`, 0.5, STAGE.sources + 0.45)
        edge(a.id, `src:${s}`, STAGE.sources, 0.12, false, false)
      }
    }
    for (const a of active.filter(a => a.layer === 'vocab')) {
      light(a.id, 1, STAGE.vocab + 0.5)
      const model = modelById.get(a.id)
      if (model && has(model.page)) edge(model.page, a.id, STAGE.vocab, 0.8)
    }
    for (const a of active.filter(a => a.layer === 'record')) {
      light(a.id, 1, STAGE.record + 0.3)
      // A read comes up from the file as a faint cool line, the way other reads are drawn.
      if (a.how === 'recordRead') edge(a.id, 'turn', STAGE.record - 0.6, 0.3, false)
      // A write is drawn as the turn sending something down into the file:
      // a firm amber line, with three pulses following each other along it.
      if (a.how === 'written')
        for (const k of [0, 1, 2]) edge('turn', a.id, STAGE.record + k * 0.22, 0.95, true)
      for (const linked of a.links ?? []) edge(a.id, linked, STAGE.record, 0.8, true)
    }

    turnEdges = edges
    turnLength = STAGE.record + 1.6
    clock = animate && !reduce ? 0 : turnLength + 1
    render()
    if (animate && !reduce) wake(turnLength + 0.8)
  }

  // ---------------------------------------------------------------- hover
  function linksOf(node) {
    const out = []
    const link = (id, strength = 0.75) => {
      const other = index.get(id)
      if (other) out.push({ a: node, b: other, delay: 0, strength, person: node.person })
    }
    if (node.layer === 'pages') {
      const page = pageById.get(node.id)
      link(page.dom, 0.9)
      page.c.forEach(c => link(c))
      page.sk.forEach(s => link(`src:${s}`, 0.6))
      page.rel.forEach(([id]) => link(id, 0.5))
    } else if (node.layer === 'router') {
      for (const page of pagesByDomain.get(node.id)) link(page.id, 0.6)
    } else if (node.layer === 'vocab') {
      const model = modelById.get(node.id)
      if (model) link(model.page, 0.9)
      for (const id of pagesOfConcept.get(node.id) ?? []) link(id)
    } else if (node.layer === 'sources') {
      for (const id of pagesOfSource.get(node.id.slice(4)) ?? []) link(id, 0.9)
    } else if (node.layer === 'record') {
      for (const e of turnEdges) if (e.a === node) out.push({ ...e, delay: 0, strength: 1 })
    }
    return out
  }
  function showLinks() {
    const node = hovered ?? hot
    writeLines(hoverLines, node ? linksOf(node) : [], null)
  }

  // ---------------------------------------------------------------- picking
  const projected = new Float32Array(N * 2)
  const v = new THREE.Vector3()
  let width = 1
  let height = 1
  const project = () => {
    for (const node of nodes) {
      v.set(node.x, node.y, node.z).project(camera)
      projected[node.i * 2] = (v.x * 0.5 + 0.5) * width
      projected[node.i * 2 + 1] = (-v.y * 0.5 + 0.5) * height
    }
  }
  const pick = (x, y, wide = 1) => {
    let best = null
    let bestScore = Infinity
    for (const node of nodes) {
      const dx = projected[node.i * 2] - x
      const dy = projected[node.i * 2 + 1] - y
      const d = Math.hypot(dx, dy)
      const lit = to[node.i] >= 1
      const reach = (lit ? 20 : to[node.i] > 0 ? 12 : node.layer === 'sources' ? 5 : 8) * wide
      if (d > reach) continue
      const score = d / reach - (lit ? 1 : 0) // a lit point wins over its neighbors
      if (score < bestScore) {
        bestScore = score
        best = node
      }
    }
    return best
  }
  const setHovered = node => {
    if (node === hovered) return
    hovered = node
    canvas.classList.toggle('is-over', Boolean(node))
    showLinks()
    onHover?.(node ? node.id : null)
    render()
  }
  let down = null
  canvas.addEventListener('pointermove', event => {
    const rect = canvas.getBoundingClientRect()
    if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) down.moved = true
    if (event.buttons === 0 || event.pointerType !== 'mouse') project()
    if (event.buttons === 0) setHovered(pick(event.clientX - rect.left, event.clientY - rect.top))
  })
  canvas.addEventListener('pointerleave', () => setHovered(null))
  canvas.addEventListener('pointerdown', event => {
    down = { x: event.clientX, y: event.clientY, moved: false }
  })
  canvas.addEventListener('pointerup', event => {
    const rect = canvas.getBoundingClientRect()
    if (down && !down.moved) {
      project()
      const node = pick(event.clientX - rect.left, event.clientY - rect.top, event.pointerType === 'mouse' ? 1 : 1.8)
      if (node) onPick?.(node.id)
      if (event.pointerType !== 'mouse') setHovered(node)
    }
    down = null
  })
  controls.addEventListener('start', () => wake(60))
  controls.addEventListener('end', () => wake(1.2))
  controls.addEventListener('change', () => wake(0.3))

  // ---------------------------------------------------------------- labels
  const layerLabels = LAYERS.map(layer => {
    const el = labels.querySelector(`[data-layer="${layer.key}"]`)
    return { el, anchor: new THREE.Vector3(-layer.w / 2, layer.y, layer.d / 2) }
  })
  layerLabels.push({ el: labels.querySelector('[data-layer="turn"]'), anchor: new THREE.Vector3(0.25, 5.95, 0) })
  const nodeLabel = labels.querySelector('[data-node-label]')
  const placeLabels = () => {
    for (const { el, anchor } of layerLabels) {
      if (!el) continue
      v.copy(anchor).project(camera)
      const x = (v.x * 0.5 + 0.5) * width
      const y = (-v.y * 0.5 + 0.5) * height
      el.style.transform = `translate(${Math.max(8, Math.round(x))}px, ${Math.round(y + 6)}px)`
    }
    const found = hovered ?? hot
    const node = found && found.id !== 'turn' ? found : null // the turn already carries a label
    nodeLabel.hidden = !node
    if (node) {
      v.set(node.x, node.y, node.z).project(camera)
      const x = (v.x * 0.5 + 0.5) * width
      const y = (-v.y * 0.5 + 0.5) * height
      nodeLabel.textContent = node.label
      const w = nodeLabel.offsetWidth
      const lx = Math.min(Math.max(6, x - w / 2), width - w - 6)
      nodeLabel.style.transform = `translate(${Math.round(lx)}px, ${Math.round(y - 34)}px)`
    }
  }

  // ---------------------------------------------------------------- frames
  // The stack is framed by its own corners: pull back until they fit, then
  // center them, leaving room at the foot for the legend.
  const corners = [new THREE.Vector3(0, 5.7, 0)]
  for (const layer of LAYERS)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) corners.push(new THREE.Vector3((sx * layer.w) / 2, layer.y, (sz * layer.d) / 2))
  function fit() {
    const offset = new THREE.Vector3()
    const up = new THREE.Vector3()
    const right = new THREE.Vector3()
    for (let pass = 0; pass < 10; pass++) {
      camera.lookAt(controls.target)
      camera.updateMatrixWorld()
      camera.updateProjectionMatrix()
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      for (const corner of corners) {
        v.copy(corner).project(camera)
        minX = Math.min(minX, v.x)
        maxX = Math.max(maxX, v.x)
        minY = Math.min(minY, v.y)
        maxY = Math.max(maxY, v.y)
      }
      offset.subVectors(camera.position, controls.target)
      const distance = offset.length()
      const scale = Math.max((maxX - minX) / 2 / 0.9, (maxY - minY) / 2 / 0.8)
      const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance
      right.setFromMatrixColumn(camera.matrixWorld, 0)
      up.setFromMatrixColumn(camera.matrixWorld, 1)
      controls.target.addScaledVector(right, ((minX + maxX) / 2) * halfH * camera.aspect)
      controls.target.addScaledVector(up, ((minY + maxY) / 2 - 0.06) * halfH)
      camera.position.copy(controls.target).add(offset.multiplyScalar(scale))
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect()
    width = Math.max(1, rect.width)
    height = Math.max(1, rect.height)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    fit()
    pointMaterial.uniforms.uScale.value = (height * renderer.getPixelRatio()) / 17
    render()
  }

  function render() {
    controls.update()
    paint()
    writeLines(turnLines, turnEdges, clock)
    writePulses()
    renderer.render(scene, camera)
    placeLabels()
  }
  function frame(now) {
    if (!running) return
    const dt = Math.min(0.05, (now - lastFrame) / 1000)
    lastFrame = now
    clock += dt
    render()
    if (now < awakeUntil) requestAnimationFrame(frame)
    else running = false
  }
  // Frames are drawn only while something is moving.
  function wake(seconds) {
    awakeUntil = Math.max(awakeUntil, performance.now() + seconds * 1000)
    if (running) return
    running = true
    lastFrame = performance.now()
    requestAnimationFrame(frame)
  }

  camera.position.setFromSphericalCoords(1, POLAR, AZIMUTH).add(target)
  resize()
  new ResizeObserver(resize).observe(canvas)

  return {
    setStep,
    resize,
    has: id => index.has(id),
    highlight(id) {
      hot = id ? (index.get(id) ?? null) : null
      showLinks()
      render()
    },
  }
}
