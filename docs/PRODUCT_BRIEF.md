# Resume Agent — Product Brief

**Status:** Working requirements, captured 2026-10-13 (Asia/Calcutta).  
**Product name:** Resume Agent (working name).  
**Stage:** Personal-use MVP definition; initial template-import UI prototype in progress.

## 1. Summary

Resume Agent helps a job seeker turn a rich, evidence-backed career profile and a job description (JD) into a tailored resume. The user supplies a LaTeX template once, captures a JD from the browser, reviews why specific skills and experiences were selected, approves proposed changes, and exports a validated PDF and `.tex` source.

The first release is for the owner's personal applications, designed so its boundaries can later support a public product. It is local-first, single-user, and focused on IT roles: machine learning, full-stack development, cloud, and related areas. It is intended first for students, freshers, and early-career professionals.

## 2. Product goals

- Optimize relevance to the JD, factual accuracy, ATS readability, and concise achievement-focused writing.
- Make it easy to surface the right skills, projects, bullets, and evidence for a particular role.
- Support both tailoring an existing resume and building a master career profile from scratch.
- Preserve the user's established LaTeX design and produce a PDF that compiles correctly.
- Make every recommendation explainable and reviewable.
- Measure outcomes such as relevance, accuracy, compilation success, time saved, and user acceptance. Interview callbacks are a goal to measure, not a guarantee.

## 3. Non-goals and firm boundaries

- No fabricated skills, titles, experience, qualifications, dates, responsibilities, metrics, contributions, causal claims, or outcomes.
- No automatic job applications or submissions.
- No silent processing of every visited webpage. Page extraction is always user-triggered.
- No mandatory cloud account, hosted database, payments, team feature, or shareable resume link in the initial version.
- No direct LaTeX editing requirement. Provide a visual editor and a source/preview view for `.tex` instead.
- DOCX export, OCR/scanned PDFs, broad DOCX conversion, synchronization, and application tracking are later work.

## 4. Users and initial platform

### Initial user

One person using the app locally to prepare applications during a personal 2–3 week trial. The interface should be minimal, fast, and developer-oriented.

### Initial platform

- Chrome on Windows.
- Chrome extension with a side panel.
- Local renderer service for document compilation and other trusted local operations.
- A simple homepage/site describing the product, how to use it, and how to add the extension to Chrome.
- Desktop first. macOS, other Chromium browsers, and mobile can follow.

## 5. Core user journey

1. **Set up:** Import a `.tex` file or LaTeX ZIP. Supply dependencies such as `.sty` files, fonts, and images in the ZIP. Import a resume and/or create a master profile from scratch.
2. **Build context:** Add career documents and links to an organized local context library. Review extracted facts and promote only confirmed facts into the verified profile.
3. **Capture a JD:** Select text and use the context menu, drag text into the extension where supported, trigger visible-page extraction, paste a JD, or provide a URL. Selectable-text PDFs are in MVP if feasible. Copy/paste remains the fallback when extraction fails.
4. **Analyze:** Parse the JD into requirements and rank the user's evidence by required skills, keywords, responsibilities, evidence strength, project relevance, recency, and coverage.
5. **Review plan:** Recommend three projects by default, configurable from one to five (ask the user for the desired count). Show selected/omitted evidence, requirement coverage, missing qualifications, and explanations linking resume content to JD requirements.
6. **Approve changes:** Show original and revised bullets, reasons, and source evidence. The user accepts or rejects each proposed change individually. User has final say over project, skill, and bullet selection.
7. **Refine:** Allow conversational prompting to adjust the proposed resume. Prompted edits remain evidence-grounded and reviewable. Save manual edits as reusable approved bullets only with explicit user consent.
8. **Generate:** Preserve layout and styling by default. Compile locally in an isolated process. Show errors and offer safe, understood fixes for review; never silently replace or modify the original template.
9. **Validate and export:** PDF is canonical. Export PDF and `.tex`. Check compilation, page overflow, required sections, broken links, unsupported dependencies, and structural deviation where feasible. Keep previous versions and allow restore.

## 6. Profile and evidence model

Keep a complete, searchable master record so small but relevant details are not lost. Resume generation should select the strongest supported evidence for a specific role, without deleting or hiding the underlying record.

### Suggested organization

1. **Sources:** Original uploads and links, preserved with provenance and import status.
2. **Extracted facts:** Candidate facts parsed from sources, each linked to its source and marked unverified until reviewed.
3. **Verified profile:** User-confirmed facts and reusable approved bullets.
4. **Application workspace:** JD, analysis, proposed plan, approvals, generated artifacts, and version history.

This structure is a recommendation to keep the context folder manageable while allowing substantial detail. It should support neatly organized files, uploads, and user-authored `.txt` notes.

### Profile data to support

- Contact details and links, with per-request exclusion controls.
- Skills and aliases, including confirmation status.
- Projects, architecture, features, technical decisions, technologies, contribution, dates, outcomes, metrics, repository/demo links, and verification state.
- Work, internships, open-source work (including issue/PR explanations and links), education, certifications, achievements, and extracurriculars.
- Approved bullets and preferred writing style.
- Source evidence and provenance for every factual claim.

Support extensive detail. Ask or omit uncertain facts; visibly mark unresolved items for review. Inferred skills may be suggested, but must remain unverified until the user confirms them.

## 7. Ranking and resume tailoring

Rank evidence using multiple signals: required skills, JD terminology, responsibilities, evidence strength, project relevance, recency, and coverage of the JD. Use relevant JD terminology naturally when truthful; do not stuff keywords or copy whole JD sentences.

Tailor the summary, skills, project order, and bullet wording while preserving factual details and core identity. Reorder bullets and skills based on relevance, subject to template constraints. Prefer approved bullets; grounded rewrites are allowed when the user decides. Combining bullets is allowed only if it does not change meaning, invent a causal relationship, or create a new achievement.

Less relevant projects may be omitted, but if there is only one available project, keep it. Contact information and education remain essential unless the user changes the template or explicitly opts out. Other section choices can reflect the role (for example, extracurricular work when useful); suggest these choices for user review.

Show missing qualifications in the review interface, never as possessed skills in the resume. Flag suspicious, contradictory, or unusually specific JD requirements without claiming certainty that a posting is fraudulent.

## 8. Resume template, editor, and outputs

- Inputs: `.tex`, ZIP of a LaTeX project, PDF, DOCX, plus supporting files in a ZIP. PDF/DOCX are source material; broad document conversion is not required for MVP.
- Preserve supplied template layout and styling by default. Change it only when the user asks or approves.
- Keep the original project unchanged. Compile a working copy in an isolated local process.
- Present compilation errors clearly; offer safe fixes for user review. No silent template replacement.
- MVP exports: PDF and `.tex`. PDF is canonical. DOCX is a later milestone and must be editable in Word; warn if its formatting diverges from PDF.
- Preserve hyperlinks, special characters, clickable contact links, and supported fonts/icons. Flag unsupported dependencies.
- Visual editing first, plus `.tex` source/preview mode. Direct source editing is not required.
- Maintain versions, diffs/review, and restore.
- Flag page overflow, missing sections, broken links, and structural deviations from the template.

## 9. Privacy, storage, and AI

- Local storage by default; no sign-in or cloud database for the initial version.
- Keep job history and versions until the user deletes them.
- Provide a clear delete-all-data action covering application-managed templates, profiles, jobs, and generated files.
- AI calls only on explicit generation requests, through a configured provider.
- Do not transmit unnecessary personal details. Let the user exclude contact and other sensitive fields from AI requests.
- Explain provider/API configuration and allow a provider abstraction. The user currently has Claude API credit and is interested in cost-efficient options, local models, and BYOK if the product later launches.
- No need to expose per-call data transmission explanations in the UI beyond clear configuration/consent controls; the user said detailed per-call explanations are not needed.
- Never place provider secrets in extension source or browser sync storage. Prefer the local service to manage provider calls and local secret configuration.

### Provider strategy (recommendation, not yet a binding provider decision)

- Start with the user's Claude API for quality and evaluate actual cost on representative JDs.
- Keep a provider interface so future BYOK can support alternatives.
- Consider local models through Ollama as an optional cost-saving path; quality and speed depend on hardware/model.
- Consider free API tiers only for development/evaluation, not as an assumption of unlimited or stable production use. Confirm provider data-use terms before sending personal profile material.
- Use deterministic local ranking, evidence linking, template validation, and checks where possible; reserve paid model calls for extraction and grounded language generation.

## 10. Performance and quality targets

- Target under 30 seconds for ordinary jobs; stretch goal around 10 seconds where caching and provider conditions permit. These are targets to measure, not promises.
- Evaluate with at least three different JDs. Compare selected projects and skills to the user's choices and record why differences occurred.
- Quality measures: factual accuracy, JD relevance, project/skill selection, compilation success, time saved, acceptance rate for proposed edits, and how well user-requested changes are implemented.
- ATS scoring should be treated as a useful signal, not a definitive universal score. Improve readable structure and relevant terminology without compromising truthfulness.
- Interview callbacks may be tracked by the user over their application period, but are not guaranteed outcomes.

## 11. MVP definition of done

The MVP is usable when the user can:

1. Create a local profile and import/review career evidence.
2. Add and preserve a LaTeX template and its dependencies.
3. Capture a JD using at least paste plus one browser capture route.
4. See ranked relevant skills/projects/bullets with source evidence, coverage, and missing requirements.
5. Review a proposed resume plan and accept/reject edits individually.
6. Refine the plan conversationally without unsupported facts being introduced.
7. Compile a valid PDF and download it with corresponding `.tex`, while preserving the original template.
8. Inspect validation results and restore a prior version.
9. Delete all application-managed local data.

## 12. Future scope

### Next after MVP

- Editable DOCX export with fidelity warning.
- Multiple user-saveable role-specific templates/variants.
- Additional Chromium browsers and macOS support.
- Better document import/conversion workflows.

### Later

- OCR for scanned PDFs and images.
- Multiple profiles after the single-profile workflow is reliable.
- Optional sync or cloud backup, only with explicit opt-in and clear privacy controls.
- Application tracking and outcomes dashboard.
- Public product/service: onboarding, packaging, support, optional BYOK, and possible subscription/pricing model.
- Mobile support and sharing links only if there is user demand and explicit consent.
- Support beyond IT after validating the initial role families.

## 13. Open questions for implementation

These are implementation choices, not unresolved product intent:

- Local service packaging and safe communication between extension and renderer.
- LaTeX engine selection and sandbox/isolation strategy on Windows.
- Local data format, indexing, backups, and delete semantics.
- Evidence/fact schema and source extraction pipeline.
- Model provider abstraction, prompt/version management, cost measurement, and local-model capability checks.
- Validation rules and how to detect layout changes/page overflow reliably.
- How to compute and present a transparent ATS/readability assessment.
- Initial homepage hosting/deployment approach.
