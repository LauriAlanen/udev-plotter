# Agent Manifesto: udev-plotter

## Context & Goal
`udev-plotter` is a visualization tool that parses `udevadm monitor` output data to identify bottlenecks, dead space, and blocking issues in udev triggers.

## Core Rules for Agents
1. **Plan First**: Always propose a step-by-step plan and wait for explicit user approval before writing any code or modifying files.
2. **Document Decisions**: Always update the Architecture Decision Record (ADR) log in `docs/adr/` when making architectural or significant design decisions.
3. **Write Clean Code**: Keep code strictly modular and single-purpose.
4. **Be Concise**: Optimize all text, documentation, and communication for LLM context windows. Stay extremely concise.
5. **Keep Docs Updated**: When adding or modifying a feature, always review and update the relevant documentation to reflect the changes.
6. **Maintain Architecture Docs**: Maintain project architecture documentation in `docs/architecture/`. Whenever a key architectural change is made, update these files to ensure they accurately represent the system's design.
7. **Git Commit Structure**: When making git commits, always format the message with a concise Title, a blank line, and a concise description of the changes.

## Commands & Scripts
*(Reserved for future use: specific commands for testing, linting, and formatting will be documented here once established).*
