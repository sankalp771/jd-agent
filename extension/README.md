# Resume Agent Chrome prototype

This unpacked Manifest V3 extension keeps templates, original source files, extracted candidates, and verified profile facts in IndexedDB scoped to the installed extension. It does not upload data or make network requests. Imported originals are retained byte-for-byte; extracted statements remain unverified until confirmed.

## Load in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Select **Load unpacked**.
4. Choose this `extension` folder.
5. Select the Resume Agent toolbar icon to open the side panel, then choose a `.tex` file.

After code changes, select **Reload** for Resume Agent on `chrome://extensions`, then reopen the side panel. Use the **Template**, **Profile**, and **Sources** tabs to move through setup.

The extension has no build step. It accepts `.tex` and ZIP templates; ZIP projects retain the complete archive and let you choose the main `.tex` file. Plain text, Markdown, DOCX, and selectable PDF text are parsed locally. PDF.js 5.6.205 is bundled under `vendor/pdfjs/` with its worker and Apache-2.0 license. PDF extraction is limited to 100 pages and 2 MB of text; scanned PDFs can be stored and reviewed using pasted text, but OCR is not included. TeX compilation inside the extension is not implemented yet. ZIP64 and encrypted archives are not supported; ZIP and source files are limited to 25 MB, and extracted text entries to 2 MB.
