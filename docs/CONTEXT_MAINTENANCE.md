# Maintaining Project Context

These documents are the shared source of truth for product intent. Read them before making product or architecture changes, and update them alongside code when decisions change.

## Which document to update

- **Product requirements or scope:** `PRODUCT_BRIEF.md`.
- **A durable choice or rationale:** add an entry to `DECISIONS.md`; if it replaces an old choice, mark the old entry superseded rather than deleting it.
- **Milestones or sequencing:** `ROADMAP.md`.
- **Meaningful project progress:** append a dated entry to `LOG.md`.
- **User-visible software behavior shipped:** `CHANGELOG.md`.
- **Implementation-specific architecture:** add a focused document under `docs/` and link it from the product brief or README.

## Change workflow

1. Read the current brief and relevant decisions before implementing a feature.
2. If the user's latest instruction conflicts with a recorded decision, follow the latest explicit user instruction and update the register to show what changed.
3. Keep requirements distinct from recommendations and implementation assumptions. Label recommendations as such until the user accepts them.
4. Update all affected docs in the same change as the implementation or scope change.
5. Add a dated log entry with what changed, why, and what remains next.
6. Do not claim a feature exists until it has been implemented. Keep status labels accurate.
7. Before a release, check the README, brief, decisions, roadmap, log, and changelog for contradictions.

## Keeping the context useful

- Prefer explicit, testable statements over vague aspirations.
- Preserve constraints, exceptions, open questions, and rejected approaches when they still matter.
- Keep the user's confirmed requirements separate from agent recommendations.
- Link evidence and source material where appropriate; never treat uploaded material as verified profile truth until the user confirms it.
- Avoid duplicating full specifications across files. Use the brief as the complete current requirement and link to it from summaries.
