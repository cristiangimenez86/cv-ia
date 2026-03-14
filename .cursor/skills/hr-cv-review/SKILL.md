---
name: hr-cv-review
description: Reviews CV content with a Senior HR and ATS lens, scoring quality and providing prioritized rewrite guidance. Use when the user asks to review, improve, tailor, or optimize a CV/resume for recruiters, ATS screening, or a specific target role.
---

# HR CV Review

## Purpose

Assess CV quality for recruiter screening and ATS parsing, then provide practical, high-impact improvements.

## Required Inputs

Collect these before evaluating:
- CV content (full CV preferred; partial sections allowed).
- Target role and seniority (if missing, ask once and continue with baseline if unavailable).
- Target market/region (optional but recommended).
- Language preference for feedback (mirror the user's language).

If content is partial, explicitly state confidence limits.

## Review Workflow

1. Confirm scope: full CV or selected sections.
2. Apply the rubric from [rubric.md](rubric.md).
3. Identify ATS risks (keyword mismatch, ambiguous titles, weak chronology, parser-hostile structure).
4. Identify recruiter risks (low impact, unclear positioning, weak value proposition).
5. Prioritize actions by expected hiring impact (High/Medium/Low).
6. Provide rewrites for the weakest bullets while preserving facts provided by the user.

## Output Contract (Mandatory)

Always return exactly these sections:

1. **Overall Assessment**
   - Overall score: `0-100`
   - Decision band: `Strong / Competitive / Needs Work / High Risk`
   - One-paragraph rationale

2. **Top Strengths**
   - 3-5 bullets tied to evidence from the CV

3. **Critical Risks**
   - 3-7 bullets with severity labels (`High`, `Medium`, `Low`)
   - Include ATS and recruiter implications

4. **Prioritized Action Plan**
   - Numbered list
   - Each item includes: change to make, why it matters, expected impact

5. **Rewrite Suggestions**
   - 3-6 before/after rewrites
   - Keep claims factual; do not invent metrics

6. **Missing Information**
   - Explicitly list unknowns blocking a stronger evaluation

## Guardrails

- Do not fabricate achievements, tools, dates, or metrics.
- Do not provide legal or salary compliance advice.
- Do not auto-rewrite the entire CV unless user asks.
- Keep feedback specific and evidence-based, not generic.

## Additional Resources

- Detailed scoring criteria: [rubric.md](rubric.md)
- Prompt and response examples: [examples.md](examples.md)
