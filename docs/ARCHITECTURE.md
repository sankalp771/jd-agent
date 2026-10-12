# Initial Architecture

**Status:** Phase 1 implementation plan, 2026-10-13. These choices can change as the personal MVP is exercised.

## Runtime shape

- **Chrome extension:** Manifest V3 side panel using local JavaScript modules and CSS, with no build step. It owns the user-facing workflow and only reads a page after a user action.
- **Local persistence:** IndexedDB scoped to the extension origin. Store source metadata and extracted facts separately from original file blobs. Keep source documents, pending facts, verified facts, and templates distinct. Provide a delete-all action.
- **Local companion (later slice):** A Windows native messaging host can own trusted filesystem access and TeX process management when extension-connected compilation begins. No localhost server is exposed.
- **Rendering:** MiKTeX 25.12 is installed per-user for development. The supplied source compiled with shell escape disabled. The extension currently does not invoke the TeX engine; add a native host before integrating compilation. Compile a working copy and keep the imported template immutable.
- **AI provider:** Keep generation behind a local provider interface. Send data only after an explicit generation action, and apply the user's field exclusions before constructing a request.

## Vertical slices

1. **Phase 0 complete:** Inspect the canonical `.tex` file in the side panel and compile it locally with MiKTeX. The accompanying PDF is a visual reference from a different resume version.
2. **Phase 1 in progress:** Store `.tex` or ZIP originals as local blobs; select the main `.tex` entry in a ZIP; extract candidate statements with source/line provenance; confirm or reject each candidate; parse DOCX and selectable PDF text locally.
3. **Next:** Improve profile editing and extraction quality; scanned-PDF OCR remains out of scope.
4. **Later:** Connect the extension to an isolated native compile process and return the PDF and diagnostics.

The supplied `.tex` has no `\\input`, `\\include`, image, or custom style-file dependencies. It compiled with `pdflatex -no-shell-escape` to a one-page PDF. The render was visually inspected. MiKTeX reported the template's zero `\\footskip` as a non-fatal `fancyhdr` warning.

The Phase 1 UI lives in `extension/`. It stores selected files in extension-local IndexedDB without uploading them or writing ZIP entries to disk. ZIP64/encrypted archives and files over the documented limits are rejected. DOCX document text is read locally from its ZIP/XML contents. PDF.js 5.6.205 reads selectable PDF page text locally; the bundled module, worker, and license are in `extension/vendor/pdfjs/`. Extraction is capped at 100 pages and 2 MB of text. Scanned PDFs remain stored originals and can use pasted text; OCR is not included.

## Security and correctness boundaries

- Accept only explicit extension requests; no page scraping in the background.
- Keep imported original bytes unchanged. The UI reads and parses copies in memory.
- Treat imported files and extracted text as untrusted input; display content as text, never executable markup.
- Avoid extracting ZIP paths to disk. Enforce archive, entry-count, expansion, and TeX size limits.
- Keep verified facts linked to their source. Block source deletion while that source supports a verified fact; delete-all removes all application-managed IndexedDB records.
- Invoke the TeX engine only through a controlled local host with shell escape disabled, a controlled working directory, time and output limits, and no network access where the host can enforce it.
- Store provider credentials outside extension code and Chrome sync storage.

## Open implementation checks

- Package and document the MiKTeX installation/availability experience for Windows users.
- Prototype Chrome native messaging installation and upgrade behavior.
- Revisit SQLite only if the local host needs shared structured data beyond the extension's IndexedDB profile store.
- Validate process limits and filesystem isolation for TeX compilation on supported Windows editions.
