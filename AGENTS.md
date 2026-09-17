# Agent Manifesto: udev-plotter

## Context & Goal
`udev-plotter` is a visualization tool that parses `udevadm monitor` output data to identify bottlenecks, dead space, and blocking issues in udev triggers.

## Workflow & Pipeline
We follow a lean, plan-driven, and human-gated workflow. Each task moves through specific stages (stations). Context is passed between stages via short, discrete files (artifacts) created during each step ("One file in, one file out").

- **Plan** (`/plan`): Write a step-by-step plan. Do not touch code. Output: `plan.md`. **Gate 1**: A human must approve the plan.
- **Implement** (`/implement`): Execute the approved plan strictly without scope creep. Output: `implementation.md`.
- **Verify** (`/verify`): Format files, run test suite, and check changes. Output: `verify.md` (a pass/fail record).
- **Audit** (`/audit`): Read-only check of the diff against rules and ADRs. Output: `audit.md`. Identify and record lessons from recurring problems.
- **Commit** (`/commitprepare`): Group changes and draft house-style commit messages/PR descriptions. Output: `commit.md`. **Gate 2**: A human reviews and merges.
- **Release** (`/release`): Build, run coverage tests, and draft an acceptance report. Output: `test-report.md`.

## Core Rules for Agents
1. **Plan First**: Always propose a step-by-step plan (saving it to `plan.md`) and wait for explicit user approval before writing any code or modifying files.
2. **One File In, One File Out**: Communicate context between workflow stages exclusively through the designated artifact files. Keep them concise.
3. **Quality & Self-Learning**: Audit changes against this document. If a recurring problem is found during the audit stage, extract a one-line lesson to be promoted into these Core Rules.
4. **Document Decisions**: Always update the Architecture Decision Record (ADR) log in `docs/adr/` when making architectural or significant design decisions.
5. **Write Clean Code**: Keep code strictly modular and single-purpose.
6. **Be Concise**: Optimize all text, documentation, and communication for LLM context windows. Stay extremely concise.
7. **Keep Docs Updated**: When adding or modifying a feature, always review and update the relevant documentation to reflect the changes.
8. **Maintain Architecture Docs**: Maintain project architecture documentation in `docs/architecture/`. Whenever a key architectural change is made, update these files to ensure they accurately represent the system's design.
9. **Git Commit Structure**: When making git commits, always format the message with a concise Title, a blank line, and a concise description of the changes (as prepared in `commit.md`).

## Commands & Scripts
*(Reserved for future use: specific commands for testing, linting, and formatting will be documented here once established).*
