# Project Log

Append concise, dated entries for meaningful project changes. Keep implementation details in the relevant docs or commits; use this log to restore project context across sessions.

## 2026-10-13 — Product requirements captured

- User established the product direction for Resume Agent: personal-first, local-first Chrome extension for Windows, later extensible to a public service.
- Captured requirements for evidence-backed master profile, JD capture, explainable ranking, review and approval, LaTeX preservation/compilation, local history, privacy, exports, evaluation, and future scope.
- Added product brief, decision register, roadmap, and context maintenance instructions.
- No application code has been implemented yet.
- Next: inspect the user's LaTeX template and career materials, then define architecture and build an end-to-end MVP slice.

## 2026-10-13 — Resume template inspected; initial architecture proposed

- Inspected the supplied LaTeX source and rendered PDF. The `.tex` is the canonical template; the PDF is a visual reference from a different resume version.
- The LaTeX source has no external project files and declares `pdflatex`; no TeX engine was found on the current `PATH`.
- Proposed a Chrome side panel plus Windows native messaging host, local SQLite-backed data, and isolated working-copy compilation. See `docs/ARCHITECTURE.md` and D-017.
- Added a Chrome side-panel prototype that reads a selected `.tex` file in memory and shows its document sections, packages, file references, and source text.
- Installed MiKTeX 25.12 per-user and compiled an unchanged working copy of the `.tex` with shell escape disabled. The render is one page and visually inspected; MiKTeX reports a non-fatal zero-footskip warning from `fancyhdr`.
- Marked Phase 0 complete. Next: add immutable local template storage and connect the extension to the local renderer.

## 2026-10-13 — Phase 1 evidence library started

- Replaced the in-memory template preview with extension-local IndexedDB storage for immutable source file blobs, templates, candidate facts, and verified profile facts.
- Added `.tex`/ZIP template import, main-file selection, local section/package maps, and candidate extraction from resume bullets with source/line provenance.
- Added PDF/DOCX/TXT/Markdown/TeX source imports. Plain text and DOCX are parsed locally; PDF originals are stored and pasted selectable text can produce review candidates.
- Added confirm/reject/edit actions, source retention for verified facts, original-file downloads, and delete-all.
- Bundled PDF.js 5.6.205 and added local selectable-text extraction with page and text-size limits; scanned PDFs retain the paste-text fallback.
- Updated D-018 and architecture: SQLite/native host deferred until the extension needs local rendering or cross-process access.
- Next: refine fact/profile editing and make document extraction more automatic without weakening provenance controls.
