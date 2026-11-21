# Maintenance: changing the wiki safely

Every change follows the same four steps: **plan, confirm, write, verify**. The contract is `_schema.md`;
the validator `_tools\validate.ps1` enforces it. A change is finished only when the validator reports
`structure issues: 0`, `page issues: 0` and `vocab issues: 0`, the generated files are rewritten, and a
changelog line is added below.

## 1. Procedure

1. **Plan.** Name the operation (section 3) and write a change plan (section 6): the files to touch, the ids
   and source keys involved, and the evidence for any new claim. Read the current version of every file you
   will touch, its folder `_index.md`, and the pages that relate to it (grep `_catalog.yaml` for the id).
2. **Confirm.** Check the plan against the contract: ids and file names, frontmatter order, controlled values
   (type, depth, stage, topics, rel), required headings for the page type, word range, source keys, voice
   rules (no em dash, no middle dot, acronyms spelled out once per page, American spelling, `If ... → ... .
   Because ... [Key].` guidance bullets) and content rules (copyright, safety wording, jurisdiction, scope of
   practice, currency). If the change alters the contract itself, get it agreed first and record it as a
   contract change.
3. **Write.** Make the edits in the touch-list order. Keep every copy of repeated text in sync: a page's
   `summary` and `applies_when` appear verbatim in its folder index row, and its `depth` equals the index
   Depth column. Use existing source keys; add a `_sources.md` row before citing a new key.
4. **Verify.** Run the commands in section 4 and walk the checklist in section 7. Fix every issue the
   validator reports, re-run until clean, rebuild the formulation page, then add a changelog line.

## 2. File roles

| File or folder | Role | Edited by |
|---|---|---|
| `_schema.md` | The contract: frontmatter, vocabularies (type, depth, stage, topics, rel, canonical names, schemes), templates, index formats, sources, content rules. The validator reads its fenced blocks. | Hand; contract change |
| `_index.md` | Router: purpose, safety note, read protocol, one linked row per domain or leaf. | Hand |
| `NN-*\_index.md` | Domain or leaf index: This stage or This surface, Decisions or Pages in order, Pages and Pitfalls tables. | Hand |
| `NN-*\*.md` | Pages and `pitfall-*.md` pages. | Hand |
| `_sources.md` | One row per source key used anywhere. | Hand |
| `_glossary.md` | Terms table and aliases (hand); controlled vocabulary block between the markers (generated). | Hand plus generator |
| `_playbook.md`, `_overview.md`, `_maintenance.md` | Order of work, description and counts, this procedure and changelog. | Hand |
| `_vocab\*.json` | Concept schemes and formulation models. Each concept's `see` array is generated. | Hand plus generator |
| `_catalog.yaml`, `_graph.json` | Generated catalog of frontmatter and the graph export. Never edit by hand. | `validate.ps1 -WriteCatalog` |
| `formulation\index.html` | Generated formulation page. Never edit by hand. | `build_formulation.py` |
| `_tools\` | Validator, formulation builder and template, self-tests and fixtures. | Hand; mirror contract changes |

## 3. Operations and touch-lists

| Operation | Touch-list (in order) | Notes |
|---|---|---|
| Edit page content | Page body and `reviewed`; `sources` if keys change; `_sources.md` for any new key; folder `_index.md` row if `summary`, `applies_when` or `depth` changed; `concepts` if tags change | Keep 300 to 900 body words; split rather than exceed 900. |
| Add page | New page file; folder `_index.md` Pages row (and Decisions or Pages in order if it changes the sequence); `_sources.md` rows for new keys; `related` on 1 to 3 existing pages that should point to it; glossary terms it defines | Id is `<folder>.<file>`; pick type from §5 and use its §7 headings. |
| Add pitfall | `pitfall-<slug>.md` with `type: pitfall` and a symptom `summary`; folder `_index.md` Pitfalls row; `related` from the page it guards (`caution`) | Pitfalls appear only under `## Pitfalls`. |
| Split or merge pages | New or surviving files; every `related` entry pointing at old ids (grep `_catalog.yaml`); index rows; glossary `See` ids; `_playbook.md` and `_index.md` mentions; concept `page` fields in `_vocab\measures.json`; formulation model `page` fields | Old ids must disappear everywhere; there are no redirects. |
| Rename or deprecate a page | As split or merge. A retired page is deleted and its inbound links repointed. | Page ids are not permanent; concept ids are. |
| Add domain | Folder `NN-slug` (or a leaf inside a container) with `_index.md` in §8 format; pages; router `## Domains` row; `_overview.md` tree and counts; `_playbook.md` step if it changes the order of work | A container holds only leaf folders. Two leaves may not share a name. |
| Glossary term | `_glossary.md` Terms row (definition at most 25 words, `See` an existing page id in backticks); Aliases row if it has synonyms | Keep rows sorted; one term per concept. |
| Top-level file | The file; `_index.md` Top-level files table if a file is added; `_tools\validate.ps1` required list and `_schema.md` §3 if it becomes required | Adding a required file is a contract change. |
| Re-validate only | Run section 4 commands; fix issues; changelog line only if anything changed | |
| Bulk import | Plan per folder; add `_sources.md` rows first; write pages; index rows; run the validator after each folder, not only at the end; reconcile duplicate keys before citing | Split any key that names two works into `a` and `b` and fix every user. |
| Add vocabulary concept | Concept object in the right `_vocab\*.json` (id `<prefix>.<slug>`, label, definition at most 25 words, client wording, `broader`, `related`, `see: []`, sources); `_sources.md` rows; tag pages that discuss it; update `_vocab\README.md` counts | Check no other scheme already holds it. |
| Deprecate vocabulary concept | Set `"deprecated": true` and `"replaced_by": "<id>"`; retag pages from the old id to the new one; update formulation slots if they named it | Never delete or rename a concept id. |
| Add formulation model | Model object in `_vocab\formulation-models.json` (grid, slots with `vocab` prefixes and `rating`, links with `solid` or `dashed`, `page`); `_sources.md` rows; the page it points to; rebuild the formulation page | Slot ids unique within the model; every link end is a slot id. |

## 4. Regenerate

From `C:\Users\huxle\cbt-plugin\kg\`:

```powershell
pwsh -NoProfile -File _tools\validate.ps1                  # check only; exit 1 on structure or vocab issues
pwsh -NoProfile -File _tools\validate.ps1 -WriteCatalog    # check, then write _catalog.yaml, _graph.json, vocab see arrays, glossary block
python _tools\build_formulation.py                         # rebuild formulation\index.html (run after -WriteCatalog)
python _tools\build_formulation.py --check                 # check the vocabulary only
pwsh -NoProfile -File _tools\tests\run-tests.ps1 -SyncSchema   # after a contract or validator change
```

## 5. Vocabulary rules

- Concept ids are `<prefix>.<slug>`, lowercase, permanent. Retire with `deprecated` and `replaced_by`.
- A concept lives in exactly one scheme; link across schemes with `related`. `broader` stays in-scheme.
- Definitions at most 25 words, client wording at most 20 words, both plain.
- Never edit `see` by hand; `-WriteCatalog` fills it. Formulation models are never touched by the generator.
- Tag a page with a concept only when the page substantially discusses it (most pages need 2 to 8 tags).
- Frontmatter controlled values (type, depth, stage, topics, rel) come only from the `_schema.md` blocks. To
  add a value, change `_schema.md` first (a contract change) and log it.
- Canonical names in `_schema.md` §6 apply to bodies; the validator warns on avoid forms. A quoted phrase in
  a canonical note, such as `say "formerly IAPT" once`, may appear once per page.

## 6. Change-plan template

```markdown
### Change plan: <short title>  (<YYYY-MM-DD>)
- Operation: <from section 3>
- Reason: <what is wrong or missing; evidence or request>
- Files to touch: <paths, in order>
- Ids: <page ids, concept ids, models affected>
- Source keys: <existing keys used; new keys with citation, kind, access, notes>
- Contract change: no | yes (<what changes in _schema.md and _tools\validate.ps1>)
- Risk to other pages: <inbound related links, index rows, glossary See ids, vocab page fields>
- Verification: validator clean; build_formulation run; checklist items checked
```

## 7. Verification checklist

- [ ] Validator: `structure issues: 0`, `page issues: 0`, `vocab issues: 0`; style warnings reviewed.
- [ ] `-WriteCatalog` run, so `_catalog.yaml`, `_graph.json`, vocab `see` arrays and the glossary block are current.
- [ ] `build_formulation.py` run after `-WriteCatalog`.
- [ ] Each changed page: Bottom line answers the question alone; body 300 to 900 words; every load-bearing
      claim has `[Key]`; evidence strength stated; acronyms spelled out once; no em dash or middle dot.
- [ ] Index rows match `summary`, `applies_when` and `depth` verbatim.
- [ ] Every new key has a `_sources.md` row; no duplicate key for the same work (search by DOI or title).
- [ ] Risk content names concrete escalation steps and crisis contacts (US 988 and 911; UK 999, NHS 111,
      Samaritans 116 123) and no method or lethality detail.
- [ ] No reproduced DSM-5-TR criteria text or proprietary item wording; quotes at most 25 words.
- [ ] UK difference stated where practice differs; scope of practice noted where it matters.
- [ ] `reviewed` updated on every page whose content was checked.
- [ ] Changelog line added.

## 8. Changelog

- 2026-11-06: Initial build. 29 domains and leaves, 267 pages, 105 pitfalls, 646 concepts, 18 formulation
  models, 1,377 source keys, 498 glossary terms. Wrote `_sources.md`, `_glossary.md`, `_index.md`,
  `_playbook.md`, `_overview.md` and `_maintenance.md`. Reconciled source keys across folders: merged
  duplicate keys for the same work (for example `Greenberger-Padesky-2015` into `Greenberger-Padesky-2016`,
  `APA-Ethics-Code-2017` into `APA-Ethics-2017`, `NHS-Urgent-MH` and `NHS-Urgent-Help-Site` into
  `NHS-Urgent-Help`, `Keepers-etal-2024` into `APA-BPD-Guideline-2024`, `Crone-etal-2023` into
  `APA-ED-Guideline-2023`, `WHO-AUDIT-2001` into `Babor-etal-2001`, `CFR-45-164-50x` into
  `HIPAA-45-CFR-164-50x`); split keys that named two works into `a` and `b` (Rudd 2006, Cuijpers 2014 and
  2020, Robinson 2020, Tolin 2015, McManus 2012, Borkovec 1983, Levis 2020, Kessler 2005, Hall 2016,
  Smith 2018, Kelly 2017); suffixed `Kuyken-etal-2016`, `Cuijpers-etal-2013` and `Brown-etal-2001` as `a`.
  **Contract change:** added 41 topics to `vocab-topics` (screening, crisis, safeguarding, violence,
  engagement, care-transitions, non-response, boundaries, functional-analysis, resilience, values,
  intermediate-beliefs, metacognition, shame, dissociation, reassurance-seeking, procrastination,
  executive-function, mindfulness, interpersonal, dbt, schema-therapy, trauma, grief, perinatal,
  somatic-symptoms, body-image, body-focused-repetitive-behaviors, early-intervention, harm-reduction,
  transdiagnostic, family-work, parent-training, deprescribing, side-effects, sexual-and-gender-minorities,
  socioeconomic-context, religion-spirituality, language-access, health-literacy, intellectual-disability)
  and tagged 48 page-topic pairs. **Validator fix:** a quoted phrase in a `vocab-canonical` note (`say
  "formerly IAPT" once`) is now allowed once per page, matching §6. Validator tail: `domains: 29  pages: 267  pitfalls: 105  concepts: 646  models: 18  sources: 1377`, `structure issues: 0`, `page issues: 0`, `vocab issues: 0`, `style warnings: 0`.
- 2026-11-06: Final validation. Audited the contract beyond the validator (characters in every file,
  `_sources.md` keys, kinds and order, vocab field limits and source keys, measure `page` fields, glossary
  `See` ids and order, `not_for` and index ids, router, `_overview.md` tree and `_vocab\README.md` counts);
  all consistent. Fixed voice rules in pages without changing clinical content: gave 18 `## Guidance` bullets
  the missing `Because` clause, using the page's own sources or evidence label (`02-risk.safeguarding`,
  `responding-in-session.responding-to-strong-emotion`, `behavioral.exposure-hierarchy`,
  `08-measurement.depression-measures`, `09-ending.discharge-summary`, `panic-and-phobias.interoceptive-exposure`,
  `ptsd.cognitive-processing-therapy`, `ptsd.adaptations`, `12-medical-pharmacology.working-with-prescribers`,
  and `children-and-adolescents`, `cultural-humility`, `identity-and-minority-stress`,
  `intellectual-disability-and-low-literacy`, `older-adults` and `religion-and-spirituality` in
  `13-context-culture-development`); American spelling for canceled, canceling and offense in 5 pages; moved
  the first-use expansion of CBT, NICE, PTSD or US to the first mention in 9 pages. Every changed page stays
  within 300 to 900 body words. Updated the `_tools\README.md` performance line and the `_overview.md` counts
  and known gaps. Rebuilt `formulation\index.html`: all 18 models in `_vocab\formulation-models.json` embedded
  unchanged (146 slots, 213 links). Validator tail: `domains: 29  pages: 267  pitfalls: 105  concepts: 646
  models: 18  sources: 1377`, `structure issues: 0`, `page issues: 0`, `vocab issues: 0`, `style warnings: 0`.
- 2026-11-07: Gap-fill round finalized. New leaves `11-conditions/chronic-pain-and-physical-health` and
  `11-conditions/grief-and-loss` (5 pages and 3 pitfalls each); new pages `adhd.underdiagnosis-in-women-and-adults`,
  `adhd.emotional-dysregulation-and-associated-features`, `04-treatment-planning.treatment-plan-document`,
  `14-ethics-law.administrative-and-billing-records`, `13-context-culture-development.perinatal-mental-health`
  and `13-context-culture-development.child-anxiety`; vocabulary grew to 676 concepts and 24 models; formulation
  diagrams reworked; 65 previously untagged concepts tagged on the pages that discuss them (94 remain untagged).
  `_sources.md`: added 124 rows for the new keys; `Vlaeyen-Linton-2000` and `Leeuw-etal-2007` already existed
  and were reused; no duplicate DOIs, PMIDs or titles found. Renamed `Young-etal-2020`, `Russell-etal-2013` and
  `Cuijpers-etal-2023` to `-2020a`, `-2013a` and `-2023a` (8 pages) so they pair with the new `b` keys; corrected
  the volume years of `Stelzer-etal-2020` and `Killikelly-Maercker-2018` in their citations. `_index.md`: router
  rows for the two new leaves; widened the 04-treatment-planning, adhd, 13-context-culture-development and
  14-ethics-law rows; added grief and chronic pain to the depression and health-anxiety "Not here" cells; updated
  intro counts. `_glossary.md`: 43 terms added; `Prolonged grief disorder` now points to `grief-and-loss.overview`.
  `_playbook.md`: linked administrative records at intake, perinatal and child anxiety at assessment, the
  treatment plan document at planning, and the two new leaves under "Across every step". **Contract change:**
  added 4 topics to `vocab-topics` (chronic-pain, long-term-conditions, billing-and-insurance,
  sex-and-gender-differences) and tagged 15 page-topic pairs; reproductive-hormones, circadian-rhythms,
  rejection-sensitivity and insurance-and-reimbursement were not added. Added 19 related links into the new pages
  from 17 existing pages (for example `health-anxiety.overview`, `depression.overview`, `ptsd.overview`,
  `03-formulation.choosing-a-model`, which also gained two model-map rows, and
  `13-context-culture-development.children-and-adolescents`); every changed page stays within 300 to 900 body
  words. Rebuilt `formulation\index.html` (24 models, 195 slots, 268 links, 0 warnings); validator self-test 92 of
  92 passed. Validator tail: `domains: 31  pages: 283  pitfalls: 111  concepts: 676  models: 24  sources: 1510`,
  `structure issues: 0`, `page issues: 0`, `vocab issues: 0`, `style warnings: 0`.
