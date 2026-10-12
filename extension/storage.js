const DATABASE_NAME = 'resume-agent-local';
const DATABASE_VERSION = 2;

let databasePromise;

function database() {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore('sources', { keyPath: 'id' });
      db.createObjectStore('sourceFiles', { keyPath: 'sourceId' });
      const facts = db.createObjectStore('facts', { keyPath: 'id' });
      facts.createIndex('sourceId', 'sourceId', { unique: false });
      facts.createIndex('status', 'status', { unique: false });
      db.createObjectStore('templates', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open local storage.'));
  });
  return databasePromise;
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Local storage request failed.'));
  });
}

async function withStore(storeName, mode, action) {
  const db = await database();
  const transaction = db.transaction(storeName, mode);
  const store = transaction.objectStore(storeName);
  const result = action(store);
  await new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error('Local storage transaction failed.'));
    transaction.onabort = () => reject(transaction.error || new Error('Local storage transaction was cancelled.'));
  });
  return result;
}

export const newId = () => crypto.randomUUID();

export async function listRecords(storeName) {
  const db = await database();
  return requestResult(db.transaction(storeName, 'readonly').objectStore(storeName).getAll());
}

export async function getRecord(storeName, id) {
  const db = await database();
  return requestResult(db.transaction(storeName, 'readonly').objectStore(storeName).get(id));
}

export async function saveRecord(storeName, record) {
  await withStore(storeName, 'readwrite', (store) => store.put(record));
  return record;
}

export async function saveRecords(storeName, records) {
  await withStore(storeName, 'readwrite', (store) => records.forEach((record) => store.put(record)));
  return records;
}

export async function saveSourceBundle(source, facts, template = null) {
  const db = await database();
  const storeNames = template ? ['sources', 'sourceFiles', 'facts', 'templates'] : ['sources', 'sourceFiles', 'facts'];
  const transaction = db.transaction(storeNames, 'readwrite');
  const sourceRecord = { ...source };
  delete sourceRecord.blob;
  delete sourceRecord.extractedText;
  transaction.objectStore('sources').put(sourceRecord);
  transaction.objectStore('sourceFiles').put({ sourceId: source.id, blob: source.blob });
  for (const fact of facts) transaction.objectStore('facts').put(fact);
  if (template) transaction.objectStore('templates').put(template);
  await new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error('Could not save imported material.'));
    transaction.onabort = () => reject(transaction.error || new Error('Could not save imported material.'));
  });
}

export async function getSourceFile(sourceId) {
  const db = await database();
  const record = await requestResult(db.transaction('sourceFiles', 'readonly').objectStore('sourceFiles').get(sourceId));
  return record?.blob || null;
}

export async function deleteRecord(storeName, id) {
  return withStore(storeName, 'readwrite', (store) => store.delete(id));
}

export async function deleteAllRecords() {
  const db = await database();
  const names = ['sources', 'sourceFiles', 'facts', 'templates'];
  const transaction = db.transaction(names, 'readwrite');
  for (const name of names) transaction.objectStore(name).clear();
  await new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error('Could not clear local data.'));
    transaction.onabort = () => reject(transaction.error || new Error('Could not clear local data.'));
  });
}

export async function removeSourceAndPendingFacts(sourceId) {
  const existingFacts = await listRecords('facts');
  if (existingFacts.some((fact) => fact.sourceId === sourceId && fact.status === 'verified')) {
    throw new Error('This source supports verified profile facts. Remove those facts from the profile before deleting the source.');
  }
  const db = await database();
  const transaction = db.transaction(['sources', 'sourceFiles', 'facts', 'templates'], 'readwrite');
  const sources = transaction.objectStore('sources');
  const sourceFiles = transaction.objectStore('sourceFiles');
  const facts = transaction.objectStore('facts');
  const templates = transaction.objectStore('templates');
  const indexedFacts = facts.index('sourceId').openCursor(IDBKeyRange.only(sourceId));
  indexedFacts.onsuccess = () => {
    const cursor = indexedFacts.result;
    if (cursor) {
      if (cursor.value.status !== 'verified') cursor.delete();
      cursor.continue();
    }
  };
  templates.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      if (cursor.value.sourceId === sourceId) cursor.delete();
      cursor.continue();
    }
  };
  sources.delete(sourceId);
  sourceFiles.delete(sourceId);
  await new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error('Could not remove source.'));
    transaction.onabort = () => reject(transaction.error || new Error('Could not remove source.'));
  });
}
