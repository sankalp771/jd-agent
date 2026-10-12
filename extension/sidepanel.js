import {
  deleteAllRecords,
  getRecord,
  getSourceFile,
  listRecords,
  newId,
  removeSourceAndPendingFacts,
  saveRecord,
  saveSourceBundle,
} from './storage.js';
import { extractDocxText } from './docx.js';
import { extractPdfText } from './pdf.js';
import { extractLatexFacts, extractPlainTextFacts, inspectLatex } from './tex.js';
import { readZipEntry, readZipIndex } from './zip.js';

const templateInput = document.querySelector('#template-file');
const sourceInput = document.querySelector('#source-file');
const statusMessage = document.querySelector('#status-message');
const pendingZip = { file: null, entries: [], entryCount: 0, archiveEntries: [] };

function setText(selector, value) {
  document.querySelector(selector).textContent = value;
}

function showMessage(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('error', isError);
  statusMessage.hidden = false;
  clearTimeout(showMessage.timer);
  showMessage.timer = setTimeout(() => { statusMessage.hidden = true; }, 6000);
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function extensionOf(name) {
  return name.split('.').pop().toLowerCase();
}

function makeFactRecords(candidates, source, method, path = null) {
  return candidates.map((candidate) => ({
    id: newId(),
    sourceId: source.id,
    sourceName: source.name,
    content: candidate.content,
    evidenceText: candidate.evidenceText,
    line: candidate.line ?? null,
    page: candidate.page ?? null,
    filePath: path,
    extractionMethod: method,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }));
}

function makeSource(file, kind, extras = {}) {
  return {
    id: newId(),
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    extension: extensionOf(file.name),
    size: file.size,
    blob: file.slice(0, file.size, file.type),
    kind,
    importedAt: new Date().toISOString(),
    extractionStatus: 'original-stored',
    ...extras,
  };
}

function setActiveView(viewId) {
  document.querySelectorAll('.tab').forEach((tab) => {
    const active = tab.dataset.view === viewId;
    tab.classList.toggle('active', active);
    if (active) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });
  document.querySelectorAll('.view').forEach((view) => { view.hidden = view.id !== viewId; });
}

function renderTemplateCard(template, source) {
  const card = document.createElement('article');
  card.className = 'template-card';

  const icon = document.createElement('span');
  icon.className = 'file-icon';
  icon.textContent = source.extension.toUpperCase();
  icon.setAttribute('aria-hidden', 'true');

  const meta = document.createElement('div');
  meta.className = 'file-meta';
  const name = document.createElement('strong');
  name.textContent = source.name;
  const description = document.createElement('span');
  description.textContent = `${template.sections.length} sections · ${template.packages.length} packages · ${Math.max(0, template.entryCount - 1)} companion files · ${formatDate(template.importedAt)}`;
  meta.append(name, description);

  const actions = document.createElement('div');
  actions.className = 'template-card-actions';
  const download = document.createElement('button');
  download.type = 'button';
  download.className = 'mini-button';
  download.textContent = 'Download original';
  download.dataset.action = 'download';
  download.dataset.sourceId = source.id;
  actions.append(download);
  card.append(icon, meta, actions);

  const details = document.createElement('details');
  details.className = 'template-details';
  const summary = document.createElement('summary');
  summary.textContent = 'Review template map';
  details.append(summary);
  const sectionsHeading = document.createElement('h4');
  sectionsHeading.textContent = 'Sections';
  const sections = document.createElement('p');
  sections.className = 'template-map-value';
  sections.textContent = template.sections.length ? template.sections.join(' · ') : 'No section commands detected.';
  details.append(sectionsHeading, sections);
  const packagesHeading = document.createElement('h4');
  packagesHeading.textContent = 'Packages';
  const packages = document.createElement('p');
  packages.className = 'template-map-value';
  packages.textContent = template.packages.length ? template.packages.join(', ') : 'No package commands detected.';
  details.append(packagesHeading, packages);
  const referencesHeading = document.createElement('h4');
  referencesHeading.textContent = 'External file references';
  const references = document.createElement('p');
  references.className = 'template-map-value';
  references.textContent = template.references.length
    ? template.references.map((reference) => `${reference.command}: ${reference.path}`).join(' · ')
    : 'None detected.';
  details.append(referencesHeading, references);
  if (template.archiveEntries?.length) {
    const archiveHeading = document.createElement('h4');
    archiveHeading.textContent = 'Files retained in original archive';
    const archiveFiles = document.createElement('p');
    archiveFiles.className = 'template-map-value archive-file-list';
    archiveFiles.textContent = template.archiveEntries.join(' · ')
      + (template.archiveEntriesTruncated ? ` · and ${template.entryCount - template.archiveEntries.length} more` : '');
    details.append(archiveHeading, archiveFiles);
  }
  card.append(details);
  return card;
}

function renderFact(fact, source, verified = false) {
  const card = document.createElement('article');
  card.className = 'fact-card';
  card.dataset.factId = fact.id;

  if (fact.editing) {
    const editor = document.createElement('textarea');
    editor.className = 'edit-area';
    editor.maxLength = 1200;
    editor.value = fact.content;
    editor.setAttribute('aria-label', 'Edit verified profile fact');
    card.append(editor);
    const save = actionButton('Save edit', 'save-edit', fact.id, 'button primary');
    const cancel = actionButton('Cancel', 'cancel-edit', fact.id, 'button');
    const actions = document.createElement('div');
    actions.className = 'fact-actions';
    actions.append(save, cancel);
    card.append(actions);
    appendProvenance(card, fact, source);
    return card;
  }

  const text = document.createElement('p');
  text.className = 'fact-text';
  text.textContent = fact.content;
  card.append(text);

  if (fact.evidenceText && fact.evidenceText !== fact.content) {
    const evidence = document.createElement('blockquote');
    evidence.className = 'fact-evidence';
    evidence.textContent = fact.evidenceText;
    card.append(evidence);
  }
  appendProvenance(card, fact, source);

  const actions = document.createElement('div');
  actions.className = 'fact-actions';
  if (verified) {
    const badge = document.createElement('span');
    badge.className = 'verified-badge';
    badge.textContent = 'Verified by you';
    actions.append(badge, actionButton('Edit', 'edit', fact.id, 'mini-button'), actionButton('Remove', 'reject', fact.id, 'mini-button reject'));
  } else {
    actions.append(actionButton('Confirm fact', 'confirm', fact.id, 'button primary'), actionButton('Not accurate', 'reject', fact.id, 'button reject'));
  }
  card.append(actions);
  return card;
}

function actionButton(label, action, id, className) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.dataset.action = action;
  if (['download', 'remove-source', 'paste-extract'].includes(action)) button.dataset.sourceId = id;
  else button.dataset.factId = id;
  return button;
}

function appendProvenance(card, fact, source) {
  const origin = document.createElement('div');
  origin.className = 'fact-origin';
  const sourceLabel = document.createElement('span');
  sourceLabel.textContent = source ? source.name : 'Added and confirmed by you';
  const location = document.createElement('span');
  const pathText = fact.filePath ? ` · ${fact.filePath}` : '';
  const lineText = fact.extractionMethod === 'pasted-from-source'
    ? (fact.line ? `pasted text · line ${fact.line}` : 'pasted text')
    : fact.extractionMethod === 'pdf-page-text'
      ? `page ${fact.page}${fact.line ? ` · line ${fact.line}` : ''}`
    : fact.extractionMethod === 'docx-document-text'
      ? (fact.line ? `paragraph ${fact.line}` : '')
      : fact.line ? `line ${fact.line}` : '';
  location.textContent = `${lineText}${pathText}`;
  origin.append(sourceLabel, location);
  card.append(origin);
}

async function refresh() {
  const [templates, sources, facts] = await Promise.all([
    listRecords('templates'), listRecords('sources'), listRecords('facts'),
  ]);
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const pending = facts.filter((fact) => fact.status === 'pending').sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const verified = facts.filter((fact) => fact.status === 'verified').sort((a, b) => b.verifiedAt.localeCompare(a.verifiedAt));

  setText('#pending-count', String(pending.length));
  setText('#source-count', String(sources.length));
  setText('#review-summary', `${pending.length} to review`);
  setText('#unverified-label', `${pending.length} CANDIDATES`);
  setText('#verified-label', `${verified.length} CONFIRMED`);
  setText('#template-count-label', `${templates.length} ${templates.length === 1 ? 'PROJECT' : 'PROJECTS'}`);

  const templateList = document.querySelector('#template-list');
  templateList.replaceChildren();
  for (const template of templates.sort((a, b) => b.importedAt.localeCompare(a.importedAt))) {
    const source = sourceById.get(template.sourceId);
    if (source) templateList.append(renderTemplateCard(template, source));
  }
  document.querySelector('#templates-empty').hidden = templateList.childElementCount > 0;

  const pendingList = document.querySelector('#pending-facts');
  pendingList.replaceChildren(...pending.map((fact) => renderFact(fact, sourceById.get(fact.sourceId), false)));
  document.querySelector('#pending-empty').hidden = pending.length > 0;

  const verifiedList = document.querySelector('#verified-facts');
  verifiedList.replaceChildren(...verified.map((fact) => renderFact(fact, sourceById.get(fact.sourceId), true)));
  document.querySelector('#verified-empty').hidden = verified.length > 0;

  renderSources(sources, facts);
}

function renderSources(sources, facts) {
  const sourceList = document.querySelector('#source-list');
  sourceList.replaceChildren();
  for (const source of sources.sort((a, b) => b.importedAt.localeCompare(a.importedAt))) {
    const card = document.createElement('article');
    card.className = 'source-card';
    const head = document.createElement('div');
    head.className = 'source-card-head';
    const icon = document.createElement('span');
    icon.className = 'file-icon';
    icon.textContent = source.extension.toUpperCase();
    icon.setAttribute('aria-hidden', 'true');
    const meta = document.createElement('div');
    meta.className = 'file-meta';
    const name = document.createElement('strong');
    name.textContent = source.name;
    const detail = document.createElement('span');
    const sourceFacts = facts.filter((fact) => fact.sourceId === source.id);
    const verifiedCount = sourceFacts.filter((fact) => fact.status === 'verified').length;
    const pendingCount = sourceFacts.filter((fact) => fact.status === 'pending').length;
    detail.textContent = `${formatSize(source.size)} · ${formatDate(source.importedAt)} · ${pendingCount} to review · ${verifiedCount} verified`;
    meta.append(name, detail);
    head.append(icon, meta);
    card.append(head);

    const status = document.createElement('p');
    status.className = 'source-status';
    status.textContent = source.extractionStatus === 'text-ready'
      ? `Text read locally${source.extractionMethod === 'docx-document-text' ? ' from the DOCX document body' : source.extractionMethod === 'pdf-page-text' ? ' from PDF pages' : ''}; candidate statements are linked to this source.`
      : source.extractionStatus === 'pasted-text'
        ? 'Source text was pasted by you and remains linked to this original.'
        : source.extractionError || 'Original saved locally. Paste selectable text below to prepare review candidates.';

    if (source.extension === 'pdf' && source.extractionStatus === 'original-stored') {
      card.append(renderPasteForm(source));
    }
    card.append(status);

    const actions = document.createElement('div');
    actions.className = 'fact-actions';
    actions.append(actionButton('Download original', 'download', source.id, 'mini-button'));
    actions.append(actionButton('Remove source', 'remove-source', source.id, 'mini-button reject'));
    card.append(actions);
    sourceList.append(card);
  }
  document.querySelector('#sources-empty').hidden = sources.length > 0;
}

function renderPasteForm(source) {
  const wrapper = document.createElement('div');
  wrapper.className = 'paste-wrap';
  const label = document.createElement('label');
  label.htmlFor = `paste-${source.id}`;
  label.textContent = 'Paste selectable text from this document';
  const textarea = document.createElement('textarea');
  textarea.id = `paste-${source.id}`;
  textarea.className = 'paste-area';
  textarea.maxLength = 2 * 1024 * 1024;
  textarea.placeholder = 'Paste text copied from the PDF or DOCX. Each extracted statement will need your review.';
  const button = actionButton('Extract review candidates', 'paste-extract', source.id, 'button');
  wrapper.append(label, textarea, button);
  return wrapper;
}

async function createTemplate(file, mainFile, sourceText, entryCount = 0, archiveEntries = []) {
  const inspection = inspectLatex(sourceText);
  const source = makeSource(file, 'template', { extractionStatus: 'text-ready', mainTexPath: mainFile });
  const template = {
    id: newId(), sourceId: source.id, mainFile, entryCount,
    archiveEntries,
    archiveEntriesTruncated: entryCount > archiveEntries.length,
    sections: inspection.sections, packages: inspection.packages,
    references: inspection.references, importedAt: new Date().toISOString(),
  };
  const facts = makeFactRecords(extractLatexFacts(sourceText), source, 'latex-resume-item', mainFile);
  await saveSourceBundle(source, facts, template);
  await refresh();
  document.querySelector('#zip-choice').hidden = true;
  showMessage(`Saved ${file.name} locally. ${facts.length} resume statements are waiting for review.`);
  setActiveView('profile-view');
}

async function handleTemplateFile(file) {
  if (!file) return;
  document.querySelector('#zip-choice').hidden = true;
  if (file.size > 25 * 1024 * 1024) throw new Error('Template files are limited to 25 MB.');
  if (file.name.toLowerCase().endsWith('.tex')) {
    if (file.size > 2 * 1024 * 1024) throw new Error('The .tex source is larger than the 2 MB limit.');
    await createTemplate(file, file.name, await file.text());
    return;
  }
  if (!file.name.toLowerCase().endsWith('.zip')) throw new Error('Choose a .tex file or a ZIP LaTeX project.');
  const index = await readZipIndex(file);
  const texEntries = index.entries.filter((entry) => entry.name.toLowerCase().endsWith('.tex'));
  if (texEntries.length === 0) throw new Error('No .tex file was found inside this ZIP.');
  pendingZip.file = file;
  pendingZip.entries = texEntries;
  pendingZip.entryCount = index.entries.length;
  pendingZip.archiveEntries = index.entries.slice(0, 200).map((entry) => entry.name.slice(0, 240));
  const select = document.querySelector('#main-tex-select');
  select.replaceChildren();
  for (const entry of texEntries) {
    const option = document.createElement('option');
    option.value = entry.name;
    option.textContent = entry.name;
    select.append(option);
  }
  document.querySelector('#zip-choice').hidden = false;
  if (texEntries.length === 1) await importZipMainFile();
}

async function importZipMainFile() {
  if (!pendingZip.file) return;
  const selected = pendingZip.entries.find((entry) => entry.name === document.querySelector('#main-tex-select').value);
  if (!selected) throw new Error('Choose the main .tex file from the archive.');
  const text = await readZipEntry(pendingZip.file, selected);
  await createTemplate(pendingZip.file, selected.name, text, pendingZip.entryCount, pendingZip.archiveEntries);
  pendingZip.file = null;
  pendingZip.entries = [];
  pendingZip.entryCount = 0;
  pendingZip.archiveEntries = [];
}

async function handleSourceFile(file) {
  if (!file) return;
  if (file.size > 25 * 1024 * 1024) throw new Error('Source documents are limited to 25 MB.');
  const extension = extensionOf(file.name);
  const accepted = ['pdf', 'docx', 'txt', 'md', 'tex'];
  if (!accepted.includes(extension)) throw new Error('Choose a PDF, DOCX, TXT, Markdown, or LaTeX source.');

  let sourceText = null;
  let candidates = [];
  let method = '';
  let extractionError = null;
  if (['txt', 'md', 'tex'].includes(extension)) {
    if (file.size > 2 * 1024 * 1024) throw new Error('Text source files are limited to 2 MB.');
    sourceText = await file.text();
    candidates = extension === 'tex' ? extractLatexFacts(sourceText) : extractPlainTextFacts(sourceText);
    method = extension === 'tex' ? 'latex-resume-item' : 'local-text-paragraph';
  } else if (extension === 'docx') {
    sourceText = await extractDocxText(file);
    candidates = extractPlainTextFacts(sourceText).map((candidate) => ({ ...candidate, line: Math.ceil(candidate.line / 2) }));
    method = 'docx-document-text';
  } else if (extension === 'pdf') {
    try {
      const pages = await extractPdfText(file);
      if (!pages.length) throw new Error('No selectable text was found. Scanned PDFs need OCR, which is not included yet.');
      sourceText = pages.map((page) => page.text).join('\n\n');
      candidates = pages.flatMap((page) => extractPlainTextFacts(page.text).map((candidate) => ({ ...candidate, page: page.page })));
      method = 'pdf-page-text';
    } catch (error) {
      sourceText = null;
      extractionError = `${error.message} You can still paste selectable text below.`;
    }
  }

  const source = makeSource(file, 'career-material', {
    extractionStatus: sourceText === null ? 'original-stored' : 'text-ready',
    extractionMethod: method || null,
    extractionError,
  });
  await saveSourceBundle(source, makeFactRecords(candidates, source, method));
  await refresh();
  setActiveView('sources-view');
  showMessage(sourceText === null
    ? `Saved ${file.name} locally. Paste selectable text into its source card to prepare review candidates.`
    : `Saved ${file.name} locally. ${candidates.length} statements are waiting for review.`);
}

async function extractPastedText(sourceId, button) {
  const source = await getRecord('sources', sourceId);
  if (!source || source.extractionStatus !== 'original-stored') return;
  const textarea = button.parentElement.querySelector('textarea');
  const text = textarea.value.trim();
  if (!text) throw new Error('Paste some selectable text from this source first.');
  if (text.length > 2 * 1024 * 1024) throw new Error('Pasted text is limited to 2 MB.');
  const candidates = extractPlainTextFacts(text);
  source.extractionStatus = 'pasted-text';
  const facts = makeFactRecords(candidates, source, 'pasted-from-source');
  await saveSourceBundle(source, facts);
  await refresh();
  showMessage(`${facts.length} statements extracted as unverified candidates. Review them in Profile.`);
}

async function saveFactAction(button) {
  const fact = await getRecord('facts', button.dataset.factId);
  if (!fact) return;
  const action = button.dataset.action;
  if (action === 'confirm') {
    fact.status = 'verified';
    fact.verifiedAt = new Date().toISOString();
    await saveRecord('facts', fact);
    showMessage('Fact confirmed in your verified profile.');
  } else if (action === 'reject') {
    fact.status = 'rejected';
    fact.rejectedAt = new Date().toISOString();
    await saveRecord('facts', fact);
    showMessage('Candidate removed from the review list.');
  } else if (action === 'edit') {
    fact.editing = true;
    document.querySelector(`[data-fact-id="${CSS.escape(fact.id)}"] .fact-text`)?.remove();
    await refreshWithEditing(fact);
    return;
  } else if (action === 'cancel-edit') {
    await refresh();
    return;
  } else if (action === 'save-edit') {
    const card = button.closest('.fact-card');
    const value = card.querySelector('textarea').value.trim();
    if (!value) throw new Error('A verified profile fact cannot be empty.');
    fact.content = value;
    delete fact.editing;
    fact.editedAt = new Date().toISOString();
    await saveRecord('facts', fact);
    showMessage('Verified fact updated. Its original evidence is still linked.');
  }
  await refresh();
}

async function refreshWithEditing(editingFact) {
  const [sources, facts] = await Promise.all([listRecords('sources'), listRecords('facts')]);
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const verified = facts.filter((fact) => fact.status === 'verified').sort((a, b) => b.verifiedAt.localeCompare(a.verifiedAt));
  const list = document.querySelector('#verified-facts');
  list.replaceChildren(...verified.map((fact) => renderFact(fact.id === editingFact.id ? editingFact : fact, sourceById.get(fact.sourceId), true)));
}

async function addManualFact() {
  const textarea = document.querySelector('#manual-fact-text');
  const content = textarea.value.trim();
  if (!content) throw new Error('Enter a profile statement first.');
  const now = new Date().toISOString();
  await saveRecord('facts', {
    id: newId(), sourceId: null, sourceName: null, content, evidenceText: content,
    extractionMethod: 'user-confirmed', status: 'verified', createdAt: now, verifiedAt: now,
  });
  textarea.value = '';
  await refresh();
  showMessage('Added to your verified profile as a statement you confirmed.');
}

async function downloadSource(sourceId) {
  const source = await getRecord('sources', sourceId);
  const blob = await getSourceFile(sourceId);
  if (!source || !blob) throw new Error('The original source file is unavailable.');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = source.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function removeSource(sourceId) {
  await removeSourceAndPendingFacts(sourceId);
  await refresh();
  showMessage('Source removed.');
}

async function clearAll() {
  if (!window.confirm('Delete all locally stored templates, source files, extracted facts, and verified profile facts? This cannot be undone.')) return;
  await deleteAllRecords();
  await refresh();
  showMessage('All Resume Agent data has been deleted from this Chrome profile.');
}

async function handleAction(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  try {
    if (button.dataset.action === 'download') await downloadSource(button.dataset.sourceId);
    else if (button.dataset.action === 'remove-source') await removeSource(button.dataset.sourceId);
    else if (button.dataset.action === 'paste-extract') await extractPastedText(button.dataset.sourceId, button);
    else await saveFactAction(button);
  } catch (error) {
    showMessage(error.message || 'That action could not be completed.', true);
  }
}

document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => setActiveView(tab.dataset.view)));
document.querySelector('#template-list').addEventListener('click', handleAction);
document.querySelector('#pending-facts').addEventListener('click', handleAction);
document.querySelector('#verified-facts').addEventListener('click', handleAction);
document.querySelector('#source-list').addEventListener('click', handleAction);
document.querySelector('#delete-all').addEventListener('click', () => clearAll().catch((error) => showMessage(error.message, true)));
document.querySelector('#add-manual-fact').addEventListener('click', () => addManualFact().catch((error) => showMessage(error.message, true)));
document.querySelector('#import-zip').addEventListener('click', () => importZipMainFile().catch((error) => showMessage(error.message, true)));

templateInput.addEventListener('change', async () => {
  try { await handleTemplateFile(templateInput.files[0]); }
  catch (error) { showMessage(error.message || 'Template import failed.', true); }
  finally { templateInput.value = ''; }
});
sourceInput.addEventListener('change', async () => {
  try { await handleSourceFile(sourceInput.files[0]); }
  catch (error) { showMessage(error.message || 'Source import failed.', true); }
  finally { sourceInput.value = ''; }
});

function connectDropzone(zoneId, input) {
  const zone = document.querySelector(zoneId);
  zone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); input.click(); }
  });
  zone.addEventListener('dragover', (event) => { event.preventDefault(); zone.classList.add('dragging'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragging'));
  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    zone.classList.remove('dragging');
    const file = event.dataTransfer.files[0];
    const handler = input === templateInput ? handleTemplateFile : handleSourceFile;
    handler(file).catch((error) => showMessage(error.message || 'File import failed.', true));
  });
}

connectDropzone('#template-dropzone', templateInput);
connectDropzone('#source-dropzone', sourceInput);
refresh().catch((error) => showMessage(error.message || 'Could not open local profile storage.', true));
