import * as pdfjs from './vendor/pdfjs/pdf.min.mjs';

pdfjs.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('vendor/pdfjs/pdf.worker.min.mjs');

const MAX_PAGES = 100;
const MAX_TEXT_LENGTH = 2 * 1024 * 1024;

export async function extractPdfText(file) {
  if (file.size > 25 * 1024 * 1024) throw new Error('PDF files are limited to 25 MB.');
  const documentTask = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    isEvalSupported: false,
    useSystemFonts: false,
    disableFontFace: true,
  });
  const document = await documentTask.promise;
  try {
    if (document.numPages > MAX_PAGES) throw new Error(`PDFs are limited to ${MAX_PAGES} pages for local text extraction.`);
    const pages = [];
    let textLength = 0;
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items.map((item) => ('str' in item ? item.str : '') + (item.hasEOL ? '\n' : ' ')).join('').trim();
      textLength += text.length;
      if (textLength > MAX_TEXT_LENGTH) throw new Error('Extracted PDF text exceeds the 2 MB review limit.');
      if (text) pages.push({ page: pageNumber, text });
      page.cleanup();
    }
    return pages;
  } finally {
    await document.destroy();
  }
}
