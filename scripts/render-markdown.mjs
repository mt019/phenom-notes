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

// 註標有兩種來源：匯入的舊文用 markdown 原本的行內定義（`[^1]: 說明`），後來寫的文章把
// payload 放在資料倉的 `data/notes.json`，正文只留 `[^id]`。兩種共用同一組編號，按篇內
// 出現順序給——編號依賴渲染順序，所以由這裡給，不寫進母本。
//
// 產出的註標帶 class="fn-ref" 與 data-note，前端的 AnnotatedHtml 用事件委派把它接上浮卡
// （正文是一整塊 HTML 字串，沒有 React 節點可以逐個包）。章末那份清單留著，那是給列印與
// 不用滑鼠的人看的，與浮卡指的是同一組資料。
function renderFootnotes(source, annotations = {}) {
  const definitions = new Map();
  const body = transformOutsideFences(source, (line) => {
    const definition = line.match(/^\[\^([^\]]+)\]:\s*(.+)$/);
    if (!definition) return line;
    definitions.set(definition[1], definition[2]);
    return '';
  });
  const referenced = [];
  const withRefs = transformOutsideFences(body, (line) => line.replace(/\[\^([^\]]+)\]/g, (whole, id) => {
    if (!definitions.has(id) && !annotations[id]) return whole;
    if (!referenced.includes(id)) referenced.push(id);
    const number = referenced.indexOf(id) + 1;
    return `<sup class="fn-ref" data-note="${number}" id="fn-ref-${number}" role="button" tabindex="0">${number}</sup>`;
  }));
  if (referenced.length === 0) return { html: withRefs, notes: [] };

  // 卡片與清單吃同一組欄位。行內定義的那種只有一段文字，放進 text。
  const notes = referenced.map((id, index) => {
    const entry = annotations[id];
    if (entry) return { n: index + 1, ...entry };
    return { n: index + 1, text: definitions.get(id) };
  });
  const listText = (note) => [
    note.label, note.locator, note.quote ? `「${note.quote}」` : '', note.text,
  ].filter(Boolean).join('，');
  const items = notes
    .map((note) => `<li id="fn-${note.n}">${marked.parseInline(listText(note))}`
      + (note.href ? ` <a href="${note.href}" rel="noreferrer">↗</a>` : '')
      + ` <a href="#fn-ref-${note.n}" aria-label="回正文">↩</a></li>`)
    .join('\n');
  const html = `${withRefs}\n\n<section class="footnotes" aria-label="註腳"><ol>${items}</ol></section>\n`;
  return { html, notes };
}

export function renderMarkdown(source, annotations = {}) {
  const slugger = new GithubSlugger();
  const { html: withNotes, notes } = renderFootnotes(source, annotations);
  const rendered = marked.parse(withNotes, { gfm: true });
  const html = rendered
    .replaceAll('src="/notes-assets/', 'src="/notes/notes-assets/')
    .replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, level, body) => {
      const plain = body.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '').trim();
      const id = slugger.slug(plain) || createHash('sha1').update(body).digest('hex').slice(0, 8);
      return `<h${level} id="${id}">${body}</h${level}>`;
    });
  return { html, notes };
}
