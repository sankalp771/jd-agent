const DIRECTORY_END = 0x06054b50;
const CENTRAL_ENTRY = 0x02014b50;
const LOCAL_ENTRY = 0x04034b50;
const MAX_ARCHIVE_BYTES = 25 * 1024 * 1024;
const MAX_TEXT_ENTRY_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_UNCOMPRESSED = 200 * 1024 * 1024;

export async function readZipIndex(file) {
  if (file.size > MAX_ARCHIVE_BYTES) throw new Error('ZIP and DOCX files are limited to 25 MB in this version.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const minOffset = Math.max(0, bytes.length - 65_557);
  let endOffset = -1;
  for (let offset = bytes.length - 22; offset >= minOffset; offset -= 1) {
    if (view.getUint32(offset, true) === DIRECTORY_END) { endOffset = offset; break; }
  }
  if (endOffset < 0) throw new Error('This file does not contain a readable ZIP directory.');

  const entriesCount = view.getUint16(endOffset + 10, true);
  const directorySize = view.getUint32(endOffset + 12, true);
  let cursor = view.getUint32(endOffset + 16, true);
  if (entriesCount === 0xffff || directorySize === 0xffffffff || cursor === 0xffffffff) {
    throw new Error('ZIP64 archives are not supported yet.');
  }
  if (entriesCount > 10_000 || cursor + directorySize > bytes.length) throw new Error('The ZIP directory is outside the supported limits.');
  const directoryEnd = cursor + directorySize;
  const decoder = new TextDecoder('utf-8');
  const entries = [];
  let totalUncompressed = 0;

  for (let index = 0; index < entriesCount && cursor < directoryEnd; index += 1) {
    if (view.getUint32(cursor, true) !== CENTRAL_ENTRY) throw new Error('The ZIP directory is malformed.');
    const flags = view.getUint16(cursor + 8, true);
    const method = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const uncompressedSize = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const name = decoder.decode(bytes.slice(cursor + 46, cursor + 46 + nameLength));
    if (flags & 1) throw new Error(`Encrypted ZIP entries are not supported (${name}).`);
    if (method !== 0 && method !== 8) throw new Error(`Unsupported ZIP compression method for ${name}.`);
    totalUncompressed += uncompressedSize;
    if (totalUncompressed > MAX_TOTAL_UNCOMPRESSED) throw new Error('The ZIP project expands beyond the 200 MB safety limit.');
    if (!name.endsWith('/')) entries.push({ name, method, compressedSize, uncompressedSize, localOffset });
    cursor += 46 + nameLength + extraLength + commentLength;
  }

  return { entries };
}

export async function readZipEntry(file, entry) {
  if (entry.uncompressedSize > MAX_TEXT_ENTRY_BYTES) throw new Error('The selected text entry is larger than the 2 MB limit.');
  if (entry.localOffset + 30 > file.size) throw new Error(`The ZIP entry header is incomplete (${entry.name}).`);
  const header = new DataView(await file.slice(entry.localOffset, entry.localOffset + 30).arrayBuffer());
  if (header.getUint32(0, true) !== LOCAL_ENTRY) throw new Error(`The ZIP entry header is malformed (${entry.name}).`);
  const nameLength = header.getUint16(26, true);
  const extraLength = header.getUint16(28, true);
  const dataStart = entry.localOffset + 30 + nameLength + extraLength;
  const compressed = file.slice(dataStart, dataStart + entry.compressedSize);
  if (entry.method === 0) return await compressed.text();
  if (typeof DecompressionStream === 'undefined') throw new Error('This Chrome version cannot unpack compressed ZIP files.');
  try {
    const stream = compressed.stream().pipeThrough(new DecompressionStream('deflate-raw'));
    const reader = stream.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_TEXT_ENTRY_BYTES) {
        await reader.cancel();
        throw new Error('The selected text entry expands beyond the 2 MB limit.');
      }
      chunks.push(value);
    }
    const result = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
    return new TextDecoder('utf-8').decode(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes('2 MB')) throw error;
    throw new Error(`Could not unpack ${entry.name}. Try a ZIP using standard deflate compression.`);
  }
}
