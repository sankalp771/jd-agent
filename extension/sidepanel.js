const fileInput = document.querySelector('#template-file');
const dropzone = document.querySelector('#dropzone');
const errorBox = document.querySelector('#error');
const results = document.querySelector('#results');

const setText = (selector, value) => {
  document.querySelector(selector).textContent = value;
};

function sizeLabel(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function braceArgument(source, start) {
  let index = start;
  while (/\s/.test(source[index] || '')) index += 1;
  if (source[index] !== '{') return null;
  let depth = 1;
  let value = '';
  for (index += 1; index < source.length; index += 1) {
    const char = source[index];
    if (char === '\\') {
      value += char;
      if (index + 1 < source.length) value += source[++index];
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}' && --depth === 0) return { value, end: index + 1 };
    value += char;
  }
  return null;
}

function skipOptionalArgument(source, start) {
  let index = start;
  while (/\s/.test(source[index] || '')) index += 1;
  if (source[index] !== '[') return index;
  let depth = 1;
  for (index += 1; index < source.length; index += 1) {
    if (source[index] === '[') depth += 1;
    if (source[index] === ']' && --depth === 0) return index + 1;
  }
  return start;
}

function withoutComments(source) {
  return source.split('\n').map((line) => {
    for (let i = 0; i < line.length; i += 1) {
      if (line[i] !== '%') continue;
      let slashes = 0;
      for (let j = i - 1; j >= 0 && line[j] === '\\'; j -= 1) slashes += 1;
      if (slashes % 2 === 0) return line.slice(0, i);
    }
    return line;
  }).join('\n');
}

function commandArguments(source, command, count) {
  const expression = new RegExp(`\\\\${command}(?![A-Za-z])\\*?`, 'g');
  const found = [];
  for (const match of source.matchAll(expression)) {
    let position = match.index + match[0].length;
    position = skipOptionalArgument(source, position);
    const args = [];
    let valid = true;
    for (let i = 0; i < count; i += 1) {
      const arg = braceArgument(source, position);
      if (!arg) { valid = false; break; }
      args.push(arg.value.trim());
      position = arg.end;
    }
    if (valid) found.push(args);
  }
  return found;
}

function unique(values) {
  return [...new Set(values)];
}

function populateList(selector, values, className) {
  const list = document.querySelector(selector);
  list.replaceChildren();
  for (const value of values) {
    const item = document.createElement('li');
    item.className = className || '';
    item.textContent = value;
    list.append(item);
  }
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

async function loadFile(file) {
  errorBox.hidden = true;
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.tex')) {
    showError('Choose a .tex source file. Other document formats are not accepted in this setup step.');
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    showError('This file is larger than the 2 MB prototype limit.');
    return;
  }

  const source = await file.text();
  const parseSource = withoutComments(source);
  const sections = commandArguments(parseSource, 'section', 1);
  const packages = unique(commandArguments(parseSource, 'usepackage', 1)
    .flatMap(([names]) => names.split(',').map((name) => name.trim()).filter(Boolean)));
  const includes = commandArguments(parseSource, 'input', 1)
    .concat(commandArguments(parseSource, 'include', 1), commandArguments(parseSource, 'includegraphics', 1))
    .map(([path]) => path);

  setText('#file-name', file.name);
  setText('#file-size', `${sizeLabel(file.size)} · selected just now`);
  setText('#section-count', String(sections.length));
  setText('#package-count', String(packages.length));
  setText('#dependency-count', String(includes.length));
  setText('#source-preview', source);

  const sectionList = document.querySelector('#section-list');
  sectionList.replaceChildren();
  for (const [name] of sections) {
    const item = document.createElement('li');
    item.append(document.createTextNode(name.replace(/\\([%&#_$])/g, '$1')));
    sectionList.append(item);
  }
  document.querySelector('#sections-empty').hidden = sections.length > 0;

  populateList('#package-list', packages);
  document.querySelector('#packages-empty').hidden = packages.length > 0;
  populateList('#dependency-list', includes);
  document.querySelector('#dependencies-empty').hidden = includes.length > 0;
  results.hidden = false;
}

fileInput.addEventListener('change', () => loadFile(fileInput.files[0]));
dropzone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    fileInput.click();
  }
});
dropzone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropzone.classList.add('dragging');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragging'));
dropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropzone.classList.remove('dragging');
  loadFile(event.dataTransfer.files[0]);
});
