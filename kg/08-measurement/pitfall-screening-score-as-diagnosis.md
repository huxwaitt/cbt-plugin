---
id: 08-measurement.pitfall-screening-score-as-diagnosis
title: Treating a Screening Score as a Diagnosis
type: pitfall
summary: A client is recorded as having depression, PTSD, ADHD or another disorder because a questionnaire passed its cutoff, with no clinical interview confirming it.
depth: L1-L2
stage: [intake, assessment]
topics: [measurement, diagnosis, differential-diagnosis]
concepts: [ms.phq-9, ms.gad-7, ms.pcl-5, ms.asrs, ms.bdi-ii]
applies_when: A questionnaire score above a cutoff is about to be entered as a diagnosis, shared with the client as one, or used by a tool to label a client.
not_for: For how to diagnose read `10-diagnosis.differential-diagnosis-process` and `01-intake.structured-interviews`.
sources:
  - Levis-etal-2019 § Abstract, Results
  - Ustun-etal-2017 § Abstract
  - Wang-Gorenstein-2013 § Cutoff scores
  - NCPTSD-PCL-5 § Scoring, cutoffs
  - Bovin-etal-2016 § Abstract
  - Kroenke-etal-2010 § Abstract
related:
  - {id: 10-diagnosis.differential-diagnosis-process, rel: see-also}
  - {id: 01-intake.structured-interviews, rel: see-also}
  - {id: 10-diagnosis.scope-of-practice-diagnosis, rel: see-also}
  - {id: 08-measurement.instrument-selection, rel: see-also}
  - {id: 08-measurement.depression-measures, rel: see-also}
reviewed: 2026-11-06
---

**Bottom line:** A score above a screening cutoff means "probable" or "worth assessing", not a diagnosis. Cutoffs trade false positives against false negatives, and the balance shifts with the setting. Confirm with a clinical or structured interview, record the score as a screening result, and keep diagnosis within your scope of practice.

## What it looks like

- A note reads "Patient Health Questionnaire-9 (PHQ-9) = 12, major depressive disorder" with no interview recorded.
- An intake summary says "posttraumatic stress disorder (PTSD)" because the PTSD checklist (PCL-5) was 34.
- An adult is told they have attention-deficit/hyperactivity disorder (ADHD) after a positive screener.
- A digital tool shows the client a diagnostic label generated from a questionnaire total.
- A Beck Depression Inventory-II (BDI-II) cutoff from a psychiatric sample is applied to medical patients.

## Why it happens

- Cutoffs are easy to apply and look objective.
- Screeners are imperfect by design. Even the well-studied PHQ-9 cutoff of 10 has specificity of 0.85 against semistructured interviews [Levis-etal-2019], so some people above the cutoff do not have major depression.
- Accuracy depends on the setting. The Adult ADHD Self-Report Scale updated for the Diagnostic and Statistical Manual of Mental Disorders, fifth edition (DSM-5) had specificity of 96.0% in population data but 74.0% in a specialty clinic [Ustun-etal-2017].
- Cutoffs are tuned for a purpose. For the PCL-5, lower cutoffs suit screening and higher cutoffs suit provisional diagnosis or fewer false positives [NCPTSD-PCL-5]; 31 to 33 was optimally efficient against the clinician interview in veterans [Bovin-etal-2016].
- Published cutoffs vary by sample. BDI-II cutoffs for major depression ranged from 7 to 20 in medical samples and 19 to 31 in psychiatric samples [Wang-Gorenstein-2013].
- Broad screeners overlap. The Generalized Anxiety Disorder-7 (GAD-7) also detects panic, social anxiety and PTSD [Kroenke-etal-2010], so a high score does not identify which anxiety disorder is present.

## The fix

- If a screener is positive → record it as "screen positive (score, cutoff, measure)" and plan a diagnostic interview. Because a screen estimates probability, not presence.
- If you discuss the result with the client → use probabilistic language: "Your answers suggest depression may be part of what's going on. To be sure, I'd like to ask you some more detailed questions." Avoid: "The test shows you have depression."
- If the setting differs from where the cutoff was validated → choose the cutoff validated for your setting, or say the result is uncertain. Because accuracy changes with setting [Ustun-etal-2017].
- If diagnosis is outside your license → refer for diagnostic assessment and say so in the note (see `10-diagnosis.scope-of-practice-diagnosis`). Because who may diagnose varies by license and country.
- If you design a tool → display "score, severity band, and what it may suggest", never a diagnosis, and route positive screens to a clinician. Because even the best-studied cutoff produces false positives [Levis-etal-2019].

## Sources note

The screening statistics above come from an individual participant data meta-analysis [Levis-etal-2019], the official PCL-5 guidance [NCPTSD-PCL-5] and validation studies. Cutoffs for other measures are on the instrument pages in this folder.
