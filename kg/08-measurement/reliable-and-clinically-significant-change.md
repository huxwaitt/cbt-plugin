---
id: 08-measurement.reliable-and-clinically-significant-change
title: Reliable and Clinically Significant Change
type: procedure
summary: How to apply the Jacobson and Truax reliable change index and clinical cutoffs to one client's scores, classify the outcome, and use the NHS Talking Therapies thresholds.
depth: L2-L3
stage: [treatment, ending]
topics: [measurement, feedback, ending]
concepts: [iv.routine-outcome-monitoring, ms.phq-9, ms.gad-7, ms.pcl-5, ms.isi]
applies_when: A clinician must decide whether a client's score change is real rather than measurement noise, or must classify an end-of-treatment outcome.
not_for: For setting up routine measurement read `08-measurement.measurement-based-care`, and for cutoffs of specific scales read the instrument pages such as `08-measurement.depression-measures`.
sources:
  - Jacobson-Truax-1991 § Abstract
  - Jacobson-etal-1999 § Abstract
  - PSYCTC-RCSC § Reliable change; Clinically significant change
  - Gyani-etal-2013 § Method, Outcome measures; Results
  - Clark-etal-2018 § Methods, Measures of clinical outcome
  - McMillan-etal-2010 § Abstract
  - Lowe-etal-2004 § Abstract
  - Wise-2004 § Abstract
  - NCPTSD-PCL-5 § Clinically meaningful change
  - Morin-etal-2011 § Results
related:
  - {id: 08-measurement.measurement-based-care, rel: part-of}
  - {id: 08-measurement.depression-measures, rel: see-also}
  - {id: 08-measurement.anxiety-measures, rel: see-also}
  - {id: 09-ending.discharge-summary, rel: see-also}
  - {id: 04-treatment-planning.managing-non-response, rel: see-also}
  - {id: 08-measurement.pitfall-overreading-score-changes, rel: caution}
reviewed: 2026-11-06
---

**Bottom line:** A change is reliable when it is larger than the measure's error, judged with the reliable change index (RCI) of Jacobson and Truax [Jacobson-Truax-1991]. A change is clinically significant when the client also moves from the clinical range into the healthy range. Report both together: reliably improved, recovered, no reliable change, or reliably deteriorated. For common measures, use the published thresholds: Patient Health Questionnaire-9 (PHQ-9) change of 6 or more and Generalized Anxiety Disorder-7 (GAD-7) change of 4 or more [Gyani-etal-2013].

## When to use

- At every session review, to decide whether a rise or fall is worth acting on.
- At the end of treatment and at follow-up, to classify the outcome for the record and the discharge summary.
- When a service reports outcomes and needs consistent definitions.

## Steps

1. **Get the inputs.** You need the baseline standard deviation (SD) of the measure in a clinical sample and its reliability (Cronbach's alpha or test-retest). Published values are acceptable if you lack local data [PSYCTC-RCSC].
2. **Compute the reliable change criterion.** Criterion = 1.96 × SD × √2 × √(1 − reliability) [PSYCTC-RCSC]. A change larger than this has less than a 5% chance of being measurement error alone.
   - Worked example (illustrative numbers): SD 6, reliability 0.85. √2 × √0.15 = 0.548; 6 × 0.548 = 3.29; × 1.96 = 6.4. A change of 7 or more points is reliable.
3. **Pick the clinical cutoff.** Jacobson and colleagues define three [PSYCTC-RCSC]:
   - (a) 2 SD beyond the clinical group mean, toward health;
   - (b) within 2 SD of the healthy (normative) group mean;
   - (c) the weighted midpoint between the clinical and normative means, used when norms exist and the groups overlap.
4. **Classify the client.**

| Reliable change? | Crossed cutoff? | Category |
|---|---|---|
| Yes, improved | Yes | Recovered (reliable and clinically significant) |
| Yes, improved | No | Reliably improved |
| No | Either | No reliable change |
| Yes, worse | Either | Reliably deteriorated: review now |

5. **Use national thresholds where they exist.** England's National Health Service (NHS) Talking Therapies program (formerly IAPT) treats a PHQ-9 change greater than 5.20 and a GAD-7 change greater than 3.53 as reliable [Gyani-etal-2013]. Caseness is PHQ-9 of 10 or more and GAD-7 of 8 or more. Reliable improvement means one measure reliably improved and neither reliably worsened. Reliable recovery means reliable improvement plus both scores below caseness at the end, counted only for clients above caseness at the start [Clark-etal-2018].

## What to record

- Baseline and final scores, the measure, and the threshold used, with its source.
- The outcome category from the table.
- For deterioration, the action taken.

## Guidance

- If a score moves by less than the reliable change amount → call it "within the normal ups and downs of the questionnaire" and look at the trend over the next sessions. Because a single small change cannot be separated from error [Jacobson-Truax-1991].
- If the client started below caseness → do not expect reliable improvement and choose a more sensitive target measure. Because in the first year of the English program, 1,024 below-caseness patients had starting scores too low to show reliable improvement on either measure [Gyani-etal-2013].
- If the measure has a published change benchmark → use it, and name the type. Examples: the PHQ-9 minimal clinically important change of 5 points [Lowe-etal-2004]; a 10-point PTSD Checklist for DSM-5 (PCL-5) decrease for response [NCPTSD-PCL-5]; an Insomnia Severity Index reduction of more than 7 for moderate improvement [Morin-etal-2011]. Because "important" and "reliable" are different standards.
- If someone suggests a 50% reduction rule → also report reliable change. Because a reliable change index is preferable to a percentage rule for defining improvement on the PHQ-9 [McMillan-etal-2010].
- If you need to choose among cutoffs a, b and c → use c when normative data exist. Because c is recommended when clinical and nonclinical distributions overlap [McMillan-etal-2010]; one methods source considers a and b meaningless [PSYCTC-RCSC], while the original authors present all three as options [Jacobson-etal-1999].
- If a client reliably deteriorates → say so plainly and plan together: "Your score has gone up by more than the questionnaire's margin of error. Let's look at what might be driving that." Because deterioration needs prompt review, not reassurance.

## Common problems

- **Using the wrong reliability.** Test-retest and internal consistency give different criteria; state which you used. Methods for computing the RCI differ, so record the formula [Wise-2004].
- **Treating categories as precise.** A client who just crosses a cutoff may sit on the boundary and relapse easily [PSYCTC-RCSC].
- **Comparing services with different thresholds.** Only compare like with like.
- **Benchmark for context.** In year one of the English program, 40.3% of treated patients reliably recovered, 63.7% reliably improved and 6.6% reliably deteriorated [Gyani-etal-2013].
