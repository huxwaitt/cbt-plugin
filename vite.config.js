import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const read = p => readFileSync(resolve(root, p), 'utf8')
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// The small subset of Markdown that protocol.md uses, so its sections can be
// shown on the page exactly as the plugin ships them.
function markdown(text) {
  const inline = s =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
  const out = []
  let para = []
  let list = null
  const flushPara = () => {
    if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`)
    para = []
  }
  const flushList = () => {
    if (list) out.push(`<${list.tag}>${list.items.map(i => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`)
    list = null
  }
  for (const line of text.split('\n')) {
    const item = line.match(/^(\d+\.|-)\s+(.*)$/)
    if (item) {
      flushPara()
      const tag = item[1] === '-' ? 'ul' : 'ol'
      if (list && list.tag !== tag) flushList()
      list ??= { tag, items: [] }
      list.items.push(item[2])
    } else if (/^\s{2,}\S/.test(line) && list) {
      list.items[list.items.length - 1] += ` ${line.trim()}`
    } else if (line.trim() === '') {
      flushPara()
      flushList()
    } else {
      flushList()
      para.push(line.trim())
    }
  }
  flushPara()
  flushList()
  return out.join('\n')
}

// <!-- @nav home -->, <!-- @footer -->, <!-- @protocol <section id> -->,
// <!-- @excerpt <name> -->, <!-- @record <id> -->, {{n:pages}} and {{lines:<page file>}} are filled in
// at build time, so the three pages share one nav and footer, and every figure
// and quoted passage comes from the generated data.
function partials() {
  const counts = () => {
    const c = JSON.parse(read('src/data/kb-core.json')).counts
    const protocol = JSON.parse(read('src/data/protocol.json')).sections
    return {
      ...c,
      pagesAll: c.pages + c.pitfalls,
      protocolSections: protocol.length,
      steps: JSON.parse(read('src/data/session.json')).steps.length,
    }
  }
  return {
    name: 'cbt-partials',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const n = counts()
        const sections = JSON.parse(read('src/data/protocol.json')).sections
        const excerpts = JSON.parse(read('src/data/excerpts.json'))
        const excerpt = name => {
          if (!(name in excerpts)) throw new Error(`No excerpt "${name}"`)
          return excerpts[name]
        }
        return html
          .replace(/<!--\s*@nav\s+(\w+)\s*-->/g, (_, current) =>
            read('src/partials/nav.html').replace(
              new RegExp(`data-page="${current}"`),
              `data-page="${current}" aria-current="page"`,
            ),
          )
          .replace(/<!--\s*@footer\s*-->/g, () => read('src/partials/footer.html'))
          .replace(/<!--\s*@protocol\s+([\w.-]+)\s*-->/g, (_, id) => {
            const section = sections.find(s => s.id === `protocol.${id}`)
            if (!section) throw new Error(`No protocol section "${id}"`)
            return markdown(section.text)
          })
          // <!-- @excerpt notice 4 --> gives the first four lines; {{rest:notice:4}} counts the others
          .replace(/<!--\s*@excerpt\s+([\w.-]+)(?:\s+(\d+))?\s*-->/g, (_, name, head) => {
            const text = excerpt(name)
            return esc(head ? text.split('\n').slice(0, Number(head)).join('\n') : text)
          })
          .replace(/\{\{rest:([\w.-]+):(\d+)\}\}/g, (_, name, head) => String(excerpt(name).split('\n').length - Number(head)))
          .replace(/\{\{lines:([\w./-]+)\}\}/g, (_, file) => {
            const page = Object.values(JSON.parse(read('src/data/kb-detail.json')).pages).find(p => p.f === file)
            if (!page) throw new Error(`No knowledge base page at "${file}"`)
            return String(page.ln)
          })
          .replace(/<!--\s*@record\s+([\w.-]+)\s*-->/g, (_, id) => {
            const file = JSON.parse(read('src/data/session.json')).record.find(r => r.id === id)
            if (!file) throw new Error(`No record file "${id}"`)
            return esc(file.preview)
          })
          .replace(/\{\{n:(\w+)\}\}/g, (_, key) => {
            if (!(key in n)) throw new Error(`No count "${key}"`)
            return n[key].toLocaleString('en-US')
          })
      },
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [partials()],
  build: {
    target: 'es2022',
    // three.js and the knowledge base data are large by nature and load lazily.
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      input: {
        home: resolve(root, 'index.html'),
        features: resolve(root, 'features.html'),
        safety: resolve(root, 'safety.html'),
      },
    },
  },
})
