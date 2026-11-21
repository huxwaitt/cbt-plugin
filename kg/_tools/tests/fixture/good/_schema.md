# _schema.md: the page contract for the CBT Knowledge Graph

This file is the contract. Every page, index, vocabulary file and tool in this wiki follows it.
Changing it is a contract change: mirror §5, §6, §9 and §10 changes in `_tools\validate.ps1`.

## 1. Purpose and audience

A retrieval wiki plus knowledge graph of the reference knowledge a cognitive behavioral therapy (CBT)
therapist needs: what to capture, how to assess, formulate, treat, measure and end, how to respond to
clients in session, and the condition-specific, medical, cultural and legal knowledge behind it.

Readers: trained clinicians, trainees, supervisors, and people designing clinical tools (including
AI-assisted ones). It is reference material, not a substitute for training, supervision, or local law.

It has two layers that link to each other:
- **Reference layer**: Markdown pages in `NN-*` domain folders (§3, §4, §7).
- **Vocabulary layer**: the fixed CBT vocabulary, JSON concept schemes in `_vocab\` (§10). Pages tag the
  concepts they discuss; the formulation page (`formulation\index.html`) is generated from it.

## 2. Voice

- Plain language. Short sentences. Name a thing before relying on it.
- Spell out every acronym on its first use in each page: "exposure and response prevention (ERP)".
- No em dashes and no "·" anywhere. Use commas, colons, parentheses or new sentences.
- American spelling (behavior, generalized, color). Where UK practice differs, say so in one sentence.
- Practical guidance uses this exact form, one per bullet:
  `- If <client signal or situation> → <what the therapist does or says>. Because <reason> [Key].`
- Example therapist phrasings go in double quotes. Mark unhelpful phrasings with "Avoid:".
- Every load-bearing claim (a number, cutoff, threshold, duration, effect size, recommendation, or
  "first-line" claim) carries an inline citation `[Key]` whose Key appears in the page's `sources`.
- State evidence strength when claiming something works: guideline-recommended, supported by randomized
  trials, emerging evidence, or expert consensus.
- No filler, no hedging stacks, no marketing tone.

## 3. Structure and ids

- Root: `C:\Users\huxle\cbt-knowledge-graph\`.
- Top-level files: `_index.md` (router), `_schema.md` (this), `_sources.md`, `_glossary.md`,
  `_playbook.md`, `_overview.md`, `_maintenance.md`, generated `_catalog.yaml` and `_graph.json`.
- Domain = folder `NN-slug` holding `_index.md` plus pages `<page-slug>.md` and `pitfall-<slug>.md`.
- Container = folder `NN-slug` holding only leaf folders (no files). Each leaf folder is a domain with
  its own `_index.md`. The router names leaves as `NN-container/leaf`.
- File names: lowercase, digits and hyphens only, `.md`.
- **Page id** = `<folder>.<file-without-.md>` where `<folder>` is the page's own folder name.
  Examples: `01-intake.presenting-problem`, `depression.cbt-model`, `responding-in-session.validation`.
- Page length: 300 to 900 words of body. Split anything longer into two pages.

## 4. Frontmatter (fixed order, every page)

```yaml
---
id: 01-intake.presenting-problem
title: Eliciting the Presenting Problem
type: procedure
summary: One sentence, at most 30 words, saying what the page gives the reader.
depth: L2
stage: [intake, assessment]
topics: [intake, formulation]
concepts: [sit.interpersonal-conflict, em.anxious]
applies_when: One sentence naming the client situation or clinician question that makes this page the right one.
not_for: One sentence naming what to read instead, with page ids in backticks.
sources:
  - Beck-2021 § Ch. 4 The Evaluation Session
  - Persons-2008 § Ch. 6
related:
  - {id: 03-formulation.five-part-model, rel: implements}
  - {id: 08-measurement.depression-measures, rel: see-also}
reviewed: 2026-11-06
---
```

YAML subset (so the tools can parse it without a YAML library):
- One `key: value` per line. Quote a scalar with double quotes only if it contains `: `, ` #`, or
  starts with `[`, `{`, `"`, `*`, `&`, `!`, `|`, `>`, `%` or `@`.
- `stage`, `topics`, `concepts` are flow lists on one line. `concepts` may be `[]`.
- `sources` and `related` are block lists. `related` items are flow maps `{id: <page-id>, rel: <rel>}`.
- `reviewed` is an ISO date.
- Pitfall pages use `type: pitfall`; their `summary` describes the symptom (what going wrong looks like).

The body starts with a line beginning `**Bottom line:**` (two to four sentences that answer the page's
question on their own). Nothing comes between the closing `---` and that line except one blank line.

## 5. Controlled vocabularies

Use only these values. Need a new one? Do not invent it in a page: propose it (see your instructions)
and it is added here first. The tools read the fenced blocks below.

Page types:
```vocab-type
concept model procedure intervention instrument condition guidance pitfall
```
- concept: what something is and why it matters. model: a theory or maintenance model. procedure: how
  to do a clinical task (assess, plan, document). intervention: a treatment technique. instrument: a
  measure or scale. condition: a disorder or presentation. guidance: how to respond or conduct yourself
  in session. pitfall: a common mistake, its symptom and its fix.

Depth (audience level; ranges allowed as `L1-L2`, `L2-L3`, `L1-L3`):
```vocab-depth
L1 L2 L3 L1-L2 L2-L3 L1-L3
```
- L1: orientation in plain words for a newcomer or tool designer. L2: practitioner working knowledge.
  L3: specialist detail, nuance, evidence and edge cases.

Stage of the episode of care (a page may list several):
```vocab-stage
intake assessment formulation planning treatment ending any
```

Topics:
```vocab-topics
intake risk formulation planning session-structure homework documentation measurement relapse-prevention ending
alliance empathy validation socratic-method collaboration feedback rupture-repair communication motivation
cognitive-restructuring thought-records core-beliefs behavioral-activation exposure erp behavioral-experiments problem-solving relaxation imagery sleep skills-training psychoeducation compassion
avoidance safety-behaviors rumination worry intolerance-of-uncertainty perfectionism self-criticism attention emotion-regulation cognitive-distortions
depression bipolar panic agoraphobia specific-phobia social-anxiety gad ocd bdd hoarding ptsd health-anxiety eating-disorders adhd insomnia psychosis substance-use personality-disorders autism self-harm suicide
diagnosis dsm-5-tr icd differential-diagnosis comorbidity pharmacology medical culture development children-adolescents older-adults neurodivergence
ethics law privacy consent supervision competence telehealth digital-and-ai guidelines stepped-care
screening crisis safeguarding violence engagement care-transitions non-response boundaries functional-analysis resilience values
intermediate-beliefs metacognition shame dissociation reassurance-seeking procrastination executive-function mindfulness interpersonal dbt schema-therapy
trauma grief perinatal somatic-symptoms body-image body-focused-repetitive-behaviors early-intervention harm-reduction transdiagnostic
family-work parent-training deprescribing side-effects
sexual-and-gender-minorities socioeconomic-context religion-spirituality language-access health-literacy intellectual-disability
```

Relation types for `related` (directed: from this page to the target):
```vocab-rel
see-also prerequisite part-of implements treats measures maintains assesses differential caution alternative
```
- prerequisite: read the target first. part-of: this page is a component of the target. implements:
  this process page applies the target reference page. treats: this intervention treats the target
  condition. measures: this instrument measures the target. maintains: this process keeps the target
  problem going. assesses: this procedure assesses the target. differential: conditions to tell apart.
  caution: the target needs care, adaptation or is contraindicated alongside this. alternative: another
  approach to the same problem.

## 6. Canonical names

Use these spellings exactly. Left: canonical form. Right: forms to avoid or aliases.
```vocab-canonical
CBT | cognitive behavioural therapy, Cognitive-Behavioral Therapy
DSM-5-TR | DSM 5, DSM-V, DSM5 (say DSM-5 only for the 2013 edition)
ICD-10-CM | ICD10
ICD-11 | ICD 11
NICE | N.I.C.E.
NHS Talking Therapies | IAPT (say "formerly IAPT" once)
PHQ-9 | PHQ9
GAD-7 | GAD7
BDI-II | BDI 2, BDI-2
PCL-5 | PCL5
Y-BOCS | YBOCS
C-SSRS | CSSRS
ERP | E/RP
CBT-I | CBTI
CBT-E | CBTE
CBTp | CBT-P
case formulation | case conceptualisation (alias: case conceptualization)
therapeutic alliance | working alliance (alias)
behavioral experiment | behavioural experiment
safety behavior | safety behaviour
thought record | thought diary (alias)
automatic thought | automatic negative thought, ANT (alias)
core belief | schema (alias, but schema has its own meaning in schema therapy)
Socratic questioning | Socratic method (alias)
rupture and repair | alliance rupture (alias)
homework | between-session practice (alias)
```

## 7. Page templates (body headings by type, in this order)

All bodies start with `**Bottom line:**`. Then:

- **concept**: `## What it is` · `## Why it matters in CBT` · `## Key details` · `## In the session`
- **model**: `## Components` · `## How it keeps the problem going` · `## Drawing it with the client` ·
  `## Treatment targets it implies`
- **procedure**: `## When to use` · `## Steps` · `## What to record` · `## Guidance` · `## Common problems`
- **intervention**: `## When to use` · `## How it works` · `## Steps` · `## Guidance` ·
  `## Common problems` · `## Evidence`
- **instrument**: `## What it measures` · `## Format and scoring` · `## Interpreting scores` ·
  `## Licensing and access` · `## Guidance`
- **condition**: `## Diagnostic essentials` · `## Course and prevalence` · `## Differential and comorbidity` ·
  `## CBT approach in brief` · `## Risk notes`
- **guidance**: `## The principle` · `## Guidance` · `## Example phrasings` · `## Evidence`
- **pitfall**: `## What it looks like` · `## Why it happens` · `## The fix` · `## Sources note`

`## Guidance` sections hold `If … → … . Because …` bullets (§2). Tables are allowed when shorter than prose.
(The "·" above separates headings in this spec only; never use it in pages.)

## 8. Index formats

**Domain `_index.md`**:
```markdown
# NN-slug: Domain Title

## This stage
Two to four sentences: what this domain covers and where it sits in the episode of care.

## Decisions in order
1. The first decision a clinician makes here → `page-id`

## Pages
| Page | Summary | Applies when | Depth |
|---|---|---|---|
| `page-id` | summary copied verbatim | applies_when copied verbatim | L2 |

## Pitfalls
| Pitfall | Symptom | Page |
|---|---|---|
| Title | summary copied verbatim | `page-id` |
```

**Leaf `_index.md`** (inside a container): `# NN-container/leaf: Title`, then `## This surface`,
`## Pages in order` (numbered list of `page-id` with a one-line reason), then the same `## Pages` and
`## Pitfalls` tables.

**Router `_index.md`**: purpose and safety note, `## Read protocol`, `## Domains` table
`| Domain | Route here when | Not here |` with one row per domain or leaf (linked), `## Top-level files`.

Every page file in a folder appears exactly once in that folder's tables; pitfalls only in `## Pitfalls`.

## 9. Sources

- Frontmatter `sources` entries: `<Key> § <chapter, section, table or heading>`.
- Inline citations in bodies: `[Key]` (a Key from the page's `sources`).
- **Key format**: first author surname + year: `Beck-2021`. Two authors: `Clark-Wells-1995`. Three or
  more: `Ehlers-etal-2005`. Same key twice: add `a`, `b` (`Clark-1986a`). Organizations and documents:
  `APA-DSM5TR-2022`, `WHO-ICD11-2022`, `NICE-CG113`, `NICE-NG222`, `APA-PTSD-Guideline-2017`.
  Instrument manuals or sites: `PHQ-Screeners`, `C-SSRS-Site`. Letters, digits and hyphens only.
- `_sources.md` holds one row per key:
  `| Key | Citation | Kind | Access | Notes |` where Kind is one of book, article, guideline, manual,
  instrument, website, standard, law; Access is a DOI, URL or ISBN; Notes gives edition, licensing or
  currency remarks.
- A statement checked against current documentation by a maintainer uses `Maintainer/<YYYY-MM-DD> § <topic>`.

## 10. Vocabulary layer (`_vocab\`)

The fixed CBT vocabulary. One JSON file per scheme (UTF-8, 2-space indent). Scheme list
(`prefix file`):
```vocab-schemes
fm formulation-models.json
sit situations-triggers.json
em emotions.json
```

**Concept scheme file** (every scheme except `fm`):
```json
{
  "scheme": "cognitive-distortions",
  "prefix": "cd",
  "title": "Cognitive distortions (thinking traps)",
  "description": "What this scheme classifies and which formulation slots use it.",
  "version": "1.0.0",
  "sources": ["Beck-2021 § Ch. 13", "Burns-1980 § Ch. 3"],
  "concepts": [
    {
      "id": "cd.catastrophizing",
      "label": "Catastrophizing",
      "alt_labels": ["fortune telling (catastrophic)"],
      "definition": "Clinician wording, at most 25 words.",
      "client_wording": "Plain wording a client would understand, at most 20 words.",
      "example": "One short example, in quotes if it is a thought.",
      "group": "optional grouping label inside the scheme",
      "broader": null,
      "related": ["cd.fortune-telling"],
      "see": [],
      "sources": ["Beck-2021 § Ch. 13"]
    }
  ]
}
```
- Concept id: `<prefix>.<slug>`, lowercase, digits, hyphens. Ids are permanent: never reuse or rename;
  retire with `"deprecated": true` and `"replaced_by": "<id>"`.
- `broader` is null or one id in the same scheme. `related` may point into any scheme.
- `see` lists page ids that tag this concept. It is generated by `validate.ps1 -WriteCatalog`; write `[]`.
- A concept lives in exactly one scheme. If two schemes need it, keep it in one and link with `related`.
- Optional extra fields per concept are allowed when a scheme needs them (for example emotions may carry
  `"valence"`; core beliefs carry `"about": "self|others|world|future"`; intermediate beliefs carry
  `"kind": "rule|assumption|attitude"`; measures carry `"page"` with the instrument page id).

**Formulation models file** (`formulation-models.json`, prefix `fm`):
```json
{
  "scheme": "formulation-models",
  "prefix": "fm",
  "title": "Formulation models",
  "version": "1.0.0",
  "rating_types": {
    "intensity": "0 to 100, how strong the emotion, sensation or urge is",
    "belief": "0 to 100, how much the client believes it right now",
    "frequency": "times per week"
  },
  "models": [
    {
      "id": "fm.five-part",
      "label": "Five-part model (hot cross bun)",
      "summary": "One sentence.",
      "use_when": "One sentence.",
      "topics": ["depression", "gad"],
      "page": "03-formulation.five-part-model",
      "sources": ["Padesky-Mooney-1990 § ..."],
      "grid": {"cols": 3, "rows": 3},
      "slots": [
        {
          "id": "situation",
          "label": "Situation",
          "prompt": "The question the therapist asks to fill this box.",
          "help": "One sentence on what belongs here.",
          "vocab": ["sit"],
          "multi": true,
          "rating": null,
          "free_text": true,
          "col": 2, "row": 1
        }
      ],
      "links": [
        {"from": "situation", "to": "thoughts", "label": "", "style": "solid"}
      ]
    }
  ]
}
```
- `vocab` lists scheme prefixes whose concepts may fill the slot (may be empty for free text only).
- `rating` is null or a key of `rating_types`. `col`/`row` place the slot on the model's grid, 1-based.
- `style` is `solid` (causes) or `dashed` (feeds back, maintains). Every link end is a slot id.

**Pages tag concepts** in frontmatter `concepts`. Tag only concepts the page substantially discusses.

## 11. Graph export

`validate.ps1 -WriteCatalog` writes `_graph.json`:
`{"generated": "<date>", "nodes": [...], "edges": [...]}`.
Nodes: `{"id", "kind": "domain|page|concept|source|model", "label", ...}`. Edges: `{"from", "to", "rel"}`
with rel from §5 plus `in-domain` (page to domain), `tags` (page to concept), `cites` (page to source),
`broader` and `concept-related` (concept to concept), `slot-uses` (model to scheme).

## 12. Content rules

- **Copyright.** Do not reproduce DSM-5-TR criteria text. Paraphrase and give the facts (symptom counts,
  durations, onset ages, exclusions). Do not reproduce item wording of proprietary instruments
  (BDI-II, BAI, Y-BOCS and others); describe content and scoring only. Public-domain instruments
  (PHQ-9, GAD-7, PCL-5, C-SSRS) may be described in detail but link to the official copy rather than
  pasting it. Direct quotes: at most 25 words, cited.
- **Jurisdiction.** United States first (DSM-5-TR, ICD-10-CM, HIPAA, state law); add the UK equivalent
  in a sentence where practice differs (NICE, NHS Talking Therapies, GDPR, safeguarding).
- **Safety.** Risk content gives concrete escalation steps and crisis contacts (US: 988 Suicide & Crisis
  Lifeline, call or text 988, or 911; UK: 999, NHS 111, Samaritans 116 123). Never describe suicide or
  self-harm methods or lethality details beyond "restrict access to lethal means".
- **Scope of practice.** Who may diagnose, prescribe or treat varies by license and country. Say so
  where it matters.
- **Currency.** Prefer the current edition of every source. If a newer edition or guideline replaces
  one you cite, cite the newer one. `reviewed` is the date the page was last checked.
