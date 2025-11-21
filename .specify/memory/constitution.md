<!--
Sync Impact Report:
- Version change: 1.1.0 -> 1.1.1
- Modified principles:
  - Principle VI: Firebase Integration (added hosting)
- Templates requiring updates:
  - `.specify/templates/plan-template.md` (✅ updated)
- Follow-up TODOs:
  - TODO(RATIFICATION_DATE): Needs to be set to the date of the first version.
-->
# speckit Constitution

## Core Principles

### I. Library-First
Every feature starts as a standalone library; Libraries must be self-contained, independently testable, documented; Clear purpose required - no organizational-only libraries

### II. CLI Interface
Every library exposes functionality via CLI; Text in/out protocol: stdin/args → stdout, errors → stderr; Support JSON + human-readable formats

### III. Test-First (NON-NEGOTIABLE)
TDD mandatory: Tests written → User approved → Tests fail → Then implement; Red-Green-Refactor cycle strictly enforced

### IV. Integration Testing
Focus areas requiring integration tests: New library contract tests, Contract changes, Inter-service communication, Shared schemas

### V. Observability, VI. Versioning & Breaking Changes, VII. Simplicity
Text I/O ensures debuggability; Structured logging required; Or: MAJOR.MINOR.BUILD format; Or: Start simple, YAGNI principles

### VI. Firebase Integration
Use Firebase products and services for auth, database, storage, hosting, and generative AI.

## Additional Constraints

Technology stack requirements, compliance standards, deployment policies.

## Development Workflow

Code review requirements, testing gates, deployment approval process.

## Governance

All PRs/reviews must verify compliance; Complexity must be justified; Use `speckit.constitution` for runtime development guidance

**Version**: 1.1.1 | **Ratified**: 2025-11-21 | **Last Amended**: 2025-11-21