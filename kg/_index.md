# CBT Knowledge Graph: Router

This wiki holds the reference knowledge a cognitive behavioral therapy (CBT) therapist needs across one
episode of care: what to capture at intake, how to assess risk, diagnose, formulate, plan, run sessions,
respond to clients turn by turn, measure progress and end well, plus the condition-specific, medical,
cultural, ethical and legal knowledge behind those tasks. It has 31 domains and leaves, 394 pages and a
vocabulary layer of 676 controlled concepts and 24 formulation models. Start here: this file routes a
question to at most two domains.

**Safety first.** If a client may be at imminent risk of suicide, self-harm or harming others, stop reading
and act: go to `02-risk.crisis-response`. Crisis contacts: in the United States, 988 Suicide & Crisis
Lifeline (call or text 988) or 911; in the United Kingdom, 999, National Health Service (NHS) 111 (mental
health option) or Samaritans 116 123. This wiki is reference material. It does not replace training,
clinical supervision, local policy or local law, and who may diagnose, prescribe or treat differs by
license and country.

## Read protocol

1. **Route.** Match the question to at most 2 rows of the Domains table below by "Route here when". Check
   "Not here" before committing. A safety question always routes to `02-risk` first.
2. **Pick pages.** Open the chosen domain's `_index.md`. Use "Decisions in order" (or "Pages in order" in a
   leaf) for sequence, then pick at most 4 pages by their Summary, Applies when and Depth columns. L1 is
   orientation, L2 is working knowledge, L3 is specialist detail.
3. **Read the Bottom line first.** Every page opens with `**Bottom line:**`, which answers the page's
   question on its own. Read further only for the steps, guidance bullets or evidence you need.
4. **Follow links sparingly.** Follow a page's `related` ids at most 2 hops. A `caution` relation means the
   target needs care or adaptation alongside this page; read it before acting.
5. **Check the pitfalls.** Each domain lists its pitfall pages, whose summaries describe what going wrong
   looks like. Scan them when a plan is not working.
6. **Cite what you use.** Load-bearing claims carry `[Key]` citations; full references are in `_sources.md`.

Shortcuts:
- `_playbook.md` gives the order of work across the whole episode of care, with page ids for each step.
- `_glossary.md` defines terms and lists aliases (for example "case conceptualization" means case formulation).
- `_catalog.yaml` lists every page's frontmatter in one file: grep it for a symptom, keyword, topic,
  concept id or `applies_when` phrase to find pages without opening indexes.
- `_vocab\*.json` hold the controlled concepts (situations, emotions, thoughts, beliefs, behaviors,
  processes, interventions, measures, risk indicators); each concept's `see` lists the pages that discuss it.
- `formulation\index.html` is an offline page for recording a formulation with a chosen model (five-part,
  cognitive conceptualization diagram, five Ps, disorder-specific models).

## Domains

| Domain | Route here when | Not here |
|---|---|---|
| [01-intake: Intake and Information Capture](01-intake/_index.md) | First contact through the agreed plan: consent, the risk screen, presenting problem, history, structured interviews, collateral, goals and expectations, socializing the client to CBT. | Full suicide assessment (`02-risk`); diagnostic reasoning (`10-diagnosis`); building the formulation (`03-formulation`). |
| [02-risk: Risk and Safety](02-risk/_index.md) | Any suicidal thought, self-harm, violent ideation, abuse or neglect concern, or crisis; risk tools, safety planning, crisis response and risk documentation. | Legal duties in detail (`14-ethics-law`); hopelessness and self-criticism as in-session responses once risk is assessed (`06-therapeutic-relationship/responding-in-session`). |
| [03-formulation: Case Formulation](03-formulation/_index.md) | Turning assessment data into a shared explanation: levels of cognition, five-part model, cognitive conceptualization diagram, five Ps, maintenance cycles, choosing a disorder model, sharing the formulation. | Disorder-specific models in depth (the condition leaf's `cbt-model` page); processes across diagnoses (`15-transdiagnostic-processes`). |
| [04-treatment-planning: Treatment Planning](04-treatment-planning/_index.md) | Problem list and goals, stepped care and intensity, which guideline-recommended treatment, session number and frequency, the written treatment plan document and payer requirements, combining with medication, non-response, when CBT is not indicated. | Running individual sessions (`05-session-structure`); medication facts (`12-medical-pharmacology`). |
| [05-session-structure: Session Structure and Documentation](05-session-structure/_index.md) | How a treatment session runs and is recorded: mood check and bridge, agenda, homework design and review, summaries and feedback, session notes, competence scales, video or phone sessions. | What to say turn by turn (`06-therapeutic-relationship/responding-in-session`); records law and retention (`14-ethics-law`). |
| [06-therapeutic-relationship/alliance-and-stance: Alliance and Therapist Stance](06-therapeutic-relationship/alliance-and-stance/_index.md) | The relationship factors that predict outcome: alliance, empathy, positive regard, genuineness, collaborative empiricism, hope, client feedback, therapist skills, rupture and repair, self-disclosure and boundaries. | Concrete wording for the next reply (`06-therapeutic-relationship/responding-in-session`); boundary law and codes (`14-ethics-law`). |
| [06-therapeutic-relationship/responding-in-session: Responding in Session](06-therapeutic-relationship/responding-in-session/_index.md) | How to respond to what a client just said: listening moves, reflections, Socratic dialogue, validation, strong emotion, ambivalence, psychoeducation, pacing, tone, hopelessness, and a phrasing library. The main source for designing therapist or tool responses. | Any sign of suicide or self-harm risk (`02-risk` first); technique protocols (`07-interventions/cognitive`, `07-interventions/behavioral`). |
| [07-interventions/cognitive: Cognitive Interventions](07-interventions/cognitive/_index.md) | Techniques for thoughts, images and beliefs: identifying automatic thoughts, thought records, restructuring, downward arrow, distortions, intermediate and core belief work, imagery rescripting, worry and rumination methods, self-compassion. | Behavior and exposure work (`07-interventions/behavioral`); a full disorder protocol (the condition leaf's `treatment` page). |
| [07-interventions/behavioral: Behavioral and Exposure Interventions](07-interventions/behavioral/_index.md) | Techniques that work through behavior: activity monitoring and scheduling, behavioral activation, exposure principles, hierarchies and types, ERP, safety behavior reduction, behavioral experiments, problem solving, relaxation, skills training. | Thought-level techniques (`07-interventions/cognitive`); condition-specific exposure protocols (the condition leaf). |
| [08-measurement: Measurement](08-measurement/_index.md) | Choosing and scoring measures (depression, anxiety, trauma, OCD and others), idiographic ratings, process measures, cutoffs, reliable and clinically significant change, licensing, measurement-based care. | Risk scales such as the C-SSRS (`02-risk`); diagnostic interviews (`01-intake`). |
| [09-ending: Ending and Relapse Prevention](09-ending/_index.md) | When to end, planning the ending, the relapse prevention blueprint, lapse versus relapse, boosters and continuation sessions, discharge summary, dropout, referral and handover. | Condition-specific relapse prevention such as MBCT (the condition leaf); records retention law (`14-ethics-law`). |
| [10-diagnosis: Diagnosis and Classification](10-diagnosis/_index.md) | Using DSM-5-TR and ICD as working tools: differential diagnosis, comorbidity and what to treat first, the Cultural Formulation Interview, sharing a diagnosis, ICD-10-CM coding and ICD-11, scope of practice. | Criteria facts for one disorder (that condition's `overview` page); structured interviews (`01-intake`). |
| [11-conditions/depression: Depression](11-conditions/depression/_index.md) | Major depressive disorder or persistent depressive disorder: diagnosis, measures, CBT model, first-line protocol, chronic depression and CBASP, relapse prevention and MBCT, adaptations. | Bipolar depression (`11-conditions/bipolar-and-psychosis`); grief-dominated low mood after a death (`11-conditions/grief-and-loss`); behavioral activation technique detail (`07-interventions/behavioral`). |
| [11-conditions/panic-and-phobias: Panic Disorder, Agoraphobia and Specific Phobia](11-conditions/panic-and-phobias/_index.md) | Panic attacks, panic disorder, agoraphobia or a specific phobia: diagnosis, models, CBT with interoceptive and in vivo exposure, one-session treatment, adaptations. | Fear of illness (`11-conditions/health-anxiety`); social fears (`11-conditions/social-anxiety`). |
| [11-conditions/social-anxiety: Social Anxiety Disorder](11-conditions/social-anxiety/_index.md) | Fear of scrutiny or negative evaluation: diagnosis, measures, the Clark and Wells model, cognitive therapy for social anxiety disorder, video feedback, attention training, behavioral experiments. | Avoidant personality disorder (`11-conditions/personality-disorders`); panic in social settings (`11-conditions/panic-and-phobias`). |
| [11-conditions/gad: Generalized Anxiety Disorder](11-conditions/gad/_index.md) | Excessive, hard-to-control worry about many things: diagnosis, measures, worry models compared, intolerance of uncertainty, metacognitive and applied relaxation protocols, adaptations. | Worry as a process in other disorders (`15-transdiagnostic-processes`); illness worry (`11-conditions/health-anxiety`). |
| [11-conditions/ocd: Obsessive-Compulsive and Related Disorders](11-conditions/ocd/_index.md) | Obsessions and compulsions, including mental compulsions and reassurance seeking; ERP protocol, family accommodation; brief coverage of body dysmorphic disorder, hoarding, hair pulling and skin picking. | Generic exposure principles (`07-interventions/behavioral`); illness preoccupation (`11-conditions/health-anxiety`). |
| [11-conditions/ptsd: PTSD and Trauma](11-conditions/ptsd/_index.md) | Trauma reactions: PTSD, acute stress disorder, complex PTSD; assessment and measures, CBT models, cognitive processing therapy, prolonged exposure, cognitive therapy for PTSD, early intervention, children. | Current abuse or safeguarding concerns (`02-risk`); dissociation in borderline personality disorder (`11-conditions/personality-disorders`). |
| [11-conditions/health-anxiety: Health Anxiety](11-conditions/health-anxiety/_index.md) | Fear of having a serious illness, illness anxiety disorder, somatic symptom disorder, persistent physical symptoms, reassurance seeking about health, medical review rules. | New or changing physical symptoms that need a doctor (`12-medical-pharmacology.when-to-refer-medically`); panic sensations (`11-conditions/panic-and-phobias`); living with diagnosed chronic pain or a long-term condition (`11-conditions/chronic-pain-and-physical-health`). |
| [11-conditions/eating-disorders: Eating Disorders](11-conditions/eating-disorders/_index.md) | Anorexia nervosa, bulimia nervosa, binge-eating disorder, other specified eating disorders and ARFID: assessment, medical risk, the transdiagnostic model, CBT-E stages, adaptations. | Perfectionism as a general process (`15-transdiagnostic-processes`); weight or physical danger signs go to `eating-disorders.medical-risk` first. |
| [11-conditions/adhd: ADHD](11-conditions/adhd/_index.md) | ADHD in children and adults: criteria, informant assessment and rating scales, differential and comorbidity, underdiagnosis in women and adults diagnosed late, emotional dysregulation, rejection sensitivity and sleep, the adult CBT model, adult CBT modules, parent and school programs, medication alongside CBT. | Medication pharmacology (`12-medical-pharmacology.adhd-medications`); autism adaptations (`13-context-culture-development`). |
| [11-conditions/insomnia: Insomnia](11-conditions/insomnia/_index.md) | Insomnia disorder or sleep as a comorbid problem: sleep diary, models, CBT-I components (sleep restriction, stimulus control), brief and digital CBT-I, adaptations. | Possible sleep apnea or other sleep disorders needing medical review (`12-medical-pharmacology.when-to-refer-medically`); hypnotics (`12-medical-pharmacology`). |
| [11-conditions/bipolar-and-psychosis: Bipolar Disorder and Psychosis](11-conditions/bipolar-and-psychosis/_index.md) | Recognizing, assessing and adapting CBT for bipolar disorder, psychosis and at-risk mental states; CBTp, bipolar relapse prevention, family work, collaborating with the treating team. | Unipolar depression (`11-conditions/depression`); medication monitoring (`12-medical-pharmacology`). |
| [11-conditions/substance-use: Substance Use](11-conditions/substance-use/_index.md) | Alcohol and drug use disorders: screening, withdrawal and overdose risk, motivational interviewing, skills-based CBT, relapse prevention model, addiction medications, adaptations. | Ambivalence in general (`06-therapeutic-relationship/responding-in-session`); substance-induced symptoms in differential diagnosis (`10-diagnosis`). |
| [11-conditions/personality-disorders: Personality Disorders](11-conditions/personality-disorders/_index.md) | Personality disorders and traits as they affect CBT, especially borderline personality disorder: assessment, models, structured treatment, DBT-informed skills, schema therapy, chronic risk and crises. | Acute suicide risk (`02-risk`); complex PTSD (`11-conditions/ptsd`). |
| [11-conditions/chronic-pain-and-physical-health: Chronic Pain and Long-Term Physical Health Conditions](11-conditions/chronic-pain-and-physical-health/_index.md) | Distress, low mood, fear or disability in a client living with chronic pain or a long-term condition such as diabetes, coronary heart disease or cancer: definitions, measures, the fear-avoidance model, CBT and ACT for pain, depression with physical illness, working with the medical team. | Fear of having an undiagnosed illness (`11-conditions/health-anxiety`); new or changing symptoms needing a doctor (`12-medical-pharmacology.when-to-refer-medically`). |
| [11-conditions/grief-and-loss: Grief and Loss](11-conditions/grief-and-loss/_index.md) | Grief after the death of someone close and prolonged grief disorder: normal versus prolonged grief, cultural mourning norms, PG-13-R and ICG, the Boelen model, grief-focused CBT and prolonged grief disorder therapy, suicide risk after loss. | Depression without a central loss (`11-conditions/depression`); trauma memories of a violent death dominating (`11-conditions/ptsd`). |
| [12-medical-pharmacology: Medical and Pharmacology Basics](12-medical-pharmacology/_index.md) | Medical mimics, red flags and referral, medication history, antidepressants, anxiolytics and hypnotics, mood stabilizers and antipsychotics, ADHD medicines, medication and CBT interactions, stopping medication, working with prescribers. | Whether to combine therapy with medication as a plan (`04-treatment-planning`); prescribing decisions, which belong to prescribers. |
| [13-context-culture-development: Context, Culture and Development](13-context-culture-development/_index.md) | Adapting CBT for culture, identity and minority stress, religion, socioeconomic context, interpreters, children and adolescents (including child anxiety, separation anxiety and selective mutism), perinatal mental health, older adults, autism, intellectual disability and low literacy. | Cultural Formulation Interview procedure (`10-diagnosis`); consent rules for minors (`14-ethics-law`). |
| [14-ethics-law: Ethics and Law](14-ethics-law/_index.md) | Consent, confidentiality and its limits, HIPAA and GDPR, records, administrative and billing records (CPT codes, Good Faith Estimates, fees), duty to warn, mandatory reporting, boundaries, competence and supervision, telehealth law, professional codes, digital and AI tools, AI scribes and recording. | Clinical risk assessment (`02-risk`); writing session notes (`05-session-structure`). Not legal advice: check current local law. |
| [15-transdiagnostic-processes: Transdiagnostic Processes](15-transdiagnostic-processes/_index.md) | Processes that maintain problems across diagnoses: avoidance, safety behaviors, worry, rumination, intolerance of uncertainty, attention, thought suppression, perfectionism, self-criticism and shame, emotion regulation, cognitive distortions; transdiagnostic treatments. | Techniques to change them (`07-interventions/cognitive`, `07-interventions/behavioral`); one disorder's full model (the condition leaf). |

## Top-level files

| File | What it is |
|---|---|
| `_index.md` | This router. |
| `_schema.md` | The contract: page format, frontmatter, controlled vocabularies, index formats, sources, vocabulary layer, content rules. |
| `_sources.md` | One row per citation key used anywhere in the wiki. |
| `_glossary.md` | Terms with definitions and the page that explains each; generated controlled vocabulary; aliases. |
| `_playbook.md` | The episode of care as numbered steps, with what to capture and which pages to read. |
| `_overview.md` | What the wiki contains, counts, folder tree, how it was built and known gaps. |
| `_maintenance.md` | How to change the wiki safely, the operations and their touch-lists, and the changelog. |
| `_catalog.yaml` | Generated: every page's frontmatter in one file, for grep. |
| `_graph.json` | Generated: the knowledge graph of domains, pages, concepts, models and sources. |
| `_vocab\` | The controlled vocabulary: 15 concept schemes and the formulation models. |
| `formulation\index.html` | Generated: offline formulation recording page built from `_vocab`. |
| `_tools\` | `validate.ps1` (checks and generates), `build_formulation.py`, tests. |
