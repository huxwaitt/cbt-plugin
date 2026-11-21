---
id: 02-risk.pitfall-risk-label-as-prediction
title: Treating a Risk Label or Score as a Prediction
type: pitfall
summary: A client rated "low risk" by a checklist or score is discharged, not followed up, or not offered treatment, and the label replaces a formulation and a plan.
depth: L2
stage: [assessment, treatment, any]
topics: [risk, suicide, documentation]
concepts: []
applies_when: A service or clinician uses risk categories or tool scores to decide who gets care, discharge or follow-up.
not_for: For how to assess properly read `02-risk.suicide-risk-assessment`; for writing the decision read `02-risk.risk-documentation`.
sources:
  - Franklin-etal-2017 § Abstract
  - Large-etal-2016 § Abstract
  - Carter-etal-2017 § Abstract
  - Ribeiro-etal-2016 § Abstract
  - NICE-NG225 § Risk assessment tools and scales
  - Mughal-etal-2023 § Psychosocial assessment not risk assessment
  - VA-DoD-Suicide-CPG-2024 § Recommendation 4; Routine Care A.c Predictive Analytics
  - MIRECC-TRM-2024 § Acute and chronic risk table
related:
  - {id: 02-risk.suicide-risk-assessment, rel: see-also}
  - {id: 02-risk.risk-documentation, rel: see-also}
  - {id: 02-risk.ongoing-risk-monitoring, rel: see-also}
  - {id: 14-ethics-law.digital-and-ai-tools, rel: caution}
reviewed: 2026-11-06
---

**Bottom line:** Risk categories and scores do not predict which individual will attempt or die by suicide; most people labeled high risk do not, and many who do were labeled lower risk [Large-etal-2016] [Carter-etal-2017]. Use levels only to choose actions and resources, and never to withhold assessment, treatment or follow-up [NICE-NG225].

## What it looks like

- A form totals risk factors and outputs "low", and the note ends there.
- A "low risk" client is discharged from the emergency department or closed to the service without a safety plan or follow-up.
- Therapy access depends on a "high risk" label, or a "high risk" label leads to exclusion from outpatient work.
- An algorithm or artificial intelligence (AI)-assisted tool flags or clears clients, and staff act on the flag without a clinical conversation.

## Why it happens

Services need a quick, auditable way to allocate scarce resources, and a number feels objective and defensible. US accreditation by The Joint Commission requires documented stratification [VA-DoD-Suicide-CPG-2024]. But the base rate of suicide is low, which caps the positive predictive value of any classification: the pooled value for suicide was 5.5%, and the authors found no "high-risk" classification clinically useful [Carter-etal-2017]. High-risk categories showed 56% sensitivity and 79% specificity [Large-etal-2016]. Across 50 years of studies, risk factors predicted suicidal thoughts and behaviors only slightly better than chance [Franklin-etal-2017], and prior self-injury gave areas under the curve of only 0.60 to 0.62 [Ribeiro-etal-2016]. Predictive models built on health records classify most people correctly as not at risk, but among those flagged as at risk they are right only about 1% of the time [VA-DoD-Suicide-CPG-2024].

## The fix

- If you must assign a level → rate acute and chronic risk separately, write the drivers next to each level, and link each to actions. Because levels are useful only as a guide to management [MIRECC-TRM-2024].
- If a client is rated low risk → still give a safety plan where ideation is present, crisis contacts and a follow-up date. Because a large share of suicides occur outside the high-risk group [Large-etal-2016].
- If a tool score disagrees with your clinical picture → act on the clinical picture and document why. Because the US guideline found no evidence favoring any specific stratification tool [VA-DoD-Suicide-CPG-2024].
- If you are designing a screening or AI tool → make outputs prompts for a clinician conversation, never automatic clearance or exclusion. Because flags from predictive models are mostly false positives [VA-DoD-Suicide-CPG-2024].
- If you work under UK guidance → replace global low, medium or high ratings with a formulation of needs and a safety plan. Because the UK National Institute for Health and Care Excellence (NICE) advises against tools and global stratification for prediction or care allocation [NICE-NG225] [Mughal-etal-2023].

## Sources note

The predictive figures come from meta-analyses [Franklin-etal-2017] [Large-etal-2016] [Carter-etal-2017]. US and UK guidance differ on whether to stratify at all: US accreditation expects it while NICE advises against global stratification; both agree it must not replace individualized assessment.
