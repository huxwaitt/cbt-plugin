# _tools: validator and generator

`validate.ps1` checks the wiki against its contract, `_schema.md`, and with `-WriteCatalog` writes the
generated files. It needs PowerShell 7.2 or later and nothing else (no modules, no YAML library).

## Usage

```powershell
pwsh -NoProfile -File _tools\validate.ps1                 # check the wiki this folder belongs to
pwsh -NoProfile -File _tools\validate.ps1 -Root D:\copy    # check another copy
pwsh -NoProfile -File _tools\validate.ps1 -WriteCatalog    # check, then write the generated files
pwsh -NoProfile -File _tools\tests\run-tests.ps1           # self-test against the fixtures
```

`-Root` defaults to the parent of the `_tools` folder. All files are read and written as UTF-8. Generated
files are written without a BOM, and only when their content changes.

## Output and exit code

One line per issue, `CATEGORY | relative path | message`, grouped STRUCTURE, PAGE, VOCAB, STYLE. Then
exactly these lines:

```
domains: N  pages: N  pitfalls: N  concepts: N  models: N  sources: N
structure issues: N
page issues: N
vocab issues: N
style warnings: N
```

- `domains` counts domains plus leaves (each folder with its own `_index.md`). Containers are not counted.
- `pages` counts page files that are not pitfalls. `pitfalls` counts `pitfall-*.md` files.
- `concepts` counts concepts in all concept schemes, deprecated ones included. `models` counts the
  formulation models. `sources` counts the keys in `_sources.md`.

Exit code: **1** if there are any structure or vocab issues, otherwise **0**. Page issues and style
warnings never change the exit code. Exit code 2 means the root folder does not exist.

## What it reads from the contract

Nothing that the contract defines is hardcoded. Each run reads `<root>\_schema.md`:

| Read from | Used for |
|---|---|
| fenced blocks `vocab-type`, `vocab-depth`, `vocab-stage`, `vocab-topics`, `vocab-rel` | allowed frontmatter values |
| fenced block `vocab-schemes` (`prefix file` lines) | which `_vocab` files must exist, and their prefixes |
| fenced block `vocab-canonical` (`canonical \| avoid forms` lines) | style warnings |
| section 4 yaml example | frontmatter key order, and whether each key is a scalar, flow list or block list |
| section 7 bullets | required body headings for each page type |
| section 8 | domain index headings (from the markdown example), leaf headings and router headings (from the backticked `## ...` names) |

If a block or section cannot be found, that becomes a STRUCTURE issue on `_schema.md`. A page type in
`vocab-type` that has no heading template in section 7 is a STRUCTURE issue too.

The tool's own settings sit at the top of the script: the required top-level files, the body word range
(250 to 1100; the schema's target is 300 to 900), the 30-word summary limit and the glossary markers.

## Checks

### STRUCTURE (counts toward exit 1)

- The top-level files `_index.md`, `_schema.md`, `_sources.md`, `_glossary.md`, `_playbook.md`,
  `_overview.md` and `_maintenance.md` exist.
- Every `NN-*` folder is a domain (it has `_index.md`) or a container. A container holds only leaf folders
  and no files, and each leaf folder has `_index.md`. An empty `NN-*` folder is an issue. Folder names
  are `NN-slug` and leaf names are lowercase slugs.
- A domain or leaf holds only `_index.md` and `.md` pages, with no subfolders. Page file names are
  lowercase letters, digits and hyphens.
- Two leaves with the same folder name would give duplicate page ids. That is an issue.
- Each index has an H1 `# <name>: Title` (`<name>` is `NN-container/leaf` for a leaf) and the section 8
  headings in order. Domains need This stage, Decisions in order, Pages and Pitfalls. Leaves need This
  surface, Pages in order, Pages and Pitfalls.
- Every page file appears exactly once in its folder's index tables, with non-pitfalls under `## Pages`
  and `pitfall-*.md` under `## Pitfalls`. No row names a page that does not exist. Rows are matched by
  the `Page` column, which holds the page id in backticks or as link text.
- The router `_index.md` has the section 8 headings. Its `## Domains` table links every domain and
  leaf exactly once and links nothing else. Links may point to the folder or to its `_index.md`.
- With `-WriteCatalog` only: `_glossary.md` must contain both generated-block markers.

### PAGE (reported, does not change the exit code)

- No em dash (U+2014) and no middle dot (U+00B7) anywhere in the file. The message gives the count and
  the first line number.
- The frontmatter is present and closed. Every key from section 4 is present, no unknown keys, keys in
  section 4 order, no duplicate keys.
- Each value has the right shape (scalar, one-line flow list, or block list; a block list may be `[]`).
  Under the YAML subset, a scalar that contains `: ` or ` #`, or starts with a reserved character, must be
  double-quoted. That applies to block-list items as well.
- `id` is `<folder>.<file>`. `type`, `depth`, `stage` and `topics` take values from the vocab blocks, and
  `stage` and `topics` are not empty. A `pitfall-*.md` file has `type: pitfall`, and only those files do.
- `summary` is at most 30 words. `reviewed` is a real `YYYY-MM-DD` date.
- `sources` entries match `<Key> § <locator>` (one space either side of §), and every Key is in
  `_sources.md`. `Maintainer/YYYY-MM-DD` keys (schema section 9) do not need a row in `_sources.md`.
- `related` items are `{id, rel}` maps. `rel` is in `vocab-rel`, `id` is an existing page, and a page
  does not relate to itself.
- Every `concepts` id exists in `_vocab`. Ids from a scheme file that is missing or broken are skipped,
  since that file already raised a vocab issue.
- The first non-blank body line starts with `**Bottom line:**`.
- The body has 250 to 1100 words. A word is any whitespace-separated token containing a letter or a
  digit, so table pipes, `#` and arrows are not counted.
- The body has the section 7 headings for its type, in order. Other headings may sit in between.
- Every inline citation in the body is a Key in that page's `sources`. A citation is a bracket `[...]`
  that is not a Markdown link. Inside it, each part separated by `;` or `,` is checked if it starts with a
  Key-shaped token: a capital letter followed by hyphenated segments, like `Beck-2021` or `NICE-NG222`, or
  a `Maintainer/date`. So `[Beck-2021; Clark-1986a]` and `[Beck-2021, p. 4]` both count. Code spans are
  ignored.
- The page's index row repeats `summary` (the Summary or Symptom column) and `applies_when` (the Applies
  when column) verbatim after whitespace is normalized, and the Depth column equals `depth`.

### VOCAB (counts toward exit 1)

- Every file in `vocab-schemes` exists and parses as strict JSON. Its `prefix` matches the listed prefix
  and its `scheme` matches the file name.
- Concept ids and model ids are unique across all schemes and are `<prefix>.<slug>`. Each concept has a
  `label` and a `definition`.
- `broader` is null or an id in the same scheme. Every `related` id and every `replaced_by` id exists.
- Formulation models: `rating_types` is an object. Each grid has integer cols and rows. Slot ids are
  unique within a model. Slot `vocab` prefixes are in `vocab-schemes`. `rating` is null or a key of
  `rating_types`. `col` and `row` are integers inside the grid. Link ends are slot ids, and link `style`
  is `solid` or `dashed`. `page` is null or an existing page id, checked only once at least one page
  exists.
- Not checked: the optional `page` field on concepts (for example in measures). These links are not
  validated.

### STYLE (warnings, not issues)

An avoid form from `vocab-canonical` found as a whole word in a page body. Matching ignores case and
allows a plural `s`. A form marked `(alias...)` is skipped, so `thought diary (alias)` gives no warning.
In `case conceptualisation (alias: case conceptualization)`, only the part inside the parentheses is the
alias, so `case conceptualisation` is still warned about. Notes in parentheses, like `(say DSM-5 only
for the 2013 edition)`, are removed before matching. A double-quoted phrase inside a note, as in
`IAPT (say "formerly IAPT" once)`, is allowed once per page: its first occurrence is ignored when matching. The warning is reported once per form per page, with
a count.

## Generated files (`-WriteCatalog`)

The checks run first. Then the tool writes these four things and modifies nothing else:

1. **`_catalog.yaml`**: one list entry per page, sorted by path. Each entry has `file` (a forward-slash
   path) and then every frontmatter field in the page's own order, written in the same YAML subset. Flow
   lists stay on one line, block lists are indented, and the section 4 quoting rule is applied.
2. **`_graph.json`** (schema section 11): `{"generated", "nodes", "edges"}`.
   - Nodes: `domain` (id is the router name, such as `05-conditions/depression`), `page` (with type,
     depth, domain, file, summary, stage, topics), `concept` (with scheme prefix and title, plus
     `deprecated` when set), `model` and `source` (`source_kind`, `access`).
   - Edges: page `related` rels, `in-domain`, `tags`, `cites`, `broader`, `concept-related`, and
     `slot-uses`. A `slot-uses` edge goes from a model to a scheme prefix such as `em`. Schemes are not
     nodes in section 11, so its `to` is the prefix.
   - Edges are written only when the target exists, and they are deduplicated.
3. **`_vocab\*.json` `see` arrays**: each concept's `see` is set to the sorted ids of the pages that tag
   it. The file is edited in place: only the `see` value's text is replaced, written inline like
   `["a", "b"]`. Every other byte stays the same, including property order, indentation and line endings.
   If a concept has no `see` key, one is inserted after `related` at the concept's indentation. Arrays
   that already match are left alone. `formulation-models.json` is never touched.
4. **`_glossary.md`**: the text between `<!-- BEGIN GENERATED: controlled-vocabulary -->` and
   `<!-- END GENERATED: controlled-vocabulary -->` is replaced. The new block has one
   `#### <scheme title>` heading per concept scheme, in `vocab-schemes` order. Each heading has a table
   `| Label | Definition | Concept |` listing the scheme's non-deprecated concepts, with the id in
   backticks and `|` escaped. The text outside the markers is preserved.

A second run on unchanged content changes nothing, except `_graph.json` and `_catalog.yaml` on a new day,
because they record the generation date.

## Tests

`tests\run-tests.ps1` (about 30 seconds):

- `tests\fixture\good\` is a miniature wiki and must validate clean. It has its own `_schema.md` (a copy
  of the real one with three schemes in `vocab-schemes`). It also has the domains `01-intake` and
  `02-treatment`, the container `05-conditions` with leaf `depression`, four pages (one of them a
  pitfall), `_sources.md`, `_glossary.md`, and `_vocab` with `situations-triggers.json`, `emotions.json`
  and `formulation-models.json`.
- For each check, the runner rebuilds a deliberately broken copy under `tests\fixture\broken\<case>\`.
  That folder is wiped on each run. The runner then asserts that the expected issue line appears, and
  that the exit code matches. There are 75 cases, covering every check above, plus a case proving that
  vocabularies come from the schema and not the script.
- A `-WriteCatalog` run on a copy checks the generated files, checks that only the allowed files
  changed, and checks that a second run is a no-op.
- `-SyncSchema` refreshes the fixture's `_schema.md` from the wiki's, keeping the fixture's
  `vocab-schemes` block. Use it after a contract change.

Performance: about 8 seconds for 372 pages (267 pages plus 105 pitfalls) and 646 concepts, with or without `-WriteCatalog`.
