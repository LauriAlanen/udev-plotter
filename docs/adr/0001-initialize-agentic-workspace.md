# 1. Initialize Agentic Workspace

Date: 2026-09-08

## Context
We are starting the development of `udev-plotter`, a tool for visualizing `udevadm monitor` output. To ensure that future LLM agents can effectively contribute to this codebase without supervision creep or architectural drift, we need a standard set of rules and an established documentation structure.

## Decision
We will initialize a strictly lightweight agentic workspace consisting of:
1. An `AGENTS.md` file at the root to serve as a core manifesto and system prompt for future agents.
2. An ADR (Architecture Decision Record) log in `docs/adr/` to record architectural changes concisely.

## Consequences
- **Positive**: Future agents will have a strictly defined operating procedure, preventing unexpected or unapproved code changes. Documentation will be optimized for LLM context windows.
- **Negative**: Adds a slight overhead to making quick architectural changes, as they must be preceded by an ADR.
