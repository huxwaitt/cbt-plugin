---
id: 10-diagnosis.pitfall-questionnaire-score-as-diagnosis
title: Treating a Questionnaire Score as a Diagnosis
type: pitfall
summary: A PHQ-9, GAD-7 or other screening total above a cutoff is recorded or told to the client as a diagnosis, without a clinical interview of criteria, duration, impairment and exclusions.
depth: L1-L2
stage: [intake, assessment]
topics: [diagnosis, measurement, differential-diagnosis, digital-and-ai]
concepts: [ms.phq-9, ms.gad-7, iv.routine-outcome-monitoring]
applies_when: You or a tool are about to write a diagnosis based mainly on a self-report score, or a client says a questionnaire or app told them they have a disorder.
not_for: For choosing measures read `08-measurement.instrument-selection`; for depression measures read `08-measurement.depression-measures`.
sources:
  - Levis-etal-2019 § Abstract
  - Levis-etal-2020b § Abstract
  - APA-Assessment-Measures § Usage guidance
  - APA-DSM5TR-Update-2025 § Cautionary Statement
  - ACA-Ethics-2014 § E.6.a
related:
  - {id: 08-measurement.depression-measures, rel: see-also}
  - {id: 08-measurement.anxiety-measures, rel: see-also}
  - {id: 08-measurement.instrument-selection, rel: see-also}
  - {id: 10-diagnosis.differential-diagnosis-process, rel: see-also}
  - {id: 14-ethics-law.digital-and-ai-tools, rel: see-also}
reviewed: 2026-11-06
---

**Bottom line:** Screening questionnaires such as the Patient Health Questionnaire-9 (PHQ-9) flag who needs a diagnostic assessment; they do not make the diagnosis. Using a cutoff as a diagnosis roughly doubles the apparent rate of depression and misses medical, substance and bipolar explanations. Interview every criterion, and say "screened positive" until you have.

## What it looks like

- "PHQ-9 = 14, therefore major depressive disorder" in the intake note.
- An app or chatbot tells a user "You have moderate depression" after nine questions.
- A Generalized Anxiety Disorder 7-item scale (GAD-7) total is the only evidence for a generalized anxiety disorder diagnosis on a claim.
- Duration, impairment and exclusions (substance, medical cause, bipolar history) are never asked about.

## Why it happens

- Scores are quick and feel objective; interviews take time.
- Electronic records and billing forms pull scores forward and invite a matching code.
- Designers of digital tools may treat a validated cutoff as a validated diagnosis.

The data show why this fails. The PHQ-9 at a cutoff of 10 or more had sensitivity 0.88 and specificity 0.85 against semi-structured interviews across 29 studies (6,725 participants) [Levis-etal-2019]. That is good for screening, but across 44 studies (9,242 participants) a PHQ-9 of 10 or more gave a pooled depression prevalence of 24.6% against 12.1% by structured interview, about double the true rate [Levis-etal-2020b]. The American Psychiatric Association states that the measures it publishes for the Diagnostic and Statistical Manual of Mental Disorders, Fifth Edition, Text Revision (DSM-5-TR) should enhance clinical decision-making and not be the sole basis for diagnosis [APA-Assessment-Measures].

## The fix

- If a screen is positive → record "screened positive on PHQ-9 (score 14); diagnostic assessment pending," then interview the criteria, duration, impairment and exclusions. Because PHQ-9 cutoffs overestimate depression prevalence [Levis-etal-2020b].
- If a client says an app or questionnaire diagnosed them → take their concern seriously and assess: "That score tells us it's worth looking at more closely. Let's go through what's been happening." Because a cutoff identifies possible cases, not confirmed ones [Levis-etal-2019].
- If you are building a tool → word outputs as "your answers suggest it would be worth talking to a clinician about depression," route positive screens and any risk item to a human, and never write a diagnosis field from a score. Because DSM-5-TR criteria are meant for trained clinicians, not mechanical application [APA-DSM5TR-Update-2025].
- If you use a score in a diagnostic report → state it alongside interview findings and other data. Because conclusions and diagnoses should draw on multiple forms of assessment where possible [ACA-Ethics-2014].
- Keep scores for what they do well: tracking severity and change across sessions (see `08-measurement.measurement-based-care`).

## Sources note

The accuracy figures come from individual participant data meta-analyses by one collaboration; the prevalence comparison showed too much heterogeneity to correct statistically within single studies [Levis-etal-2020b]. The same logic applies to anxiety and trauma screens, though the size of overestimation differs by measure.
