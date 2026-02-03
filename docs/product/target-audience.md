# Target Audience & Priorities

## Primary audience (must pass)
Recruiters / HR and ATS-style CV parsers.

The site and content must be easily scannable, keyword-rich, and structured in a way that automated parsers can extract:
- Roles, companies, dates, locations
- Core skills and tech stack
- Achievements with measurable impact

**AI/ATS parsing:** The site must be **usable by AI tools and ATS** that HR uses to extract CV data. See `docs/product/ai-ats-parsing.md` for requirements. In short: content in initial HTML (no JS-only rendering), semantic structure, text in DOM (not images), correct `lang` attribute, and metadata per locale.

## Secondary audience (must convince)
Tech Leads / Engineering Managers.
After passing the initial screening, the CV must provide enough technical depth to validate seniority:
- Architecture decisions and trade-offs
- Cloud/DevOps experience
- Reliability, scalability, security concerns
- Concrete examples and outcomes

## Design implications
- Content-first and text-first (no critical info only inside visuals).
- Clear section headings and consistent structure.
- Bilingual content must preserve structure and meaning across ES/EN.
