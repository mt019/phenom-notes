import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import GithubSlugger from 'github-slugger';
import { marked } from 'marked';

export const SNAPSHOT = resolve(process.env.NOTES_SNAPSHOT_DIR || '.notes-snapshot');
export const SITE_URL = 'https://phenomcanvas.com/notes';
export const PUBLIC_BASE = '/notes';

export function readJson(path) {
  return JSON.parse(readFileSync(resolve(SNAPSHOT, path), 'utf8'));
}

export function readText(path) {
  return readFileSync(resolve(SNAPSHOT, path), 'utf8');
}

export const notes = readJson('data/notes.json');
export const archive = readJson('data/archive.json');
export const stream = readJson('data/stream.json');
export const snapshotManifest = readJson('manifest.json');

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
  const withRefs = transformOutsideFences(body, (line) => {
    return line.replace(/\[\^([^\]]+)\]/g, (whole, id) => {
      if (!definitions.has(id)) return whole;
      if (!referenced.includes(id)) referenced.push(id);
      const number = referenced.indexOf(id) + 1;
      return `<sup id="fnref-${id}"><a href="#fn-${id}" aria-label="註腳 ${number}">${number}</a></sup>`;
    });
  });
  if (referenced.length === 0) return withRefs;
  const items = referenced
    .map((id) => `<li id="fn-${id}">${marked.parseInline(definitions.get(id))} <a href="#fnref-${id}" aria-label="回正文">↩</a></li>`)
    .join('\n');
  return `${withRefs}\n\n<section class="footnotes" aria-label="註腳"><ol>${items}</ol></section>\n`;
}

export function renderMarkdown(source) {
  const slugger = new GithubSlugger();
  const rendered = marked.parse(renderFootnotes(source), { gfm: true });
  return rendered.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, level, body) => {
    const plain = body.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '').trim();
    const id = slugger.slug(plain) || createHash('sha1').update(body).digest('hex').slice(0, 8);
    return `<h${level} id="${id}">${body}</h${level}>`;
  });
}

export function postBody(slug) {
  return renderMarkdown(readText(`content/posts/${slug}.mdx`));
}

export function groupPostsByYear(posts) {
  const groups = [];
  for (const post of posts) {
    const year = post.publishedAt.slice(0, 4);
    const current = groups.at(-1);
    if (current?.year === year) current.posts.push(post);
    else groups.push({ year, posts: [post] });
  }
  return groups;
}

export function absoluteUrl(path = '/') {
  return new URL(publicPath(path), 'https://phenomcanvas.com').href;
}

export function publicPath(path = '/') {
  if (path === '/' || path === '') return `${PUBLIC_BASE}/`;
  if (path === PUBLIC_BASE || path.startsWith(`${PUBLIC_BASE}/`)) return path;
  return `${PUBLIC_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

export function relatedHref(href) {
  if (/^https?:\/\//.test(href)) return href;
  if (href.startsWith('/notes/')) return href;
  if (href === '/notes') return '/notes/';
  // 其餘根路徑目前屬於尚未拆出的 Canvas 產品；不能讓它落到 Notes host 變成 404。
  if (href.startsWith('/')) return new URL(href, 'https://phenomcanvas.com').href;
  return href;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function linkify(value) {
  return escapeHtml(value).replace(
    /(https?:\/\/[^\s，。、）)]+)/g,
    '<a href="$1" target="_blank" rel="noreferrer">$1</a>',
  );
}
