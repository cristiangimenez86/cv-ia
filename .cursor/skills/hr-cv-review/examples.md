# Usage Examples

## Example 1: Full CV review (Spanish)

### User prompt
```
Actua como senior de RRHH. Revisa mi CV para un puesto de Senior Full Stack .NET Developer en Espana.
Quiero foco en ATS y reclutador humano.
[pega CV completo]
```

### Expected response style
- Uses the mandatory output contract from `SKILL.md`.
- Provides 0-100 score and decision band.
- Flags ATS issues and recruiter perception issues separately.
- Suggests prioritized fixes and concrete bullet rewrites.

## Example 2: Partial section review (English)

### User prompt
```
Review only my summary and experience bullets for a Staff Backend Engineer role in UK market.
I care about impact framing and keyword alignment.
[paste sections]
```

### Expected response style
- States that review confidence is limited to provided sections.
- Prioritizes role-fit and achievement clarity.
- Lists missing information needed for final CV-level confidence.

## Example 3: Tailoring to a job description

### User prompt
```
Analyze my CV against this job description and tell me what to change first.
[job description]
[CV content]
```

### Expected response style
- Highlights top keyword and competency gaps.
- Recommends highest-impact edits first.
- Provides before/after rewrites aligned with job language.
