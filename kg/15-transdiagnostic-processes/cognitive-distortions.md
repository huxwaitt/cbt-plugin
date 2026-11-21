---
id: 15-transdiagnostic-processes.cognitive-distortions
title: Cognitive Distortions and the Distortion Vocabulary
type: concept
summary: Explains what cognitive distortions are, where the idea comes from, its limits as evidence, and how this wiki's cognitive distortions vocabulary scheme is structured and used for tagging.
depth: L1-L2
stage: [formulation, treatment]
topics: [cognitive-distortions, cognitive-restructuring, thought-records, digital-and-ai]
concepts: [iv.identifying-cognitive-distortions, iv.cognitive-restructuring, cd.all-or-nothing-thinking, cd.overgeneralization, cd.labeling, cd.mental-filter, cd.jumping-to-conclusions, cd.mind-reading, cd.fortune-telling, cd.catastrophizing, cd.magnification-and-minimization, cd.low-frustration-tolerance, cd.blaming, cd.unfair-comparisons]
applies_when: A clinician or tool designer needs to know what counts as a cognitive distortion, how the named categories relate, and how to tag a client's thought with the cd vocabulary.
not_for: For teaching clients to spot distortions read `cognitive.identifying-cognitive-distortions`; for testing a thought read `cognitive.cognitive-restructuring`.
sources:
  - Beck-1963 § Idiosyncratic content and cognitive distortions
  - Burns-1980 § Ch. 3 Definitions of cognitive distortions
  - Beck-2021 § Ch. 14 Evaluating Automatic Thoughts
  - Bathina-etal-2021 § Abstract
  - Moore-Fresco-2012 § Abstract
  - Morrison-etal-2022 § Abstract
  - Ozdel-etal-2014 § Abstract
related:
  - {id: cognitive.identifying-cognitive-distortions, rel: see-also}
  - {id: cognitive.cognitive-restructuring, rel: see-also}
  - {id: cognitive.thought-records, rel: see-also}
  - {id: 03-formulation.cognitive-model-levels, rel: prerequisite}
  - {id: 14-ethics-law.digital-and-ai-tools, rel: caution}
  - {id: 13-context-culture-development.cultural-humility, rel: caution}
reviewed: 2026-11-06
---

**Bottom line:** A cognitive distortion is a systematic bias in information processing that shows up in an automatic thought, such as all-or-nothing thinking or mind reading. It describes how a thought is biased, not what it is about. Beck introduced the idea from clinical observation of depression [Beck-1963], and Burns popularized a list of named distortions [Burns-1980]. Treat a distortion label as a hypothesis that guides testing, never as proof the thought is false.

## What it is

Cognitive behavioral therapy (CBT) holds that people in emotional distress show biased modes of thinking that affect emotion and motivation [Bathina-etal-2021]. Clinical texts give lists of thinking errors so clients can spot recurring patterns in their automatic thoughts [Beck-2021; Burns-1980]. A distortion is a process feature, so one thought can show several (for example "Everyone will see I'm useless" combines mind reading, overgeneralization and labeling).

Distortions are different from:
- **Thought themes** (loss, threat, failure): what the thought is about.
- **Beliefs** (rules and core beliefs): the more stable assumptions that generate thoughts.
- **Maintenance processes** (rumination, avoidance): what the person does with thoughts over time.

## Why it matters in CBT

- **A shared language.** Naming a pattern helps the client step back and choose a testing question.
- **Measurable.** Self-report tools exist: the 15-item Cognitive Distortions Questionnaire (CD-Quest), with 9-item and 5-item short forms that reproduce the full score well [Morrison-etal-2022], and the Cognitive Distortions Scale, which uses case examples in interpersonal and achievement domains [Ozdel-etal-2014].
- **Linked to distress at scale.** People who reported a depression diagnosis used more distorted-thinking language on social media than a random sample, an effect not explained by topic, sentiment or first-person pronouns [Bathina-etal-2021].

The limits matter as much:
- **Distorted is not the same as wrong.** In a meta-analysis of 75 studies the "depressive realism" effect was small (d = -0.07), and both depressed and nondepressed people showed positive bias, larger in the nondepressed [Moore-Fresco-2012]. A depressed client's negative thought may be accurate.
- **Categories overlap.** Several labels can fit one thought, as in the example above. Use the label that best opens a useful question rather than debating which one is correct.

## Key details

**How this wiki's vocabulary scheme works.** The cognitive distortions scheme (prefix `cd`, file `_vocab\cognitive-distortions.json`) holds 20 concepts in seven groups:

| Group | Concepts |
|---|---|
| Extreme and global judgments | all-or-nothing thinking, overgeneralization, labeling |
| Filtering the evidence | mental filter, disqualifying the positive, magnification and minimization |
| Jumping to conclusions | jumping to conclusions (umbrella), mind reading, fortune telling, emotional reasoning |
| Threat appraisal | catastrophizing, underestimating coping |
| Rules and demands | should statements, low frustration tolerance |
| Responsibility and comparison | personalization, blaming, hindsight bias, unfair comparisons |
| Procrastination thinking (attention-deficit/hyperactivity disorder) | overly optimistic thinking, permission-giving thoughts |

Rules for using it:
1. Tag the automatic thought or hot thought slot in a five-part model, cognitive model or thought record with `cd` concepts; tag what it is about with thought themes (`tt`) and beliefs with `ib` or `cb`.
2. Use the canonical concept, not an alias. The scheme folds overlaps: tunnel vision is an alias of mental filter, probability overestimation of fortune telling, and awfulizing of catastrophizing.
3. Prefer the most specific concept: `cd.mind-reading` rather than the umbrella `cd.jumping-to-conclusions` when the thought is about others' minds.
4. Multiple tags per thought are allowed; record the client's own words alongside the tags.
5. Pages tag a `cd` concept in frontmatter only when they discuss it substantially.

## In the session

- If a thought fits a distortion → offer the label as a question. "Could this be a bit of mind reading? How could we find out what she actually thought?" Because labels prompt testing, not verdicts [Beck-2021].
- If the thought may be accurate → test the evidence and, if it holds, move to problem solving or coping. Because negative thoughts in depression are not reliably less accurate [Moore-Fresco-2012].
- If the client starts using labels to dismiss every thought ("That's just catastrophizing") → slow down and check whether the feeling has shifted. Because naming a pattern is the start of testing, not a replacement for it [Burns-1980].
- If you are building an automated distortion detector → show labels as suggestions a clinician or client confirms, and review cultural and contextual fit. Because distorted-language markers are statistical, not individual diagnoses [Bathina-etal-2021].

What to record: the thought verbatim, belief rating 0 to 100, the `cd` tags agreed with the client, and whether testing supported or revised the thought.
