## ADDED Requirements

### Requirement: Canonical verification command set
The project MUST define a canonical verification command set covering lint, build, tests, and integration startup checks for both frontend and backend services.

#### Scenario: Local pre-merge verification
- **WHEN** a contributor runs the documented verification commands before creating a pull request
- **THEN** they can validate lint, build, and test status for both services using the same command set expected in CI

#### Scenario: CI verification execution
- **WHEN** CI executes the canonical verification command set
- **THEN** failures are reported by stage (lint, build, tests, integration) with non-zero exit behavior

### Requirement: Verification guidance includes exact commands
The project MUST document exact, executable commands required to validate scaffold correctness in local environments.

#### Scenario: New contributor validation
- **WHEN** a new contributor follows verification guidance after bootstrap
- **THEN** they can execute each command as written without inferring missing flags or parameters

#### Scenario: Integration readiness validation
- **WHEN** verification guidance reaches runtime checks
- **THEN** it includes an explicit health check against backend readiness and a pass/fail expectation
