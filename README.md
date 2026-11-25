# cbt-plugin-frontend

The website for [cbt-self-help](https://github.com/huxwaitt/cbt-plugin), a Claude Code plugin that runs guided CBT self-help sessions from a researched knowledge base. The plugin is self-help software. It is not therapy.

Three pages, built as a static site:

| Page | File | What it shows |
|---|---|---|
| Sessions | `index.html` | Sample session transcripts, a 3D map of what each turn reads in the knowledge base and writes to the record, where the record is stored, and how to install |
| Features | `features.html` | The knowledge base, the record and the techniques, each shown as the file behind it |
| Licensing and safety | `safety.html` | The notice, the safety protocol word for word, the limits enforced in code, and the licenses |

## Run it

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # writes dist/
npm run preview  # serves dist/
```

`dist/` is plain static files with relative paths, so it can be served from any folder or host.

## Where the content comes from

Nothing about the plugin is typed into the pages by hand where it can be read from the plugin instead. `scripts/build-kb-data.mjs` reads a checkout of the plugin and writes `src/data/`:

| File | Holds |
|---|---|
| `kb-core.json` | Ids, labels and links for every domain, page, concept, model and source: what the map draws |
| `kb-detail.json` | Summaries, bottom lines, definitions and source lines: what the inspector shows |
| `protocol.json` | `protocol.md` split into its sections, word for word |
| `excerpts.json` | The session notice, the refusal messages, one page head and one vocabulary entry, word for word |

Regenerate them after the plugin changes:

```sh
npm run data -- --plugin ../cbt-plugin
```

The same script checks `src/data/session.json`, the sample session the map plays. Every id it names must exist in the plugin, and every rule it quotes must appear in `protocol.md`, or the script fails.

At build time `vite.config.js` fills a few markers in the HTML from that data: `<!-- @protocol <section> -->`, `<!-- @excerpt <name> -->`, `<!-- @record <id> -->` and `{{n:pages}}` style counts. The nav and footer are shared partials in `src/partials/`.

## Layout

```
index.html  features.html  safety.html
src/
  styles/   tokens.css (the palette, type and spacing), base.css, site.css
  js/       main.js, switch.js (tabs), chat.js (session playback)
  js/map/   index.js (the instrument), scene.js (three.js), inspector.js (detail cards)
  data/     generated JSON, plus session.json (the sample session, written by hand)
  partials/ nav.html, footer.html
scripts/    build-kb-data.mjs
```

## Notes

- Fonts (Host Grotesk, Atkinson Hyperlegible Mono) and three.js are bundled from npm. The site makes no third-party requests.
- The map loads three.js and the knowledge base data only when it scrolls near the viewport. Without WebGL or JavaScript the same information is in the lists beside it.
- Transcript animations and the map respect `prefers-reduced-motion`.
- The people and conversations on the site are illustrative. File names, ids, quoted rules and refusal messages are the plugin's own.
