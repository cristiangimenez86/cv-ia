# HR CV Review Skill Specification

## Purpose
Define expected behavior for a reusable HR-focused CV review skill that provides structured evaluation, ATS checks, and actionable rewrite guidance tailored to user context.

## Requirements

### Requirement: Provide Structured HR CV Evaluation
The system SHALL provide a reusable skill that evaluates CV content using a Senior HR lens and returns structured feedback with an overall score and rationale.

#### Scenario: Evaluate complete CV input
- **WHEN** the user asks to review a CV and provides the relevant content
- **THEN** the skill returns a structured assessment that includes overall score, strengths, weaknesses, and decision rationale

#### Scenario: Evaluate partial CV input
- **WHEN** the user provides only selected sections (for example, summary and experience)
- **THEN** the skill evaluates available content, explicitly calls out missing sections, and limits conclusions to provided evidence

### Requirement: Apply ATS Compatibility Checks
The system MUST evaluate ATS-relevant quality signals, including role-title clarity, keyword alignment, chronology consistency, and parse-friendly structure.

#### Scenario: ATS risk detection
- **WHEN** the CV contains ambiguous titles, weak keywords, or formatting patterns that can degrade parsing
- **THEN** the skill flags ATS risks and provides specific corrective actions

### Requirement: Prioritize Actionable Improvements
The system SHALL provide prioritized recommendations grouped by impact level so users can fix the highest-value issues first.

#### Scenario: Prioritized recommendations output
- **WHEN** the skill identifies multiple issues
- **THEN** it orders recommendations by priority (high, medium, low) and explains expected impact on recruiter screening outcomes

### Requirement: Provide Concrete Rewrite Suggestions
The system SHALL include rewritten examples for weak CV statements while preserving factual claims from user-provided content.

#### Scenario: Rewrite low-impact bullet
- **WHEN** a bullet point is task-oriented and lacks measurable impact
- **THEN** the skill proposes at least one stronger rewrite with clearer action and outcome framing

### Requirement: Adapt Review to Target Role Context
The system MUST adapt its evaluation criteria to the role, seniority, and market context provided by the user.

#### Scenario: Role-specific review request
- **WHEN** the user specifies a target role (for example, Senior Full Stack .NET Developer)
- **THEN** the skill weights recommendations toward role-relevant competencies and vocabulary

#### Scenario: Missing role context
- **WHEN** no target role is provided
- **THEN** the skill asks for role context or proceeds with a generic baseline while clearly stating reduced specificity
