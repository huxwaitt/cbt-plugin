# Overview: the CBT Knowledge Graph

## What it is

A retrieval wiki plus knowledge graph of the reference knowledge a cognitive behavioral therapy (CBT)
therapist needs across one episode of care: intake, risk, formulation, treatment planning, session
structure, the therapeutic relationship and turn-by-turn responding, cognitive and behavioral
interventions, measurement, ending, diagnosis, 15 condition areas, medical and pharmacology basics,
culture and development, ethics and law, and transdiagnostic processes. Readers are trained clinicians,
trainees, supervisors and people designing clinical tools, including AI-assisted ones. It is reference
material, not a substitute for training, supervision or local law. Jurisdiction is United States first,
with the United Kingdom equivalent where practice differs.

It has two linked layers:
- **Reference layer:** Markdown pages in numbered domain folders, each with fixed frontmatter (type, depth,
  stage, topics, concepts, sources, related pages) and a body that opens with a **Bottom line**.
- **Vocabulary layer:** the fixed CBT vocabulary in `_vocab\`, 15 JSON concept schemes (situations,
  background factors, distortions, thought themes, emotions, body sensations, behaviors, coping
  strategies, core and intermediate beliefs, maintenance processes, interventions, measures, therapist
  skills, risk indicators) plus 24 formulation models. Pages tag the concepts they discuss, and each
  concept's `see` list points back to those pages.

## Counts

From the final `_tools\validate.ps1 -WriteCatalog` run on 2026-11-07, after the gap-fill round (structure,
page and vocab issues 0, style warnings 0):

| Item | Count |
|---|---|
| Domains and leaves (folders with their own `_index.md`) | 31 |
| Pages (excluding pitfalls) | 283 |
| Pitfall pages | 111 |
| Vocabulary concepts (15 schemes) | 676 (582 tagged by at least one page, 94 untagged) |
| Formulation models | 24 |
| Formulation model slots and links (`build_formulation.py`) | 195 slots, 268 links |
| Source keys in `_sources.md` | 1,510 |
| Glossary terms | 541 |

## Folder tree

Numbers are pages plus pitfalls.

```
cbt-knowledge-graph\
  _index.md  _schema.md  _sources.md  _glossary.md  _playbook.md  _overview.md  _maintenance.md
  _catalog.yaml  _graph.json            (generated)
  01-intake\                            9 + 4
  02-risk\                              11 + 4
  03-formulation\                       12 + 4
  04-treatment-planning\                9 + 3
  05-session-structure\                 9 + 4
  06-therapeutic-relationship\          (container)
    alliance-and-stance\                10 + 3
    responding-in-session\              11 + 4
  07-interventions\                     (container)
    cognitive\                          10 + 4
    behavioral\                         11 + 4
  08-measurement\                       10 + 4
  09-ending\                            8 + 3
  10-diagnosis\                         8 + 4
  11-conditions\                        (container)
    depression\                         7 + 3
    panic-and-phobias\                  9 + 3
    social-anxiety\                     7 + 4
    gad\                                6 + 3
    ocd\                                8 + 3
    ptsd\                               11 + 3
    health-anxiety\                     7 + 3
    eating-disorders\                   7 + 4
    adhd\                               10 + 4
    insomnia\                           8 + 4
    bipolar-and-psychosis\              9 + 3
    substance-use\                      8 + 4
    personality-disorders\              9 + 4
    chronic-pain-and-physical-health\   5 + 3
    grief-and-loss\                     5 + 3
  12-medical-pharmacology\              10 + 4
  13-context-culture-development\       12 + 4
  14-ethics-law\                        13 + 4
  15-transdiagnostic-processes\         14 + 3
  _vocab\                               15 concept schemes + formulation-models.json + README.md
  formulation\index.html                (generated)
  _tools\                               validate.ps1, build_formulation.py, formulation_template.html, tests\
```

## How it was built

The wiki was built on 2026-11-06 by a deep-research, multi-agent workflow. The contract (`_schema.md`), the
validator and the vocabulary layer came first. Then one research agent per domain or leaf searched current
guidelines, trials, reviews, manuals and official sites, wrote the pages to the contract, and recorded
every source with how much of it was read (full text, abstract or table of contents). A second agent per
folder then verified the pages adversarially: it rechecked citations, numbers, cutoffs, guideline
currency and copyright limits against the sources, corrected or softened claims, and listed what it could
not confirm. An integrator then merged the source lists (reconciling duplicate keys and splitting keys that
named two different works), wrote the glossary, router, playbook, overview and maintenance files, and ran
the validator until it reported no structure, page, vocabulary or style issues. No research folder failed.

A gap-fill round on 2026-11-07 used the same research, verify and integrate pattern. It added two condition
leaves (`11-conditions/chronic-pain-and-physical-health`, `11-conditions/grief-and-loss`), ADHD pages on
underdiagnosis in women and adults and on emotional dysregulation, rejection sensitivity and sleep, the
treatment plan document, administrative and billing records, perinatal mental health and child anxiety. It
also grew the vocabulary, reworked the formulation page diagrams and tagged previously untagged concepts on
the pages that discuss them (65 concepts gained their first page).

## The vocabulary layer and the formulation page

`_vocab\README.md` describes each scheme. Concept ids are permanent (`em.anxious`, `cb.unlovable`); they are
retired with `deprecated` and `replaced_by`, never renamed. The formulation models in
`formulation-models.json` lay each model out as a grid of slots, and each slot names the schemes whose
concepts may fill it (for example the five-part model's emotion slot uses `em`). `formulation\index.html`
is a self-contained offline page generated from these files: choose a model, fill its slots with
controlled concepts or free text, add ratings, and see links to the pages that explain each concept.

## How to regenerate

From the wiki root, after any change:

```powershell
pwsh -NoProfile -File _tools\validate.ps1 -WriteCatalog   # check, then write _catalog.yaml, _graph.json, vocab see arrays, glossary block
python _tools\build_formulation.py                        # rebuild formulation\index.html from _vocab
pwsh -NoProfile -File _tools\tests\run-tests.ps1           # validator self-test (after any validator or schema change)
```

## Known gaps

These come from the verifiers' unresolved doubts. Each is recorded in more detail in `_maintenance.md` or
in the `Notes` column of `_sources.md`.

- **Blocked primary sources.** Several current documents could not be opened and were checked through
  summaries or archived copies: NICE pages (NG222, NG225, CG185, CG31, NG87 numbering), the NHS Talking
  Therapies manual (caseness and reliable change values come from papers that cite it), the American
  Psychiatric Association psychiatric evaluation, eating disorder and borderline personality disorder
  guidelines (full text), DSM-5-TR text itself, and several state AI-therapy statutes (Illinois,
  California) known only through law-firm summaries.
- **Books read only in part.** Beck 2021, Persons 2008, Martell 2022, Bennett-Levy 2004, Miller and Rollnick
  2023, Resick 2024 and Foa 2019 were checked against tables of contents or excerpts; claims attributed to
  them are kept general or labeled expert consensus.
- **Currency to recheck.** NICE CG31 (OCD) will be replaced (expected February 2027); NICE CG113 (GAD and
  panic) needs an update; the APA 2019 depression guideline was due to expire about 2024; the APA Ethics
  Code revision is in progress; the APA Record Keeping and Supervision guidelines may have been replaced; the
  APSARD adult ADHD guideline is about to be published; DEA telemedicine flexibilities run to December 31,
  2026; Medicare telehealth flexibilities run to the end of 2027; the UK Crime and Policing Act 2026
  reporting duty has no commencement date; HHS access-timing changes to HIPAA are pending.
- **Unverified details.** Instrument licensing terms for many proprietary measures; some cutoffs
  deliberately left out (OCI-R, DOCS, SIAS and SPS; SCARED cutoffs now appear in
  `13-context-culture-development.child-anxiety`); UK records retention periods; the NHS England
  community framework change; ICD-11 codes checked through third-party browsers.
- **Coverage gaps.** Nightmare disorder, circadian rhythm disorders as their own page (delayed sleep phase
  is covered only within ADHD), and adult evidence on suicidality in social anxiety are not covered. Several
  pages sit near the 900-word limit and need a split before anything is added (for example
  `depression.overview`, `health-anxiety.overview` and `13-context-culture-development.children-and-adolescents`).
- **New topics.** 41 topics were added on 2026-11-06 and 4 more on 2026-11-07 (chronic-pain,
  long-term-conditions, billing-and-insurance, sex-and-gender-differences); only a few pages carry each so
  far, and body-image has none yet. Proposed topics not added: reproductive-hormones (use perinatal),
  circadian-rhythms (use sleep), rejection-sensitivity (use emotion-regulation or interpersonal) and
  insurance-and-reimbursement (merged into billing-and-insurance). Retag further pages as they are next
  reviewed.
- **Untagged concepts.** 94 of 676 vocabulary concepts are not yet tagged by any page, mostly background
  factors, behaviors and specific emotions, sensations and beliefs. Tag them only where a page substantially
  discusses them. Pages retagged on 2026-11-07 kept their earlier `reviewed` dates because only the
  `concepts` line changed.
- **Gap-fill round, 2026-11-07: sources not fully read.** NICE pages returned 403 to automated fetching, so
  CG136 1.4.2 and 1.4.5 and NG222 1.4.3 were checked through NICE QS14, NHS copies and indicator IND104, and
  NG193, CG91 and CG192 were read through plain downloads or the UK Government Web Archive; confirm wording
  on the NICE site. Paywalled and read only in part: AMA CPT Assistant 2014 and AAPC 2017 (the 26-minute
  family therapy threshold and midpoint rule; replace with an AMA or CMS source) and ACOG CPG 4 (scope
  only). `Boelen-etal-2006` was not reopened; the grief model is summarized from `Keser-Boelen-2025`.
  Blocked: the federal Medicaid missed-appointment letters (the statement rests on the NC DHHS summary), the
  HRSA maternal hotline page (number confirmed through MMHLA and search results), the Columbia Center for
  Prolonged Grief site (PGDT details from the University of Oslo course page), and the SCARED Pitt PDF
  (cutoffs confirmed through quotations).
- **Gap-fill round, 2026-11-07: details to recheck.** ICD-11 6A05 details for ADHD came from secondary
  copies of the MMS text, and the `WHO-ICD11-2022` row points to the general classification page. The
  prolonged grief criteria were checked against Prigerson 2021 Table 1 (as proposed in August 2020), not
  the printed DSM-5-TR. The Wales Measure section 12 page read was a superseded version. NHS England's
  successor to the Care Programme Approach statement (17 July 2026) could not be opened. Page ranges for
  `Glombiewski-etal-2018` and `Boelen-vandenBout-2010`, the middle authors of `Collardeau-etal-2024` and
  the full title of `Challacombe-etal-2017` need checking on the publisher pages. The Bryant 2014 odds ratio
  interval sits awkwardly with its P value, so pages cite only percentages. The ADA 2026 psychosocial
  recommendation range (5.42 to 5.51 or 5.57) differs between the research notes. PCS licensing differs
  between the Shirley Ryan AbilityLab page (free) and Mapi Research Trust; the wiki follows Mapi.
- **Gap-fill round, 2026-11-07: key naming.** `Young-etal-2020`, `Russell-etal-2013` and
  `Cuijpers-etal-2023` were renamed with the `a` suffix so they pair with the new `b` keys.
  `Stelzer-etal-2020` (volume dated 2019) and `Killikelly-Maercker-2018` (supplement dated 2017) keep their
  online-publication years; their `_sources.md` rows say so. `Kucherer-Byatt-2020` could not be traced and
  was removed from `13-context-culture-development.perinatal-mental-health`.
- **Word limits.** `_schema.md` sets 300 to 900 body words; `validate.ps1` deliberately tolerates 250 to
  1,100 (documented in `_tools\README.md`). Every page is within 300 to 900 as of 2026-11-07.
- **Guidance bullets without an inline key.** 146 `If ... → ... . Because ...` bullets on 87 pages give a
  reason but no `[Key]`; 62 of them are labeled expert consensus and the rest give procedural reasons. Add a
  key only after checking that a source on the page supports the bullet.
