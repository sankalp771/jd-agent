# Decision Register

Durable product choices live here. Each item records the current decision, why it was made, and whether it is firm or still a recommendation. Add new decisions at the end; do not silently rewrite history. If a decision changes, mark the old one superseded and add a new entry.

## D-001 — Personal-first, product-ready architecture

- **Status:** Decided
- **Decision:** Build first for one person's personal use, while keeping architecture capable of supporting a public product/service later.
- **Reason:** Validate the core value in real applications before taking on accounts, billing, or multi-user complexity.

## D-002 — Initial audience and role focus

- **Status:** Decided
- **Decision:** Start with students, freshers, and early-career professionals in IT (ML, full-stack, cloud, and related roles). Expand later.

## D-003 — Success and truthfulness

- **Status:** Decided
- **Decision:** Optimize relevance, truthful content, ATS readability, and clear achievement-focused writing. Measure callback outcomes but never guarantee them.
- **Decision:** Never fabricate facts and never submit an application automatically.

## D-004 — Initial client platform

- **Status:** Decided
- **Decision:** Chrome extension with side panel on Windows first, plus a local renderer service and a product/how-to homepage. Desktop first; macOS, other Chromium browsers, and mobile later.

## D-005 — JD capture is user-directed

- **Status:** Decided
- **Decision:** Support selected text/context-menu, drag text where supported, pasted JD, URL, and user-triggered visible-page extraction. Generic extraction is the goal; add site adapters only as needed. Never process every page silently. Copy/paste is the fallback.
- **Decision:** Support selectable-text PDFs at launch if feasible; OCR and restricted/scanned content later.

## D-006 — Local, single-user data model

- **Status:** Decided
- **Decision:** No account or mandatory cloud storage for initial version. Persist profile, job history, versions, and generated files locally until the user deletes them. Provide delete-all.

## D-007 — Evidence-first profile

- **Status:** Decided
- **Decision:** Retain rich career context and all useful detail. Distinguish original sources, extracted/unverified facts, and verified profile facts. Link every factual claim to source evidence or explicit user confirmation.
- **Decision:** Inferred skills may be proposed for confirmation but remain unverified until confirmed.
- **Implementation recommendation:** Organize context as sources → extracted facts → verified profile → per-application workspace.

## D-008 — Tailoring and ranking

- **Status:** Decided
- **Decision:** Rank required skills, keywords, responsibilities, evidence strength, project relevance, recency, and JD coverage. Explain selections and omissions. Recommend three projects by default, configurable 1–5, and ask the user for the desired number.
- **Decision:** Tailor summary, skills, project order, and bullet wording. Prefer approved bullets; rewrites are grounded and user-controlled. Combinations must not alter meaning or invent causality/outcomes.
- **Decision:** Show missing qualifications only in review. Never add them as possessed skills.

## D-009 — Approval and conversational refinement

- **Status:** Decided
- **Decision:** Present a proposed resume plan before final export. Show original/revised bullets, reason, and evidence. User accepts/rejects changes individually and has final say.
- **Decision:** Support prompt-based review/editing. Save manual edits as reusable approved bullets only with explicit consent.

## D-010 — Template preservation and compilation

- **Status:** Decided
- **Decision:** Accept `.tex` and ZIP LaTeX projects with dependencies; also accept PDF/DOCX as source material. Preserve the original project and styling by default. Compile a working copy in an isolated local process. Explain errors; safe fixes must be shown for review.
- **Decision:** Never silently replace the template or change its layout. Only adjust layout with user permission or a specific request.

## D-011 — MVP outputs and editor

- **Status:** Decided
- **Decision:** PDF is canonical; export PDF and `.tex` at launch. DOCX comes later and must be editable, with a warning if layout diverges.
- **Decision:** Visual editing first, with `.tex` source/preview mode. Direct LaTeX editing is out of scope.
- **Decision:** Validate overflow, required sections, broken links, unsupported dependencies, and template structural deviations where feasible.

## D-012 — AI, privacy, and cost

- **Status:** Partly decided; provider strategy is recommendation
- **Decision:** AI processing only on explicit generation requests. Local storage by default. Exclude unnecessary personal data and let users omit contact/sensitive fields from requests.
- **Decision:** User has Claude API credit; provider choice should not prevent future BYOK.
- **Recommendation:** Use a provider abstraction, evaluate Claude cost/quality, explore local models, and use deterministic local code for ranking/validation. Do not rely on any free tier being unlimited or permanent.
- **Decision:** No need for a detailed per-call data transmission explanation UI.

## D-013 — History and version control

- **Status:** Decided
- **Decision:** Keep local job history, generated versions, and restore capability until user deletion.

## D-014 — Speed and evaluation

- **Status:** Decided
- **Decision:** Target under 30 seconds for ordinary jobs; around 10 seconds is a stretch goal, subject to caching/provider performance.
- **Decision:** Evaluate with at least three JDs and compare agent selections to the user's preferred selections.
- **Decision:** Track accuracy, relevance, compilation success, time saved, edit acceptance, and quality of requested-change implementation.

## D-015 — MVP and later scope

- **Status:** Decided
- **MVP:** Local profile, JD capture, evidence-based ranking, review, LaTeX preservation, compilation, validation, visual editing, and prompt-based refinement.
- **Later:** OCR, broad DOCX conversion/export, sync, application tracking, multiple profiles, public product/business model, mobile, share links, and non-IT roles.
- **Business model:** Undecided. Personal trial for 2–3 weeks first; a future public version may use BYOK, subscription, or another model.

## D-016 — Product name and style

- **Status:** Working choice
- **Decision:** Use “Resume Agent” as the working name; keep the UI minimal, fast, and developer-oriented.

## D-017 — Initial local runtime architecture

- **Status:** Recommended; first template compile validated on Windows
- **Decision:** Use a Manifest V3 Chrome side panel with a TypeScript/React UI and a Windows native messaging host for local operations. Keep profile and job data local, with SQLite metadata and application-managed files under the user's local application data directory.
- **Decision:** Use MiKTeX for the initial Windows development path. Compile only a working copy of the imported LaTeX project, with shell escape disabled and bounded process resources. Retain the original template unchanged.
- **Reason:** A native messaging pipe avoids exposing a local HTTP service, and a local host can own filesystem access, provider credentials, and rendering.
- **Validation needed:** Windows installation/update flow and the strength of available process/filesystem isolation. The supplied template compiled successfully with MiKTeX 25.12; the template emits a non-fatal `fancyhdr` footskip warning.
