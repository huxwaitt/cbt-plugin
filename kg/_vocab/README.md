# _vocab: the fixed CBT vocabulary

This folder is the vocabulary layer of the CBT Knowledge Graph (`_schema.md` section 10). It holds one JSON
file per concept scheme: a fixed, shared set of codes for what a CBT therapist records, formulates, treats and
measures. Pages tag the concepts they discuss, formulation models name the schemes that fill each slot, and
`_tools\validate.ps1` checks every file and builds the graph from it.

Current totals: 676 concepts in 15 concept schemes, plus 24 formulation models.
Every file is UTF-8 JSON with 2-space indent and parses with `json.load`.

## Schemes

| Prefix | File | Title | Count | What it codes |
|---|---|---|---|---|
| `fm` | `formulation-models.json` | Formulation models | 24 models | Formulation diagrams as slot grids; each slot names the schemes that fill it. |
| `sit` | `situations-triggers.json` | Situations and triggers | 43 concepts | In-the-moment triggers: external situations and internal events. |
| `bf` | `background-factors.json` | Background factors (five Ps) | 58 concepts | Life history and life events: predisposing, precipitating and protective factors. |
| `cd` | `cognitive-distortions.json` | Cognitive distortions (thinking traps) | 20 concepts | How an automatic thought is biased (thinking traps). |
| `tt` | `thought-themes.json` | Thought themes (content of automatic thoughts) | 24 concepts | What automatic thoughts are about (content themes), with linked emotions. |
| `em` | `emotions.json` | Emotions (moods) | 51 concepts | Feeling words a client names and rates 0 to 100. |
| `bs` | `body-sensations.json` | Body sensations (physical reactions) | 39 concepts | Physical sensations a client notices. |
| `bh` | `behaviors.json` | Behaviors | 55 concepts | Situation-level acts: what the client does or stops doing. |
| `cs` | `coping-strategies.json` | Coping strategies (compensatory and adaptive) | 35 concepts | Cross-situational coping patterns, compensatory and adaptive. |
| `cb` | `core-beliefs.json` | Core beliefs | 37 concepts | Global beliefs about self, others, world and future. |
| `ib` | `intermediate-beliefs.json` | Intermediate beliefs (rules, assumptions, attitudes) | 42 concepts | Rules, conditional assumptions and attitudes, including metacognitive and disorder-specific beliefs. |
| `mp` | `maintenance-processes.json` | Maintenance processes (what keeps problems going) | 43 concepts | Processes and cycles that keep a problem going. |
| `iv` | `interventions.json` | CBT interventions and techniques | 76 concepts | Techniques and treatments the therapist delivers. |
| `ms` | `measures.json` | Measures and instruments | 49 concepts | Instruments, with construct, items, licensing and population. |
| `ts` | `therapist-skills.json` | Therapist skills (in-session response codes) | 65 concepts | Therapist response codes for session talk, mapped to MITI 4 and MISC 2.5. |
| `rk` | `risk-indicators.json` | Risk indicators (suicide, self-harm, harm to others, safeguarding) | 39 concepts | Risk documentation codes: suicide, self-harm, harm to others, safeguarding. |

## How pages tag concepts

- A page lists concept ids in its frontmatter `concepts` flow list, for example
  `concepts: [mp.avoidance-cycle, bh.overt-avoidance, iv.exposure-therapy]`. `[]` is allowed.
- Tag only concepts the page substantially discusses: a section, a table row or a worked example, not a
  passing mention. Most pages need 2 to 8 tags.
- Use the exact id from the list below. `validate.ps1` reports any id that does not exist.
- Never edit a concept's `see` array by hand. `validate.ps1 -WriteCatalog` fills it with the ids of the
  pages that tag that concept.
- Formulation model ids (`fm.*`) are valid tags for a page that teaches that model; the model's own
  `page` field already links it to its main page.
- Need a concept that is missing? Do not invent an id in a page. Propose it, and it is added to the right
  scheme first.

## Which scheme to use

A concept lives in exactly one scheme. The same idea can appear at more than one level of the cognitive
model, and each level is a different concept, because formulation slots code them separately. Pick by level:

- Trigger in the moment: `sit`. Life history or life event: `bf`.
- Content of an automatic thought: `tt`. The bias in how it was reached: `cd`.
- Enduring belief: `cb` (global, about self, others, world or future) or `ib` (rule, assumption, attitude).
- Feeling: `em`. Body sensation: `bs`. One act in a situation: `bh`. Cross-situational coping pattern: `cs`.
- The cycle or process that keeps the problem going: `mp`.
- What the therapist delivers: `iv` (technique) or `ts` (in-session response). Instrument: `ms`.
- Risk documentation that has no general equivalent: `rk`.

Boundaries settled during consolidation (2026-11-06):

- Hopelessness, perceived burdensomeness and entrapment are thought themes (`tt.hopelessness`,
  `tt.burdensomeness`, `tt.entrapment`). Risk pages tag those ids; the `tt` definitions flag the suicide risk.
  The feeling is `em.hopeless`; the core belief is `cb.future-hopeless`.
- General risk and protective factors use their home scheme: `bf.social-isolation`, `bf.social-support`,
  `bf.coping-skills`, `bf.community-belonging`, `bf.chronic-physical-condition`, `bf.substance-use-change`,
  `bh.social-withdrawal`, `bh.impulsive-risk-taking`. `rk` keeps only risk-specific codes and links to these.
- Inflated responsibility, thought-action fusion and overvaluation of shape and weight are beliefs:
  `ib.inflated-responsibility`, `ib.thought-action-fusion-likelihood`, `ib.thought-action-fusion-moral`,
  `ib.worth-judged-by-shape-weight`. The processes that act on them are `mp.misinterpretation-of-intrusions`
  and `mp.dietary-restraint-cycle`. The thought content is `tt.inflated-responsibility`,
  `tt.significance-of-thoughts` and `tt.shape-weight-and-eating-control`.
- Paired levels that stay separate on purpose (each links to the other with `related`): `em.helpless` and
  `cb.helpless`; `ib.need-for-certainty` and `mp.intolerance-of-uncertainty`; `ib.must-be-perfect`,
  `cs.perfectionistic-striving` and `mp.clinical-perfectionism`; `cs.avoiding-negative-emotion` and
  `mp.experiential-avoidance`; `bh.*` acts and their `mp.*` cycles; `cs.problem-solving` (client skill) and
  `iv.problem-solving-therapy` (treatment); `ts.normalizing` (response) and `iv.normalizing-rationale` (CBTp).
- Psychoeducation and collaborative goal setting are therapist skills (`ts.psychoeducation`,
  `ts.collaborative-goal-setting`); urge surfing and opposite action are coping strategies (`cs.urge-surfing`,
  `cs.opposite-action`).

Boundaries settled in the 2026-11-07 extension:

- Pain catastrophizing is a process (`mp.pain-catastrophizing`), separate from the thinking trap
  `cd.catastrophizing`; the belief behind pain-related fear is `ib.pain-means-harm`, the cycle is
  `mp.fear-avoidance-cycle`, and the act is `bh.movement-avoidance`.
- Grief: `em.yearning` (for someone who died, broader `em.grief`) differs from `em.longing` (for someone or
  somewhere not lost for good). The Boelen processes are `mp.poor-loss-integration`,
  `mp.anxious-avoidance-of-loss` and `mp.depressive-avoidance-after-loss`; the act is `bh.loss-reminder-avoidance`.
- Immediacy has no code of its own: it is an alt label of `ts.repair-metacommunication`. Offering an inference
  for correction is `ts.tentative-hypothesis`; stating it as fact is the clairvoyance error.
- TRAP and TRAC are two codes (`iv.trap-analysis`, `iv.trac-plan`); if-then plans are
  `iv.implementation-intentions`. The ADHD optimism loop is its own model, `fm.adhd-procrastination-trap`;
  `fm.adult-adhd` is unchanged.

## Ids, changes and retirement

- Concept id: `<prefix>.<slug>`, lowercase letters, digits and hyphens. Ids are permanent: never rename one
  and never reuse one for a different meaning. Labels, definitions and links may be improved in place.
- To retire a concept, keep it in its file and add `"deprecated": true` and `"replaced_by": "<id>"`. Pages
  that tag it are then moved to the replacement. `validate.ps1` checks that `replaced_by` exists.
- `broader` is null or one id in the same scheme. `related` may point into any scheme and must resolve.
- Duplicates removed in the 2026-11-06 consolidation were deleted, not deprecated, because no page had
  tagged them yet. From now on, retire instead of deleting.
- After any change, re-run `pwsh -NoProfile -File _tools\validate.ps1` and update the list below.

## Concept list

Every concept and model, as `id | label | group`, in file order. This list is complete and current as of
2026-11-07.

### fm: Formulation models (24)

```text
fm.five-part | Five-part model (hot cross bun) | generic cross-sectional
fm.cognitive-conceptualization-diagram | Cognitive conceptualization diagram (Beck) | generic longitudinal
fm.five-ps | Five Ps longitudinal formulation | generic longitudinal
fm.functional-analysis-abc | Functional analysis (ABC) | generic cross-sectional
fm.behavior-chain | Behavior chain analysis (DBT) | self-harm and emotion dysregulation
fm.vicious-flower | Vicious flower: six cycles maintenance model (Moorey) | depression
fm.depression-maintenance-cycle | Depression maintenance cycle (cognitive triad, withdrawal and rumination) | depression
fm.panic-cycle | Panic cycle (Clark) | anxiety
fm.social-anxiety | Social anxiety model (Clark and Wells) | anxiety
fm.ocd | OCD model (Salkovskis) | anxiety
fm.ptsd | PTSD model (Ehlers and Clark) | trauma
fm.gad-intolerance-of-uncertainty | Intolerance of uncertainty model of GAD (Dugas) | anxiety
fm.gad-metacognitive | Metacognitive model of GAD (Wells) | anxiety
fm.health-anxiety | Health anxiety model (Salkovskis and Warwick) | anxiety
fm.eating-disorders-transdiagnostic | Transdiagnostic eating disorder model (Fairburn, CBT-E) | eating
fm.insomnia-cognitive | Cognitive model of insomnia (Harvey) | sleep
fm.insomnia-3p | 3P model of insomnia (Spielman) | sleep
fm.psychosis-cbtp | Cognitive model of psychosis (Garety and Morrison) | psychosis and bipolar
fm.bipolar | Integrative cognitive model of bipolar disorder (Mansell) | psychosis and bipolar
fm.adult-adhd | CBT model of adult ADHD (Safren) | neurodevelopmental
fm.adhd-procrastination-trap | Positively valenced avoidance loop in adult ADHD (Knouse and Mitchell) | neurodevelopmental
fm.strengths-resilience | Strengths-based resilience model (Padesky and Mooney) | strengths
fm.relapse-process | Relapse process model (Marlatt) | substance use
fm.suicidal-mode | Suicidal mode (Rudd) | suicide risk
```

### sit: Situations and triggers (43)

```text
sit.criticism | Criticism or disapproval | external-social
sit.rejection-or-exclusion | Rejection or exclusion | external-social
sit.interpersonal-conflict | Interpersonal conflict | external-social
sit.being-observed | Being observed | external-social
sit.social-interaction | Social interaction | external-social
sit.public-performance | Performing in front of others | external-social
sit.praise-or-attention | Praise or being the center of attention | external-social
sit.asserting-needs | Needing to assert oneself | external-social
sit.social-comparison | Comparison with others | external-social
sit.separation-or-abandonment-cue | Separation or signs of abandonment | external-social
sit.social-pressure-to-use | Social pressure to use substances | external-social
sit.being-alone | Being alone | external-social
sit.positive-event | Positive events and successes | external-social
sit.performance-evaluation | Tests and evaluations | external-task
sit.task-start | Starting a task | external-task
sit.deadline-or-time-pressure | Deadlines and time pressure | external-task
sit.mistake-or-setback | Mistakes and setbacks | external-task
sit.decision-making | Having to make a decision | external-task
sit.unstructured-time | Unstructured time | external-task
sit.responsibility-for-harm | Situations carrying responsibility for harm | external-task
sit.agoraphobic-situations | Crowded or hard-to-leave places | external-environment
sit.phobic-stimulus | Specific feared object or situation | external-environment
sit.trauma-reminder | Trauma reminders | external-environment
sit.loss-reminder | Reminders of a loss | external-environment
sit.health-information | Health information and illness cues | external-environment
sit.medical-appointment-or-test | Medical appointments and tests | external-environment
sit.eating-situation | Eating situations | external-environment
sit.body-image-cue | Body image cues | external-environment
sit.bedtime | Bedtime and night waking | external-environment
sit.substance-cue | Substance cues | external-environment
sit.contamination-cue | Contamination cues | external-environment
sit.uncertainty-or-waiting | Uncertainty and waiting | external-environment
sit.change-in-routine | Changes in routine or plans | external-environment
sit.arousal-sensations | Noticing arousal sensations | internal-body
sit.bodily-change-or-symptom | Noticing a bodily change or symptom | internal-body
sit.fatigue-or-sleep-loss | Tiredness or lack of sleep | internal-body
sit.hunger-or-dietary-restriction | Hunger or dietary restriction | internal-body
sit.pain-or-illness-flare | Pain or illness flare | internal-body
sit.intrusive-thought-or-impulse | Intrusive thought or impulse | internal-mental
sit.intrusive-memory | Unwanted memory | internal-mental
sit.distressing-mental-image | Distressing mental image | internal-mental
sit.mood-shift | Noticing a change in mood | internal-mental
sit.urge-or-craving | Urge or craving | internal-mental
```

### bf: Background factors (five Ps) (58)

```text
bf.childhood-criticism | Critical or demanding upbringing | predisposing
bf.childhood-emotional-neglect | Childhood emotional neglect | predisposing
bf.childhood-physical-neglect | Childhood physical neglect | predisposing
bf.childhood-emotional-abuse | Childhood emotional abuse | predisposing
bf.childhood-physical-abuse | Childhood physical abuse | predisposing
bf.childhood-sexual-abuse | Childhood sexual abuse | predisposing
bf.childhood-domestic-violence-exposure | Witnessing violence at home | predisposing
bf.bullying | Bullying or peer victimization | predisposing
bf.early-loss-or-separation | Early loss or separation | predisposing
bf.overprotective-parenting | Overprotective or controlling parenting | predisposing
bf.unstable-home | Unstable or chaotic home | predisposing
bf.caregiver-mental-illness-or-substance-use | Caregiver mental illness or substance use | predisposing
bf.invalidating-environment | Invalidating environment | predisposing
bf.learned-fear | Learned fear through others | predisposing
bf.early-illness-experience | Early experience of illness | predisposing
bf.prior-trauma-exposure | Earlier trauma exposure | predisposing
bf.discrimination-and-minority-stress | Discrimination and minority stress | predisposing
bf.socioeconomic-disadvantage | Socioeconomic disadvantage | predisposing
bf.behavioral-inhibition | Shy or inhibited temperament | predisposing
bf.high-negative-emotionality | High negative emotionality | predisposing
bf.impulsive-temperament | Impulsive or sensation-seeking temperament | predisposing
bf.family-history-of-mental-illness | Family history of mental health problems | predisposing
bf.adhd | ADHD or lifelong attention difficulties | predisposing
bf.autism | Autism or autistic traits | predisposing
bf.learning-or-intellectual-disability | Learning or intellectual disability | predisposing
bf.brain-injury-or-birth-complications | Brain injury or birth complications | predisposing
bf.chronic-physical-condition | Long-term physical condition or disability | predisposing
bf.previous-episodes | Previous episodes | predisposing
bf.social-isolation | Social isolation or no confidant | predisposing
bf.bereavement | Bereavement | precipitating
bf.relationship-breakup | Relationship breakup or divorce | precipitating
bf.job-loss | Job loss or unemployment | precipitating
bf.work-or-study-stress | Work or study stress | precipitating
bf.financial-crisis | Financial crisis | precipitating
bf.new-illness-or-injury | New illness, injury or diagnosis | precipitating
bf.perinatal-period | Pregnancy, childbirth or pregnancy loss | precipitating
bf.relocation-or-migration | Relocation or migration | precipitating
bf.recent-traumatic-event | Recent traumatic event | precipitating
bf.relationship-difficulties | Ongoing relationship difficulties | precipitating
bf.caregiving-burden | Caregiving burden | precipitating
bf.role-transition | Life transition | precipitating
bf.legal-problems | Legal problems | precipitating
bf.medication-change | Change in medication | precipitating
bf.substance-use-change | Onset or increase of substance use | precipitating
bf.goal-attainment-event | Major success or goal attainment | precipitating
bf.sleep-schedule-disruption | Disrupted sleep schedule or routine | precipitating
bf.humiliating-event | Humiliating or shaming event | precipitating
bf.social-support | Social support | protective
bf.secure-early-relationship | Secure early relationship | protective
bf.coping-skills | Coping and problem-solving skills | protective
bf.personal-strengths | Personal strengths and qualities | protective
bf.values-and-purpose | Values and sense of purpose | protective
bf.faith-or-spiritual-community | Faith or spiritual practice | protective
bf.community-belonging | Cultural and community belonging | protective
bf.meaningful-occupation | Meaningful work, study or role | protective
bf.material-stability | Financial and housing stability | protective
bf.interests-and-hobbies | Interests and enjoyable activities | protective
bf.past-successful-coping | Past experiences of coping | protective
```

### cd: Cognitive distortions (thinking traps) (20)

```text
cd.all-or-nothing-thinking | All-or-nothing thinking | Extreme and global judgments
cd.overgeneralization | Overgeneralization | Extreme and global judgments
cd.labeling | Labeling | Extreme and global judgments
cd.mental-filter | Mental filter | Filtering the evidence
cd.disqualifying-the-positive | Disqualifying the positive | Filtering the evidence
cd.magnification-and-minimization | Magnification and minimization | Filtering the evidence
cd.jumping-to-conclusions | Jumping to conclusions | Jumping to conclusions
cd.mind-reading | Mind reading | Jumping to conclusions
cd.fortune-telling | Fortune telling | Jumping to conclusions
cd.emotional-reasoning | Emotional reasoning | Jumping to conclusions
cd.catastrophizing | Catastrophizing | Threat appraisal
cd.underestimating-coping | Underestimating coping | Threat appraisal
cd.should-statements | Should statements | Rules and demands
cd.low-frustration-tolerance | Low frustration tolerance | Rules and demands
cd.personalization | Personalization | Responsibility and comparison
cd.blaming | Blaming | Responsibility and comparison
cd.hindsight-bias | Hindsight bias | Responsibility and comparison
cd.unfair-comparisons | Unfair comparisons | Responsibility and comparison
cd.overly-optimistic-thinking | Overly optimistic thinking | Procrastination thinking (ADHD)
cd.permission-giving-thoughts | Permission-giving thoughts | Procrastination thinking (ADHD)
```

### tt: Thought themes (content of automatic thoughts) (24)

```text
tt.loss-and-defeat | Loss and defeat | Loss and failure
tt.inadequacy-and-failure | Inadequacy and failure | Loss and failure
tt.abandonment-and-rejection | Abandonment and rejection | Loss and failure
tt.hopelessness | Hopelessness | Despair and suicide risk
tt.burdensomeness | Perceived burdensomeness | Despair and suicide risk
tt.entrapment | Entrapment | Despair and suicide risk
tt.threat-and-danger | Threat and danger | Threat and danger
tt.vulnerability | Vulnerability | Threat and danger
tt.physical-catastrophe | Physical catastrophe | Threat and danger
tt.serious-illness | Serious illness | Threat and danger
tt.loss-of-control | Loss of control | Threat and danger
tt.negative-evaluation | Negative evaluation | Threat and danger
tt.sleep-loss-consequences | Sleep loss and its consequences | Threat and danger
tt.contamination | Contamination | Obsessional themes
tt.inflated-responsibility | Inflated responsibility for harm | Obsessional themes
tt.significance-of-thoughts | Significance of thoughts | Obsessional themes
tt.violation-and-unfairness | Violation and unfairness | Morality and the self
tt.transgression | Transgression | Morality and the self
tt.defect-and-exposure | Defect and exposure | Morality and the self
tt.permanent-change-after-trauma | Permanent damage after trauma | Trauma
tt.shape-weight-and-eating-control | Shape, weight and eating control | Body and appearance
tt.appearance-defect | Appearance defect | Body and appearance
tt.persecution | Persecution | Psychosis and mania
tt.personal-gain-and-grandiosity | Personal gain and grandiosity | Psychosis and mania
```

### em: Emotions (moods) (51)

```text
em.anxious | Anxious | Fear and anxiety
em.afraid | Afraid | Fear and anxiety
em.panicky | Panicky | Fear and anxiety
em.dread | Dread | Fear and anxiety
em.overwhelmed | Overwhelmed | Fear and anxiety
em.suspicious | Suspicious | Fear and anxiety
em.sad | Sad | Sadness
em.depressed | Depressed | Sadness
em.grief | Grief | Sadness
em.disappointed | Disappointed | Sadness
em.angry | Angry | Anger
em.irritated | Irritated | Anger
em.frustrated | Frustrated | Anger
em.resentful | Resentful | Anger
em.ashamed | Ashamed | Shame
em.embarrassed | Embarrassed | Shame
em.humiliated | Humiliated | Shame
em.guilty | Guilty | Guilt
em.regretful | Regretful | Guilt
em.disgusted | Disgusted | Disgust
em.self-disgust | Self-disgust | Disgust
em.contaminated | Feeling dirty (mental contamination) | Disgust
em.hurt | Hurt | Hurt
em.rejected | Rejected | Hurt
em.betrayed | Betrayed | Hurt
em.lonely | Lonely | Loneliness
em.longing | Longing | Loneliness
em.jealous | Jealous | Jealousy and envy
em.envious | Envious | Jealousy and envy
em.hopeless | Hopeless | Hopelessness
em.helpless | Helpless | Hopelessness
em.defeated | Defeated | Hopelessness
em.trapped | Trapped | Hopelessness
em.discouraged | Discouraged | Hopelessness
em.numb | Numb | Numbness and emptiness
em.empty | Empty | Numbness and emptiness
em.anhedonic | Unable to enjoy (anhedonia) | Numbness and emptiness
em.bored | Bored | Numbness and emptiness
em.happy | Happy | Positive emotions
em.enjoyment | Enjoyment (pleasure) | Positive emotions
em.accomplished | Sense of achievement (mastery) | Positive emotions
em.proud | Proud | Positive emotions
em.calm | Calm | Positive emotions
em.soothed | Soothed (safe and comforted) | Positive emotions
em.hopeful | Hopeful | Positive emotions
em.confident | Confident | Positive emotions
em.interested | Interested | Positive emotions
em.connected | Connected (loved and close) | Positive emotions
em.relieved | Relieved | Positive emotions
em.elated | Elated | Positive emotions
em.yearning | Yearning (for someone who died) | Sadness
```

### bs: Body sensations (physical reactions) (39)

```text
bs.racing-heart | Racing or pounding heart | Autonomic arousal and panic
bs.breathlessness | Shortness of breath | Autonomic arousal and panic
bs.choking | Choking sensation or lump in throat | Autonomic arousal and panic
bs.chest-tightness | Chest tightness or pain | Autonomic arousal and panic
bs.dizziness | Dizziness or lightheadedness | Autonomic arousal and panic
bs.jelly-legs | Weak or jelly legs | Autonomic arousal and panic
bs.trembling | Trembling or shaking | Autonomic arousal and panic
bs.sweating | Sweating | Autonomic arousal and panic
bs.hot-cold-flushes | Hot flushes or chills | Autonomic arousal and panic
bs.tingling | Tingling or numbness | Autonomic arousal and panic
bs.dry-mouth | Dry mouth | Autonomic arousal and panic
bs.blushing | Blushing | Autonomic arousal and panic
bs.startle | Jumpy or easily startled | Autonomic arousal and panic
bs.muscle-tension | Muscle tension | Muscular tension
bs.aches-and-pains | Aches and pains | Muscular tension
bs.restlessness | Restlessness | Muscular tension
bs.butterflies | Butterflies or churning stomach | Gastrointestinal
bs.nausea | Nausea | Gastrointestinal
bs.toilet-urgency | Sudden need for the toilet | Gastrointestinal
bs.stomach-pain | Stomach pain or sinking feeling | Gastrointestinal
bs.fatigue | Fatigue | Fatigue and low energy
bs.heaviness | Heavy limbs | Fatigue and low energy
bs.slowed-down | Slowed down | Fatigue and low energy
bs.bedtime-arousal | Wired at bedtime | Sleep-related
bs.daytime-sleepiness | Daytime sleepiness | Sleep-related
bs.unrefreshing-sleep | Waking unrefreshed | Sleep-related
bs.night-panic | Waking in panic | Sleep-related
bs.derealization | Derealization | Dissociative
bs.depersonalization | Depersonalization | Dissociative
bs.blanking-out | Blanking out | Dissociative
bs.freeze | Frozen (freeze response) | Dissociative
bs.heat-rising | Heat rising (anger) | Anger arousal
bs.clenching | Clenched jaw or fists | Anger arousal
bs.about-to-explode | Pressure to explode | Anger arousal
bs.hunger | Intense hunger | Eating and fullness
bs.fullness | Fullness or bloating | Eating and fullness
bs.feeling-fat | Feeling fat | Eating and fullness
bs.poor-appetite | Loss of appetite | Eating and fullness
bs.tearful | Tearful | Sadness and grief
```

### bh: Behaviors (55)

```text
bh.overt-avoidance | Overt avoidance | avoidance and escape
bh.subtle-avoidance | Subtle avoidance | avoidance and escape
bh.escape | Escape | avoidance and escape
bh.interoceptive-avoidance | Avoiding bodily sensations | avoidance and escape
bh.trauma-reminder-avoidance | Avoiding trauma reminders | avoidance and escape
bh.distraction-to-avoid | Avoidant distraction | avoidance and escape
bh.procrastination | Procrastination | avoidance and escape
bh.numbing-activities | Escapist or numbing activities | avoidance and escape
bh.in-situation-safety-behavior | In-situation safety behavior | safety behaviors
bh.safety-objects | Carrying safety objects | safety behaviors
bh.relying-on-safe-person | Relying on a safe person | safety behaviors
bh.concealing-anxiety-signs | Concealing signs of anxiety | safety behaviors
bh.mental-rehearsal | Rehearsing and monitoring speech | safety behaviors
bh.reassurance-seeking | Reassurance seeking | safety behaviors
bh.checking | Checking | compulsions and repetitive behaviors
bh.washing-cleaning | Washing or cleaning compulsions | compulsions and repetitive behaviors
bh.ordering-arranging | Ordering or arranging compulsions | compulsions and repetitive behaviors
bh.repeating-counting | Repeating or counting rituals | compulsions and repetitive behaviors
bh.mental-ritual | Mental rituals | compulsions and repetitive behaviors
bh.neutralizing | Neutralizing | compulsions and repetitive behaviors
bh.excessive-acquiring | Excessive acquiring | compulsions and repetitive behaviors
bh.saving-items | Saving and not discarding | compulsions and repetitive behaviors
bh.body-focused-repetitive-behavior | Body-focused repetitive behavior | compulsions and repetitive behaviors
bh.social-withdrawal | Social withdrawal | withdrawal and inactivity
bh.inactivity | Inactivity | withdrawal and inactivity
bh.neglecting-self-care | Neglecting self-care and routines | withdrawal and inactivity
bh.binge-eating | Binge eating | eating
bh.dietary-restriction | Dietary restriction | eating
bh.compensatory-behaviors | Compensatory behaviors in eating disorders | eating
bh.driven-exercise | Driven exercise | eating
bh.emotional-eating | Eating to cope with emotions | eating
bh.body-checking | Body checking | body image
bh.body-avoidance | Body avoidance | body image
bh.camouflaging | Camouflaging appearance | body image
bh.symptom-checking | Checking the body for illness | health anxiety behaviors
bh.seeking-medical-tests | Seeking medical reassurance and tests | health anxiety behaviors
bh.symptom-searching | Searching for health information | health anxiety behaviors
bh.avoiding-medical-care | Avoiding medical care | health anxiety behaviors
bh.substance-use-to-cope | Substance use to cope | risk and impulsive behaviors
bh.self-harm | Self-harm | risk and impulsive behaviors
bh.aggression | Aggression | risk and impulsive behaviors
bh.impulsive-risk-taking | Impulsive risk-taking | risk and impulsive behaviors
bh.ascent-behaviors | Revving-up behaviors | risk and impulsive behaviors
bh.appeasing | Appeasing or people-pleasing acts | interpersonal
bh.self-silencing | Self-silencing | interpersonal
bh.overworking | Overworking | work and performance
bh.redoing-and-overcorrecting | Redoing and overcorrecting work | work and performance
bh.excess-time-in-bed | Extra time in bed | sleep-interfering behaviors
bh.daytime-napping | Daytime napping | sleep-interfering behaviors
bh.irregular-sleep-schedule | Irregular sleep schedule | sleep-interfering behaviors
bh.non-sleep-activities-in-bed | Wakeful activities in bed | sleep-interfering behaviors
bh.clock-monitoring | Clock watching | sleep-interfering behaviors
bh.movement-avoidance | Avoiding movement for fear of pain | avoidance and escape
bh.loss-reminder-avoidance | Avoiding reminders of the loss | avoidance and escape
bh.pain-overactivity | Overdoing activity on good days | pain-related activity
```

### cs: Coping strategies (compensatory and adaptive) (35)

```text
cs.avoiding-negative-emotion | Avoiding negative emotion | compensatory
cs.perfectionistic-striving | Perfectionistic striving | compensatory
cs.overpreparation | Overpreparation | compensatory
cs.overresponsibility | Overresponsibility | compensatory
cs.avoiding-intimacy | Avoiding intimacy | compensatory
cs.seeking-recognition | Seeking recognition | compensatory
cs.attention-seeking | Attention seeking | compensatory
cs.avoiding-confrontation | Avoiding confrontation | compensatory
cs.overcontrol | Overcontrol | compensatory
cs.dependence-on-others | Dependence on others | compensatory
cs.pleasing-others | Pleasing others | compensatory
cs.excessive-self-reliance | Excessive self-reliance | compensatory
cs.hypervigilance-to-others | Hypervigilance to others | compensatory
cs.self-sacrifice | Self-sacrifice | compensatory
cs.avoiding-challenges | Avoiding challenges | compensatory
cs.asserting-superiority | Asserting superiority | compensatory
cs.rigid-rule-following | Rigid rule-following | compensatory
cs.concealing-vulnerability | Concealing vulnerability | compensatory
cs.problem-solving | Problem solving | adaptive
cs.seeking-emotional-support | Seeking emotional support | adaptive
cs.seeking-practical-help | Seeking practical help | adaptive
cs.self-soothing | Self-soothing | adaptive
cs.acceptance | Acceptance | adaptive
cs.balanced-thinking | Balanced thinking | adaptive
cs.self-compassion | Self-compassion | adaptive
cs.mindful-awareness | Mindful awareness | adaptive
cs.calming-the-body | Calming the body | adaptive
cs.healthy-distraction | Planned distraction | adaptive
cs.physical-activity | Physical activity | adaptive
cs.values-based-action | Values-based action | adaptive
cs.assertive-communication | Assertive communication | adaptive
cs.opposite-action | Opposite action | adaptive
cs.urge-surfing | Urge surfing | adaptive
cs.expressive-writing | Expressive writing | adaptive
cs.spiritual-coping | Spiritual or religious coping | adaptive
```

### cb: Core beliefs (37)

```text
cb.helpless | Helpless | Self: helpless
cb.incompetent | Incompetent | Self: helpless
cb.needy | Needy and dependent | Self: helpless
cb.vulnerable | Vulnerable | Self: helpless
cb.powerless | Powerless or trapped | Self: helpless
cb.failure | A failure | Self: helpless
cb.inferior | Inferior to others | Self: helpless
cb.not-good-enough | Not good enough | Self: helpless
cb.unlovable | Unlovable | Self: unlovable
cb.unlikeable | Unlikeable or boring | Self: unlovable
cb.unwanted | Unwanted or unimportant | Self: unlovable
cb.unattractive | Unattractive or undesirable | Self: unlovable
cb.different | Different, does not belong | Self: unlovable
cb.defective | Defective or flawed | Self: unlovable
cb.bound-to-be-rejected | Bound to be rejected or abandoned | Self: unlovable
cb.worthless | Worthless | Self: worthless
cb.bad | Bad or immoral | Self: worthless
cb.dangerous | Dangerous or toxic | Self: worthless
cb.crazy | Crazy or abnormal | Self: worthless
cb.undeserving | Undeserving | Self: worthless
cb.effective | Reasonably competent | Self: adaptive
cb.lovable | Reasonably lovable | Self: adaptive
cb.worthwhile | Worthwhile | Self: adaptive
cb.others-untrustworthy | Others are untrustworthy or dangerous | Others
cb.others-critical | Others are critical and judgmental | Others
cb.others-uncaring | Others are uncaring | Others
cb.others-unreliable | Others are unreliable | Others
cb.others-controlling | Others are controlling or intrusive | Others
cb.others-incompetent | Others are incompetent or irresponsible | Others
cb.others-inferior | Others are inferior | Others
cb.world-dangerous | The world is dangerous | World
cb.world-unpredictable | The world is unpredictable | World
cb.world-unfair | The world is unfair | World
cb.world-demanding | The world is too demanding | World
cb.future-hopeless | The future is hopeless | Future
cb.future-threatening | The future is threatening | Future
cb.future-ruined | Future ruined or foreshortened | Future
```

### ib: Intermediate beliefs (rules, assumptions, attitudes) (42)

```text
ib.must-be-perfect | I must do everything perfectly | Rules and standards
ib.must-be-liked | I must be liked by everyone | Rules and standards
ib.must-put-others-first | I must always put others first | Rules and standards
ib.must-stay-in-control | I must stay in control | Rules and standards
ib.must-cope-alone | I must handle things on my own | Rules and standards
ib.others-must-be-fair | Others must treat me fairly | Rules and standards
ib.self-criticism-motivates | If I'm not hard on myself, I'll fail | Rules and standards
ib.worth-depends-on-achievement | If I fail, I'm worthless | Assumptions about worth and relationships
ib.closeness-leads-to-rejection | If people get close, they'll reject me | Assumptions about worth and relationships
ib.assertion-leads-to-rejection | If I stand up for myself, people will reject me | Assumptions about worth and relationships
ib.trying-leads-to-failure | If I try, I'll fail | Assumptions about worth and relationships
ib.high-social-standards | I must always come across well | Social performance beliefs
ib.visible-anxiety-brings-rejection | If people see I'm anxious, they'll think badly of me | Social performance beliefs
ib.worry-is-helpful | Worrying helps me cope | Metacognitive beliefs about worry and rumination
ib.rumination-is-helpful | Going over things helps me understand | Metacognitive beliefs about worry and rumination
ib.worry-is-uncontrollable | My worry is uncontrollable | Metacognitive beliefs about worry and rumination
ib.worry-is-dangerous | Worrying will harm me | Metacognitive beliefs about worry and rumination
ib.must-control-thoughts | I must control my thoughts | Metacognitive beliefs about worry and rumination
ib.inflated-responsibility | I'm responsible for preventing any harm | Responsibility and thought-action fusion (OCD)
ib.thought-action-fusion-likelihood | Thinking it makes it more likely | Responsibility and thought-action fusion (OCD)
ib.thought-action-fusion-moral | Thinking it is as bad as doing it | Responsibility and thought-action fusion (OCD)
ib.thoughts-reveal-true-self | Having this thought says something about me | Responsibility and thought-action fusion (OCD)
ib.need-for-certainty | I must be completely certain | Responsibility and thought-action fusion (OCD)
ib.emotions-unacceptable | Negative feelings are weak or unacceptable | Beliefs about emotions
ib.emotions-overwhelming | If I let myself feel it, it will overwhelm me | Beliefs about emotions
ib.anxiety-sensations-dangerous | Anxiety symptoms are dangerous | Beliefs about bodily sensations and health
ib.symptoms-mean-serious-illness | Bodily changes mean something is seriously wrong | Beliefs about bodily sensations and health
ib.health-worry-protects | Worrying about my health keeps me safe | Beliefs about bodily sensations and health
ib.need-eight-hours | I need eight hours of sleep | Beliefs about sleep
ib.poor-sleep-ruins-functioning | A bad night will ruin tomorrow | Beliefs about sleep
ib.sleep-out-of-control | I have no control over my sleep | Beliefs about sleep
ib.need-sleep-medication | I need a pill to sleep | Beliefs about sleep
ib.worth-judged-by-shape-weight | My worth depends on my shape and weight | Beliefs about shape, weight and eating
ib.strict-dietary-rules | I must follow strict eating rules | Beliefs about shape, weight and eating
ib.eating-means-losing-control | If I eat this, I'll lose control | Beliefs about shape, weight and eating
ib.substance-anticipatory | Using will make things better | Beliefs about substance use
ib.substance-relief | I need it to cope | Beliefs about substance use
ib.substance-permissive | It's okay to use this time | Beliefs about substance use
ib.high-mood-is-best | When I'm high, I'm at my best | Beliefs about mood states and voices
ib.voices-powerful | The voices are powerful | Beliefs about mood states and voices
ib.pain-means-harm | If it hurts, I'm doing damage | Beliefs about pain
ib.grief-reactions-dangerous | If I let the grief in, I'll fall apart | Beliefs about grief and loss
```

### mp: Maintenance processes (what keeps problems going) (43)

```text
mp.avoidance-cycle | Avoidance cycle | Avoidance and safety seeking
mp.procrastination-cycle | Procrastination cycle | Avoidance and safety seeking
mp.safety-behavior-cycle | Safety behavior cycle | Avoidance and safety seeking
mp.reassurance-cycle | Reassurance-seeking cycle | Avoidance and safety seeking
mp.experiential-avoidance | Experiential avoidance | Avoidance and safety seeking
mp.rumination | Rumination | Repetitive negative thinking
mp.worry | Worry | Repetitive negative thinking
mp.worry-about-worry | Worry about worry (meta-worry) | Repetitive negative thinking
mp.anticipatory-processing | Anticipatory processing | Repetitive negative thinking
mp.post-event-processing | Post-event processing | Repetitive negative thinking
mp.self-focused-attention | Self-focused attention | Attention and information-processing biases
mp.threat-monitoring | Attentional bias and threat monitoring | Attention and information-processing biases
mp.body-focused-monitoring | Body-focused monitoring | Attention and information-processing biases
mp.interpretation-bias | Interpretation bias | Attention and information-processing biases
mp.memory-bias | Memory bias | Attention and information-processing biases
mp.belief-confirming-processing | Belief-confirming processing | Attention and information-processing biases
mp.hasty-data-gathering | Hasty data-gathering bias | Attention and information-processing biases
mp.thought-suppression | Thought suppression | Thought control and appraisal of intrusions
mp.misinterpretation-of-intrusions | Catastrophic misinterpretation of intrusive thoughts | Thought control and appraisal of intrusions
mp.intolerance-of-uncertainty | Intolerance of uncertainty | Uncertainty and standards
mp.clinical-perfectionism | Clinical perfectionism | Uncertainty and standards
mp.catastrophic-misinterpretation-of-bodily-sensations | Catastrophic misinterpretation of bodily sensations | Body and threat appraisal
mp.negative-appraisal-of-trauma | Negative appraisal of trauma and its aftermath | Trauma processes
mp.disjointed-trauma-memory | Disjointed trauma memory | Trauma processes
mp.dietary-restraint-cycle | Dietary restraint and binge cycle | Eating disorder processes
mp.mood-intolerance | Mood intolerance | Eating disorder processes
mp.sleep-effort | Sleep effort and sleep-related worry | Sleep processes
mp.conditioned-arousal | Conditioned arousal to bed and bedtime | Sleep processes
mp.sleep-compensation | Sleep compensation | Sleep processes
mp.withdrawal-inactivity-loop | Withdrawal and inactivity loop | Mood, activity, and self-relating
mp.self-criticism | Self-criticism | Mood, activity, and self-relating
mp.emotion-dysregulation | Emotion dysregulation | Emotion regulation
mp.interpersonal-cycle | Cognitive-interpersonal cycle | Interpersonal and family processes
mp.family-accommodation | Family accommodation | Interpersonal and family processes
mp.substance-relief-cycle | Substance relief cycle | Substance use processes
mp.abstinence-violation-effect | Abstinence violation effect | Substance use processes
mp.extreme-appraisals-of-internal-states | Extreme appraisals of mood and energy changes | Bipolar and psychosis processes
mp.pain-catastrophizing | Pain catastrophizing | Pain processes
mp.fear-avoidance-cycle | Fear-avoidance cycle (pain) | Pain processes
mp.activity-cycling | Overactivity and underactivity cycle | Pain processes
mp.poor-loss-integration | Poor integration of the loss | Grief processes
mp.anxious-avoidance-of-loss | Anxious avoidance of the loss | Grief processes
mp.depressive-avoidance-after-loss | Depressive avoidance after loss | Grief processes
```

### iv: CBT interventions and techniques (76)

```text
iv.identifying-automatic-thoughts | Identifying automatic thoughts | cognitive
iv.cognitive-restructuring | Cognitive restructuring | cognitive
iv.thought-record | Thought record | cognitive
iv.decatastrophizing | Decatastrophizing | cognitive
iv.double-standard-technique | Double-standard technique | cognitive
iv.responsibility-pie-chart | Responsibility pie chart | cognitive
iv.advantages-disadvantages-analysis | Advantages-disadvantages analysis | cognitive
iv.identifying-cognitive-distortions | Identifying cognitive distortions | cognitive
iv.downward-arrow | Downward arrow | cognitive
iv.modifying-rules-and-assumptions | Modifying rules and assumptions | cognitive
iv.core-belief-work | Core belief work | cognitive
iv.positive-data-log | Positive data log | cognitive
iv.continuum-technique | Continuum technique | cognitive
iv.imagery-rescripting | Imagery rescripting | cognitive
iv.worry-postponement | Worry postponement | cognitive
iv.rumination-focused-techniques | Rumination-focused techniques | cognitive
iv.detached-mindfulness | Detached mindfulness | cognitive
iv.behavioral-activation | Behavioral activation | behavioral
iv.activity-monitoring | Activity monitoring | behavioral
iv.activity-scheduling | Activity scheduling | behavioral
iv.graded-task-assignment | Graded task assignment | behavioral
iv.behavioral-experiment | Behavioral experiment | behavioral
iv.problem-solving-therapy | Problem-solving therapy | behavioral
iv.relaxation-training | Relaxation training | behavioral
iv.safety-behavior-reduction | Safety behavior reduction | behavioral
iv.self-monitoring | Self-monitoring | behavioral
iv.interpersonal-effectiveness-training | Interpersonal effectiveness and assertiveness training | behavioral
iv.chain-analysis | Behavior chain analysis | behavioral
iv.exposure-therapy | Exposure | exposure
iv.exposure-hierarchy | Exposure hierarchy | exposure
iv.in-vivo-exposure | In vivo exposure | exposure
iv.imaginal-exposure | Imaginal exposure | exposure
iv.interoceptive-exposure | Interoceptive exposure | exposure
iv.inhibitory-learning-strategies | Inhibitory learning strategies | exposure
iv.emotion-awareness-training | Emotion awareness training | emotion and compassion
iv.mindfulness-based-cognitive-therapy | Mindfulness-based cognitive therapy (MBCT) | emotion and compassion
iv.compassionate-mind-training | Compassionate mind training | emotion and compassion
iv.distress-tolerance-skills | Distress tolerance skills | emotion and compassion
iv.emotion-regulation-skills | Emotion regulation skills training | emotion and compassion
iv.socialization-to-cbt | Socialization to CBT | relational and session process
iv.sharing-the-formulation | Sharing the formulation | relational and session process
iv.action-plan | Action plan (homework) | relational and session process
iv.routine-outcome-monitoring | Routine outcome monitoring with feedback | relational and session process
iv.motivational-interviewing | Motivational interviewing | relational and session process
iv.relapse-prevention-blueprint | Relapse prevention blueprint | relational and session process
iv.booster-sessions | Booster sessions | relational and session process
iv.exposure-and-response-prevention | Exposure and response prevention (ERP) | condition-specific
iv.video-feedback | Video feedback (social anxiety) | condition-specific
iv.cognitive-processing-therapy | Cognitive processing therapy (CPT) | condition-specific
iv.stuck-point-challenging | Stuck point challenging | condition-specific
iv.prolonged-exposure | Prolonged exposure (PE) | condition-specific
iv.cognitive-therapy-for-ptsd | Cognitive therapy for PTSD (CT-PTSD) | condition-specific
iv.cbt-for-insomnia | CBT for insomnia (CBT-I) | condition-specific
iv.sleep-restriction | Sleep restriction | condition-specific
iv.stimulus-control | Stimulus control (insomnia) | condition-specific
iv.sleep-hygiene-education | Sleep hygiene education | condition-specific
iv.cbt-e | Enhanced CBT for eating disorders (CBT-E) | condition-specific
iv.collaborative-weighing | Collaborative weighing | condition-specific
iv.regular-eating | Regular eating | condition-specific
iv.addressing-shape-concern | Addressing shape concern and body checking | condition-specific
iv.behavioral-parent-training | Behavioral parent training | condition-specific
iv.organization-and-planning-skills | Organization, planning and distractibility skills (adult ADHD) | condition-specific
iv.safety-planning | Safety planning | condition-specific
iv.habit-reversal-training | Habit reversal training | condition-specific
iv.contingency-management | Contingency management | condition-specific
iv.high-risk-situation-coping | High-risk situation coping (relapse prevention) | condition-specific
iv.normalizing-rationale | Normalizing rationale (CBT for psychosis) | condition-specific
iv.early-warning-signs-plan | Early warning signs plan (bipolar relapse) | condition-specific
iv.trap-analysis | TRAP analysis (Trigger, Response, Avoidance Pattern) | behavioral
iv.trac-plan | TRAC plan (Trigger, Response, Alternative Coping) | behavioral
iv.implementation-intentions | Implementation intentions (if-then plans) | behavioral
iv.solution-analysis | Solution analysis (DBT) | behavioral
iv.crisis-response-plan | Crisis response plan | condition-specific
iv.activity-pacing | Activity pacing (chronic pain) | condition-specific
iv.graded-exposure-to-movement | Graded exposure to feared movements (chronic pain) | exposure
iv.grief-exposure | Grief exposure (revisiting the loss) | condition-specific
```

### ms: Measures and instruments (49)

```text
ms.phq-9 | Patient Health Questionnaire-9 (PHQ-9) | depression
ms.phq-2 | Patient Health Questionnaire-2 (PHQ-2) | depression
ms.bdi-ii | Beck Depression Inventory-II (BDI-II) | depression
ms.qids-sr16 | Quick Inventory of Depressive Symptomatology, Self-Report (QIDS-SR16) | depression
ms.epds | Edinburgh Postnatal Depression Scale (EPDS) | depression
ms.gad-7 | Generalized Anxiety Disorder-7 (GAD-7) | anxiety
ms.gad-2 | Generalized Anxiety Disorder-2 (GAD-2) | anxiety
ms.bai | Beck Anxiety Inventory (BAI) | anxiety
ms.oasis | Overall Anxiety Severity and Impairment Scale (OASIS) | anxiety
ms.pdss | Panic Disorder Severity Scale (PDSS) | anxiety
ms.asi-3 | Anxiety Sensitivity Index-3 (ASI-3) | anxiety
ms.spin | Social Phobia Inventory (SPIN) | anxiety
ms.lsas | Liebowitz Social Anxiety Scale (LSAS) | anxiety
ms.shai | Short Health Anxiety Inventory (SHAI) | anxiety
ms.pswq | Penn State Worry Questionnaire (PSWQ) | anxiety
ms.ius-12 | Intolerance of Uncertainty Scale-12 (IUS-12) | anxiety
ms.hads | Hospital Anxiety and Depression Scale (HADS) | anxiety
ms.dass-21 | Depression Anxiety Stress Scales-21 (DASS-21) | anxiety
ms.scared | Screen for Child Anxiety Related Disorders (SCARED) | anxiety
ms.rcads | Revised Child Anxiety and Depression Scale (RCADS) | anxiety
ms.pcl-5 | PTSD Checklist for DSM-5 (PCL-5) | trauma and ocd-related
ms.caps-5 | Clinician-Administered PTSD Scale for DSM-5 (CAPS-5) | trauma and ocd-related
ms.itq | International Trauma Questionnaire (ITQ) | trauma and ocd-related
ms.y-bocs | Yale-Brown Obsessive Compulsive Scale (Y-BOCS) | trauma and ocd-related
ms.oci-r | Obsessive-Compulsive Inventory-Revised (OCI-R) | trauma and ocd-related
ms.docs | Dimensional Obsessive-Compulsive Scale (DOCS) | trauma and ocd-related
ms.si-r | Saving Inventory-Revised (SI-R) | trauma and ocd-related
ms.ede-q | Eating Disorder Examination Questionnaire (EDE-Q 6.0) | eating
ms.asrs | Adult ADHD Self-Report Scale v1.1 (ASRS) | adhd
ms.caars-2 | Conners Adult ADHD Rating Scales, 2nd Edition (CAARS 2) | adhd
ms.conners-4 | Conners 4th Edition (Conners 4) | adhd
ms.vanderbilt | NICHQ Vanderbilt Assessment Scales | adhd
ms.isi | Insomnia Severity Index (ISI) | sleep
ms.psqi | Pittsburgh Sleep Quality Index (PSQI) | sleep
ms.consensus-sleep-diary | Consensus Sleep Diary (CSD) | sleep
ms.audit | Alcohol Use Disorders Identification Test (AUDIT) | substance use
ms.audit-c | AUDIT-Consumption (AUDIT-C) | substance use
ms.dast-10 | Drug Abuse Screening Test-10 (DAST-10) | substance use
ms.wsas | Work and Social Adjustment Scale (WSAS) | functioning and general distress
ms.core-10 | CORE-10 | functioning and general distress
ms.ders | Difficulties in Emotion Regulation Scale (DERS) | transdiagnostic process
ms.rrs | Ruminative Responses Scale (RRS) | transdiagnostic process
ms.ors | Outcome Rating Scale (ORS) | process and alliance
ms.srs | Session Rating Scale (SRS) | process and alliance
ms.wai-sr | Working Alliance Inventory-Short Revised (WAI-SR) | process and alliance
ms.cts-r | Cognitive Therapy Scale-Revised (CTS-R) | process and alliance
ms.c-ssrs | Columbia-Suicide Severity Rating Scale (C-SSRS) | risk
ms.suds | Subjective Units of Distress Scale (SUDS) | idiographic
ms.goal-based-outcomes | Goal-based outcomes (GBO) | idiographic
```

### ts: Therapist skills (in-session response codes) (65)

```text
ts.open-question | Open question | questions
ts.closed-question | Closed question | questions
ts.guided-discovery | Guided discovery | guided-discovery
ts.socratic-questioning | Socratic questioning | guided-discovery
ts.socratic-informational-question | Socratic informational question | guided-discovery
ts.socratic-empathic-listening | Empathic listening (Socratic stage) | guided-discovery
ts.socratic-summary | Socratic summary | guided-discovery
ts.socratic-synthesizing-question | Synthesizing or analytical question | guided-discovery
ts.minimal-encourager | Minimal encourager | reflections
ts.simple-reflection | Simple reflection | reflections
ts.complex-reflection | Complex reflection | reflections
ts.double-sided-reflection | Double-sided reflection | reflections
ts.amplified-reflection | Amplified reflection | reflections
ts.reflection-of-feeling | Reflection of feeling | reflections
ts.reflection-of-meaning | Reflection of meaning | reflections
ts.collecting-summary | Collecting summary | summaries
ts.linking-summary | Linking summary | summaries
ts.transitional-summary | Transitional summary | summaries
ts.capsule-summary | Capsule summary | summaries
ts.affirmation | Affirmation | empathy-and-support
ts.empathic-statement | Empathic statement | empathy-and-support
ts.normalizing | Normalizing | empathy-and-support
ts.validation | Validation | validation
ts.validation-level-1 | Validation level 1: attending | validation
ts.validation-level-2 | Validation level 2: accurate reflection | validation
ts.validation-level-3 | Validation level 3: articulating the unverbalized | validation
ts.validation-level-4 | Validation level 4: past learning or biology | validation
ts.validation-level-5 | Validation level 5: reasonable in the present context | validation
ts.validation-level-6 | Validation level 6: radical genuineness | validation
ts.psychoeducation | Psychoeducation | information-and-advice
ts.giving-rationale | Giving a rationale | information-and-advice
ts.asking-permission | Asking permission | information-and-advice
ts.elicit-provide-elicit | Elicit-provide-elicit | information-and-advice
ts.advice-with-permission | Advice with permission | information-and-advice
ts.emphasizing-autonomy | Emphasizing autonomy | information-and-advice
ts.agenda-setting | Agenda setting | structure-and-collaboration
ts.eliciting-feedback | Eliciting feedback | structure-and-collaboration
ts.checking-understanding | Checking understanding | structure-and-collaboration
ts.collaborative-goal-setting | Collaborative goal setting | structure-and-collaboration
ts.reframing | Reframing | reframing
ts.repair-acknowledge-rupture | Acknowledging the rupture | rupture-repair
ts.repair-take-responsibility | Taking responsibility for the rupture | rupture-repair
ts.repair-metacommunication | Metacommunication | rupture-repair
ts.repair-explore-rupture | Exploring the rupture | rupture-repair
ts.repair-change-task | Changing the task or goal | rupture-repair
ts.purposeful-silence | Purposeful silence | pacing-and-relational
ts.self-disclosure | Self-disclosure | pacing-and-relational
ts.humor | Humor | pacing-and-relational
ts.righting-reflex | Righting reflex | avoid
ts.lecturing | Lecturing | avoid
ts.premature-reassurance | Premature reassurance | avoid
ts.arguing | Arguing | avoid
ts.interrupting | Interrupting | avoid
ts.labeling-client | Labeling the client | avoid
ts.premature-advice | Premature advice | avoid
ts.tentative-hypothesis | Tentative hypothesis | reframing
ts.instilling-hope | Instilling hope | empathy-and-support
ts.highlighting-progress | Highlighting progress | empathy-and-support
ts.nonverbal-attunement | Nonverbal attunement | pacing-and-relational
ts.using-client-words | Using the client's words | reflections
ts.plain-language | Plain language | information-and-advice
ts.redirecting-to-agenda | Redirecting to the agenda | structure-and-collaboration
ts.grounding | Grounding in session | strong-emotion
ts.de-escalation | Verbal de-escalation | strong-emotion
ts.direct-suicide-question | Asking directly about suicide | risk-response
```

### rk: Risk indicators (suicide, self-harm, harm to others, safeguarding) (39)

```text
rk.prior-suicide-attempt | Previous suicide attempt | Static risk factors
rk.history-of-self-harm | History of self-harm | Static risk factors
rk.family-history-or-exposure-to-suicide | Family history of or exposure to suicide | Static risk factors
rk.childhood-adversity | Childhood adversity | Static risk factors
rk.history-of-mental-disorder | History of mental disorder | Static risk factors
rk.impulsive-or-aggressive-traits | Impulsive or aggressive traits | Static risk factors
rk.thwarted-belongingness | Thwarted belongingness | Dynamic risk factors
rk.defeat-or-humiliation | Defeat or humiliation | Dynamic risk factors
rk.substance-use-problem | Substance use problem | Dynamic risk factors
rk.acute-life-stressor | Recent major loss or crisis | Dynamic risk factors
rk.access-to-lethal-means | Access to lethal means | Dynamic risk factors
rk.active-psychotic-symptoms | Active psychotic symptoms | Dynamic risk factors
rk.suicidal-communication | Suicidal communication | Warning signs
rk.passive-suicidal-ideation | Passive suicidal ideation | Warning signs
rk.active-suicidal-ideation | Active suicidal ideation | Warning signs
rk.suicidal-intent | Suicidal intent | Warning signs
rk.suicide-plan | Suicide plan | Warning signs
rk.preparatory-behavior | Preparatory behavior | Warning signs
rk.final-arrangements | Final arrangements | Warning signs
rk.unbearable-psychological-pain | Unbearable psychological pain | Warning signs
rk.no-reason-to-live | No reason to live | Warning signs
rk.sleep-change | Marked change in sleep | Warning signs
rk.agitation-or-anger | Agitation or anger | Warning signs
rk.sudden-calm | Sudden calm after despair | Warning signs
rk.reasons-for-living | Reasons for living | Protective factors
rk.responsibility-to-others | Responsibility to others | Protective factors
rk.engagement-with-care | Engagement with care | Protective factors
rk.moral-or-religious-objection | Moral or religious objection to suicide | Protective factors
rk.violent-ideation-or-intent | Violent ideation or intent | Harm to others
rk.threat-to-identifiable-person | Threat to an identifiable person | Harm to others
rk.history-of-violence | History of violence | Harm to others
rk.violent-attitudes | Violent attitudes | Harm to others
rk.intimate-partner-violence-perpetration | Intimate partner violence perpetration | Harm to others
rk.child-maltreatment-concern | Child maltreatment concern | Safeguarding
rk.domestic-abuse-victimization | Domestic abuse victimization | Safeguarding
rk.elder-abuse | Elder abuse | Safeguarding
rk.abuse-of-adult-at-risk | Abuse of an adult at risk | Safeguarding
rk.self-neglect | Self-neglect | Safeguarding
rk.exploitation-or-trafficking | Exploitation or trafficking | Safeguarding
```
