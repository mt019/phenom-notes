import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../scripts/render-markdown.mjs';

test('markdown headings get stable ids and fenced code remains code', () => {
  const { html } = renderMarkdown('## 同名\n\n## 同名\n\n```html\n<div>x</div>\n```');
  assert.match(html, /<h2 id="同名">/);
  assert.match(html, /<h2 id="同名-1">/);
  assert.match(html, /&lt;div&gt;x&lt;\/div&gt;/);
});

test('footnotes render as linked notes instead of plain definition lines', () => {
  const { html } = renderMarkdown(`正文[^1]

[^1]: 出處`);
  assert.match(html, /class="fn-ref" data-note="1" id="fn-ref-1"/);
  assert.match(html, /id="fn-1"/);
  assert.doesNotMatch(html, /\[\^1\]:/);
});

test('footnote-like text inside fenced code remains byte-for-byte text', () => {
  const { html } = renderMarkdown(`正文[^1]

\`\`\`md
程式碼[^1]
\`\`\`

[^1]: 出處`);
  assert.match(html, /程式碼\[\^1\]/);
  assert.doesNotMatch(html, /程式碼<sup/);
});

test('snapshot images resolve inside the permanent Notes path', () => {
  const { html } = renderMarkdown('![圖](/notes-assets/example.jpg)');
  assert.match(html, /src="\/notes\/notes-assets\/example\.jpg"/);
});

test('inline and display TeX render through KaTeX, prices and code stay literal', () => {
  const { html } = renderMarkdown('門上寫 $2\\pi \\neq 1$。\n\n$$\\sum_i x_i$$\n\n金額 $5 與 $10，程式碼 `$x$`');
  assert.equal((html.match(/class="katex"/g) ?? []).length, 2);
  assert.match(html, /class="katex-display"/);
  assert.doesNotMatch(html, /<p><span class="katex-display"/);
  assert.match(html, /金額 \$5 與 \$10/);
  assert.match(html, /<code>\$x\$<\/code>/);
  assert.doesNotMatch(html, /KATEXMATH/);
});

test('dollar signs inside fenced code are left alone', () => {
  const { html } = renderMarkdown('```html\n{{ $name }} and $a$\n```');
  assert.doesNotMatch(html, /katex/);
  assert.match(html, /\$a\$/);
});
