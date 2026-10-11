import { createHash } from 'node:crypto';
import GithubSlugger from 'github-slugger';
import katex from 'katex';
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

// 行內數學：正文寫 `$…$`、`$$…$$`，在這裡交給 KaTeX 排成 HTML。資料倉的閘擋直接鍵入的 π、≠
// 這類字元，公式只能用 TeX 寫進來，所以這一層缺了，正文就印出字面的 `$2\pi$`。
// 判準照 pandoc 的 tex_math_dollars：開頭的 `$` 後面不接空白，收尾的 `$` 前面不接空白、
// 後面不接數字，因此「$5 與 $10」這種金額不會被當成公式。只認同一行之內的成對 `$`，
// 程式碼圍籬與行內程式碼裡的 `$` 原樣保留。
//
// KaTeX 的輸出先換成佔位字串，marked 跑完再填回去：輸出是一大串帶 style 的 span，
// 交給 marked 處理有被當成 markdown 改寫的風險。KaTeX 的 CSS 與字型由 @phenomcanvas/ui
// 的 Prose 元件帶進產物，這裡不另外載。
const MATH_PATTERN = /\$\$([^$\n]+?)\$\$|\$(?![\s$])([^$\n]*?[^\s\\$])\$(?!\d)/g;

function renderMath(source) {
  const rendered = [];
  const replaceOutsideCodeSpans = (line) => line.split(/(`+[^`]*`+)/).map((part, index) => (
    index % 2 === 1 ? part : part.replace(MATH_PATTERN, (whole, display, inline, offset, text) => {
      if (offset > 0 && text[offset - 1] === '\\') return whole;
      const html = katex.renderToString(display ?? inline, {
        displayMode: display !== undefined,
        throwOnError: false,
        output: 'htmlAndMathml',
        trust: false,
        strict: 'ignore',
      });
      rendered.push(html);
      return `KATEXMATH${rendered.length - 1}ENDMATH`;
    })
  )).join('');
  return { source: transformOutsideFences(source, replaceOutsideCodeSpans), rendered };
}

function restoreMath(html, rendered) {
  if (rendered.length === 0) return html;
  return html.replace(/<p>KATEXMATH(\d+)ENDMATH<\/p>/g, (whole, index) => (
    rendered[Number(index)].includes('katex-display') ? rendered[Number(index)] : whole
  )).replace(/KATEXMATH(\d+)ENDMATH/g, (whole, index) => rendered[Number(index)]);
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

// 圖表的 SVG 直接嵌進 HTML，不走 <img src>。用 <img> 載進來的 SVG 是另一份文件，取不到
// 站上的字型與色彩 token，圖裡的字會退回系統 sans，與正文的明體對不上；嵌進來之後
// var(--font-body)、var(--c-ink) 這些就是頁面自己的值，深色模式也跟著走。
// 圖說取自 markdown 的 alt，渲染成 figcaption——每一張圖都要有圖說，不是只有 alt。
function inlineFigures(source, figures) {
  if (!figures || Object.keys(figures).length === 0) return source;
  return transformOutsideFences(source, (line) => line.replace(
    /!\[([^\]]*)\]\(\/notes-assets\/figures\/([^)\s]+)\)/g,
    (whole, alt, file) => {
      const svg = figures[file];
      if (!svg) return whole;
      return `<figure class="notes-figure">${svg.trim()}`
        + (alt ? `<figcaption>${marked.parseInline(alt)}</figcaption>` : '')
        + '</figure>';
    },
  ));
}

export function renderMarkdown(source, annotations = {}, figures = {}) {
  const slugger = new GithubSlugger();
  const { source: withMath, rendered: math } = renderMath(source);
  const { html: withNotes, notes } = renderFootnotes(inlineFigures(withMath, figures), annotations);
  const rendered = restoreMath(marked.parse(withNotes, { gfm: true }), math);
  const html = rendered
    .replaceAll('src="/notes-assets/', 'src="/notes/notes-assets/')
    .replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, level, body) => {
      const plain = body.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '').trim();
      const id = slugger.slug(plain) || createHash('sha1').update(body).digest('hex').slice(0, 8);
      return `<h${level} id="${id}">${body}</h${level}>`;
    });
  return { html, notes };
}
