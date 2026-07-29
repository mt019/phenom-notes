import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../scripts/render-markdown.mjs';

test('markdown headings get stable ids and fenced code remains code', () => {
  const html = renderMarkdown('## 同名\n\n## 同名\n\n```html\n<div>x</div>\n```');
  assert.match(html, /<h2 id="同名">/);
  assert.match(html, /<h2 id="同名-1">/);
  assert.match(html, /&lt;div&gt;x&lt;\/div&gt;/);
});

test('footnotes render as linked notes instead of plain definition lines', () => {
  const html = renderMarkdown(`正文[^1]

[^1]: 出處`);
  assert.match(html, /id="fnref-1"/);
  assert.match(html, /id="fn-1"/);
  assert.doesNotMatch(html, /\[\^1\]:/);
});

test('footnote-like text inside fenced code remains byte-for-byte text', () => {
  const html = renderMarkdown(`正文[^1]

\`\`\`md
程式碼[^1]
\`\`\`

[^1]: 出處`);
  assert.match(html, /程式碼\[\^1\]/);
  assert.doesNotMatch(html, /程式碼<sup/);
});

test('snapshot images resolve inside the permanent Notes path', () => {
  const html = renderMarkdown('![圖](/notes-assets/example.jpg)');
  assert.match(html, /src="\/notes\/notes-assets\/example\.jpg"/);
});
