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

export function stripLatexComments(source) {
  return source.split('\n').map((line) => {
    for (let index = 0; index < line.length; index += 1) {
      if (line[index] !== '%') continue;
      let slashes = 0;
      for (let cursor = index - 1; cursor >= 0 && line[cursor] === '\\'; cursor -= 1) slashes += 1;
      if (slashes % 2 === 0) return line.slice(0, index) + ' '.repeat(line.length - index);
    }
    return line;
  }).join('\n');
}

export function commandArguments(source, command, count = 1) {
  const expression = new RegExp(`\\\\${command}(?![A-Za-z])\\*?`, 'g');
  const found = [];
  for (const match of source.matchAll(expression)) {
    let position = skipOptionalArgument(source, match.index + match[0].length);
    const args = [];
    let valid = true;
    for (let index = 0; index < count; index += 1) {
      const argument = braceArgument(source, position);
      if (!argument) { valid = false; break; }
      args.push({ value: argument.value, start: position, end: argument.end });
      position = argument.end;
    }
    if (valid) found.push({ args, index: match.index, end: position });
  }
  return found;
}

export function cleanLatexText(value) {
  let text = value.replace(/\\\\/g, ' ');
  const keepContents = ['textbf', 'textit', 'emph', 'texttt', 'underline', 'mbox', 'textrm', 'textsc'];
  for (let pass = 0; pass < 4; pass += 1) {
    for (const command of keepContents) {
      text = text.replace(new RegExp(`\\\\${command}\\s*\\{([^{}]*)\\}`, 'g'), '$1');
    }
    text = text.replace(/\\href\s*\{[^{}]*\}\s*\{([^{}]*)\}/g, '$1');
  }
  return text
    .replace(/\\(?:&|%|#|_|\$|\{|\})/g, (match) => match.slice(1))
    .replace(/\\(?:,|;|:|!|quad|qquad)\s*/g, ' ')
    .replace(/\\[A-Za-z@]+\*?(?:\[[^\]]*\])?/g, ' ')
    .replace(/[{}]/g, ' ')
    .replace(/~/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
}

export function inspectLatex(source) {
  const parseSource = stripLatexComments(source);
  const sections = commandArguments(parseSource, 'section').map(({ args }) => cleanLatexText(args[0].value));
  const packages = [...new Set(commandArguments(parseSource, 'usepackage')
    .flatMap(({ args }) => args[0].value.split(',').map((name) => name.trim()).filter(Boolean)))];
  const references = ['input', 'include', 'includegraphics'].flatMap((command) =>
    commandArguments(parseSource, command).map(({ args }) => ({ command, path: cleanLatexText(args[0].value) })));
  return { sections, packages, references };
}

export function extractLatexFacts(source) {
  const parseSource = stripLatexComments(source);
  const entries = [];
  for (const { args, index } of commandArguments(parseSource, 'resumeItem')) {
    entries.push({ raw: args[0].value, content: args[0].value, index });
  }
  for (const { args, index } of commandArguments(parseSource, 'item')) {
    entries.push({ raw: args[0].value, content: args[0].value, index });
  }
  for (const { args, index } of commandArguments(parseSource, 'resumeSubheading', 4)) {
    const ordered = [args[0], args[2], args[1], args[3]];
    entries.push({ raw: ordered.map((arg) => arg.value).join(' | '), content: ordered.map((arg) => cleanLatexText(arg.value)).join(' · '), index });
  }
  for (const { args, index } of commandArguments(parseSource, 'resumeProjectHeading', 3)) {
    entries.push({ raw: args.map((arg) => arg.value).join(' | '), content: args.map((arg) => cleanLatexText(arg.value)).join(' · '), index });
  }
  if (entries.length === 0) {
    const heading = /\\(?:resumeProjectHeading|resumeSubheading)\s*\{([^{}]+)\}/g;
    entries.push(...[...parseSource.matchAll(heading)].map((match) => ({ raw: match[1], content: match[1], index: match.index })));
  }
  return entries.map(({ raw, content, index }) => ({
    evidenceText: cleanLatexText(content),
    content: cleanLatexText(content),
    line: parseSource.slice(0, index).split('\n').length,
  })).filter((fact) => fact.content.length >= 12);
}

export function extractPlainTextFacts(text) {
  const normalized = text.replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');
  const facts = [];
  let paragraph = [];
  let startLine = 1;
  const flush = () => {
    const evidenceText = paragraph.join(' ').trim();
    const content = evidenceText.replace(/^\s*(?:[-*•▪◦]\s+|\d+[.)]\s+)/, '').replace(/\s+/g, ' ').trim();
    if (content.length >= 24) facts.push({ evidenceText, content, line: startLine });
    paragraph = [];
  };
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) { flush(); startLine = index + 2; continue; }
    if (/^(?:[-*•▪◦]|\d+[.)])\s+/.test(line)) {
      flush();
      startLine = index + 1;
      paragraph.push(line);
      continue;
    }
    if (paragraph.length === 0) startLine = index + 1;
    paragraph.push(line);
  }
  flush();
  return facts;
}
