# Roadmap

This is a sequence of outcomes, not a promise of dates. Keep the MVP narrow enough to validate the user's real application workflow, while preserving the product boundaries in the brief.

**Phase 0 status:** Complete (2026-10-13). The initial architecture and fixture are recorded, the `.tex` template compiles with MiKTeX on Windows, and the first Chrome template-review screen is available in `extension/`.

## Phase 0 — Foundation and discovery

- Inspect the user's LaTeX template and supporting assets.
- Collect one master resume/profile source and at least three representative JDs.
- Define local service/extension architecture, evidence model, and threat boundaries.
- Choose LaTeX engine and isolated compilation approach for Windows.
- Establish a minimal visual language for the extension and homepage.

**Exit:** architecture decisions recorded; representative input/output fixtures identified; template can be compiled locally by the chosen approach.

## Phase 1 — Evidence library and template setup

- Local single-user profile and source library.
- Import sources; extract candidate facts with provenance.
- Review and confirm facts; distinguish unverified from verified.
- Import `.tex`/ZIP template and dependencies without overwriting originals.

**Exit:** user can inspect/edit verified profile details and knows where each fact came from.

## Phase 2 — JD capture and evidence ranking

- Chrome side panel capture via paste and selected-text route.
- Add visible-page extraction; URL and drag/drop support as feasible.
- Parse JD requirements and rank evidence deterministically where possible.
- Explain relevance, coverage, missing qualifications, and selected/omitted items.

**Exit:** at least three JDs can be analyzed and compared with the user's preferred project/skill selections.

## Phase 3 — Review and grounded generation

- Proposed resume plan before output.
- Individual accept/reject review with original/revised text, rationale, and source evidence.
- Conversational refinement under fact constraints.
- Provider interface and explicit user-triggered generation.

**Exit:** user can review a complete tailored plan and approve changes without introducing unsupported claims.

## Phase 4 — Local rendering, validation, and export

- Isolated local compilation of a working copy.
- PDF plus `.tex` export.
- Surface compiler errors and safe proposed fixes.
- Check sections, page overflow, links, unsupported assets, and template structure.
- Local version history, restore, and delete-all.

**Exit:** complete end-to-end workflow from JD to reviewed, valid downloadable PDF and matching source.

## Phase 5 — Personal trial and product decision

- Use the tool for real applications over 2–3 weeks.
- Record time, selection quality, accepted/rejected edits, factual issues, compile outcomes, and user-request implementation quality.
- Identify cost per successful resume and compare provider/local options.
- Decide whether to continue as a personal tool or invest in public-product readiness.

## Later opportunities

- Editable DOCX export; multiple role-specific templates/variants.
- macOS and other Chromium browsers.
- OCR and scanned PDF support; broader import conversion.
- Multiple profiles after single-profile reliability.
- Optional sync/backup, application tracking, mobile, or share links with explicit consent.
- Public packaging, onboarding, BYOK, billing/subscription, and support model.
- Additional job families beyond IT.
