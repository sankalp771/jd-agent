# Initial Architecture

**Status:** Recommended implementation plan, 2026-10-13. These choices can change as the personal MVP is exercised.

## Runtime shape

- **Chrome extension:** Manifest V3 side panel, built with TypeScript and React. It owns the user-facing workflow and only reads a page after a user action.
- **Local companion:** A Windows native messaging host launched by Chrome. The extension sends structured requests over the native messaging pipe; the host performs local file, database, provider, and rendering operations. This avoids exposing a long-running unauthenticated localhost service.
- **Local data:** SQLite metadata under `%LOCALAPPDATA%\ResumeAgent`, with source files and generated artifacts stored alongside it in application-managed directories. Database records distinguish source documents, extracted candidate facts, verified profile facts, and per-application work.
- **Rendering:** Compile a copied project in a unique temporary directory using a locally installed TeX engine, with shell escape disabled. Keep the imported template immutable. Remove temporary build files after success or failure; preserve exported versions in job history.
- **AI provider:** Keep generation behind a local provider interface. Send data only after an explicit generation action, and apply the user's field exclusions before constructing a request.

## First vertical slice

1. **Prototype now:** Select the canonical `.tex` file in the side panel. Read it in memory and show its sections, package names, external-file references, and source text for review. Do not persist or edit it.
2. **Next:** Add durable local import with an immutable source copy and explicit dependency handling.
3. **Then:** Create a separate working copy and compile locally, returning the PDF and compiler diagnostics to the side panel.

The supplied `.tex` is the canonical input; the accompanying PDF is a visual reference from a different resume version. The LaTeX source has no `\\input`, `\\include`, image, or custom style-file dependencies. It uses common packages and declares `pdflatex` as its compile command. MiKTeX 25.12 was installed per-user for the Phase 0 compile. The unchanged source compiled with `pdflatex -no-shell-escape` to a one-page PDF. The render was visually inspected. MiKTeX reported the template's zero `\\footskip` as a `fancyhdr` warning; it did not prevent output.

The first UI prototype lives in `extension/`. It handles a selected `.tex` file entirely in the side panel's memory. It does not store the file, connect to a native host, or compile it yet.

## Security and correctness boundaries

- Accept only explicit extension requests; no page scraping in the background.
- Validate every file path under the application-managed data root and reject traversal or symlink escapes.
- Treat imported files and extracted text as untrusted input.
- Invoke the TeX engine with shell escape disabled, a controlled working directory, time and output limits, and no network access where the host can enforce it.
- Keep original imports read-only from the application's perspective; edits and repairs happen only in a working copy and require review.
- Store provider credentials outside extension code and Chrome sync storage.

## Open implementation checks

- Package and document the MiKTeX installation/availability experience for Windows users.
- Prototype Chrome native messaging installation and upgrade behavior.
- Confirm whether SQLite is bundled in the local host or accessed through a small persistence module.
- Validate process limits and filesystem isolation for TeX compilation on supported Windows editions.
