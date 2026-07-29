import { createHash } from 'node:crypto';
import GithubSlugger from 'github-slugger';
import { marked } from 'marked';

function transformOutsideFences(source, transform) {
  let fence = null;
  return source.split('\n').map((line) => {
    const match = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
    if (match) {
      const marker = match[1];
      if (!fence) fence = { char: marker[0], length: marker.length };
      else if (marker[0] === fence.char && marker.length >= fence.length && match[2].trim() === '') fence = null;
      return line;
    }
    return fence ? line : transform(line);
  }).join('\n');
}

function renderFootnotes(source) {
  const definitions = new Map();
  const body = transformOutsideFences(source, (line) => {
    const definition = line.match(/^\[\^([^\]]+)\]:\s*(.+)$/);
    if (!definition) return line;
    definitions.set(definition[1], definition[2]);
    return '';
  });
  const referenced = [];
  const withRefs = transformOutsideFences(body, (line) => line.replace(/\[\^([^\]]+)\]/g, (whole, id) => {
    if (!definitions.has(id)) return whole;
    if (!referenced.includes(id)) referenced.push(id);
    const number = referenced.indexOf(id) + 1;
    return `<sup id="fnref-${id}"><a href="#fn-${id}" aria-label="註腳 ${number}">${number}</a></sup>`;
  }));
  if (referenced.length === 0) return withRefs;
  const items = referenced
    .map((id) => `<li id="fn-${id}">${marked.parseInline(definitions.get(id))} <a href="#fnref-${id}" aria-label="回正文">↩</a></li>`)
    .join('\n');
  return `${withRefs}\n\n<section class="footnotes" aria-label="註腳"><ol>${items}</ol></section>\n`;
}

export function renderMarkdown(source) {
  const slugger = new GithubSlugger();
  const rendered = marked.parse(renderFootnotes(source), { gfm: true });
  return rendered
    .replaceAll('src="/notes-assets/', 'src="/notes/notes-assets/')
    .replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, level, body) => {
      const plain = body.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '').trim();
      const id = slugger.slug(plain) || createHash('sha1').update(body).digest('hex').slice(0, 8);
      return `<h${level} id="${id}">${body}</h${level}>`;
    });
}
