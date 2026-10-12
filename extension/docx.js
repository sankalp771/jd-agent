import { readZipEntry, readZipIndex } from './zip.js';

const WORD_NAMESPACE = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

export async function extractDocxText(file) {
  const archive = await readZipIndex(file);
  const documentEntry = archive.entries.find((entry) => entry.name.toLowerCase() === 'word/document.xml');
  if (!documentEntry) throw new Error('This DOCX does not contain its main Word document.');
  const xmlText = await readZipEntry(file, documentEntry);
  const xml = new DOMParser().parseFromString(xmlText, 'application/xml');
  if (xml.querySelector('parsererror')) throw new Error('The DOCX document XML could not be read.');
  const paragraphs = [...xml.getElementsByTagNameNS(WORD_NAMESPACE, 'p')].map((paragraph) =>
    [...paragraph.getElementsByTagNameNS(WORD_NAMESPACE, 't')].map((node) => node.textContent || '').join('')
  ).filter((paragraph) => paragraph.trim());
  if (paragraphs.length === 0) throw new Error('No selectable text was found in this DOCX.');
  return paragraphs.join('\n\n');
}
