# Resume Agent

Resume Agent is a local-first tool for turning a job description and a person's verified career evidence into a relevant, truthful, ATS-readable resume. The initial product is a Chrome extension for Windows with a side panel and a local document-rendering service.

> **Project status:** documentation and product definition. Implementation has not started.

## Product promise

Capture a job description, review an evidence-backed resume plan, and export a tailored PDF plus its LaTeX source using the user's existing template. The user stays in control of facts, edits, and exports. The tool does not promise interviews or automatically submit applications.

## Current MVP scope

- One local user profile and a structured evidence library.
- Import a LaTeX project (`.tex` or ZIP), plus PDF/DOCX and other career materials as profile sources.
- Capture a JD from selected text, a user-triggered visible-page extraction, pasted text, or a URL; selectable-text PDFs if feasible.
- Rank verified skills, projects, bullets, and experience against the JD, with evidence and explanations.
- Present a proposed resume plan and changes for approval before export; accept/reject changes individually.
- Preserve the LaTeX template by default and compile in an isolated local process.
- Export PDF and `.tex`; validate compilation, links, required sections, page overflow, and template structure where feasible.
- Local job history and version history, with restore and delete-all controls.
- Prompt-based assistance for reviewing and editing the proposed resume, with a visual editor and `.tex` preview/source view.

See [the product brief](docs/PRODUCT_BRIEF.md) for full requirements, future scope, and acceptance targets.

## Documentation map

- [Product brief](docs/PRODUCT_BRIEF.md): product vision, users, workflows, scope, requirements, risks, and success measures.
- [Decisions](docs/DECISIONS.md): durable decisions and their rationale.
- [Roadmap](docs/ROADMAP.md): MVP milestones and deferred capabilities.
- [Project log](docs/LOG.md): dated updates, changes, and progress.
- [Maintaining project context](docs/CONTEXT_MAINTENANCE.md): how contributors keep these documents aligned.
- [Changelog](CHANGELOG.md): user-visible changes by release.

## Working principles

1. Every resume claim must be supported by the local profile or explicitly confirmed by the user.
2. Keep source documents, extracted facts, and user-verified profile facts distinct.
3. Ask before treating uncertain or inferred details as verified.
4. Show the evidence and reason behind recommendations and edits.
5. Keep the original template untouched; proposed repairs require review.
6. Process a webpage only after an explicit user action.
7. Keep profile data and history local by default. Send profile/JD content to an AI provider only for an explicit generation request, and avoid transmitting excluded or unnecessary details.
8. Never submit applications automatically.

## Getting started

There is no application implementation yet. The first development step is to inspect the user's LaTeX template and representative career/JD materials, then define the architecture and build a thin end-to-end vertical slice.

## Documentation updates

When product scope or a durable choice changes, update `docs/PRODUCT_BRIEF.md` and `docs/DECISIONS.md` in the same change. Add a dated entry to `docs/LOG.md`. Add entries to `CHANGELOG.md` when user-visible software behavior ships.
