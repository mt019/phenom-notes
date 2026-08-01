import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(pathFromImportMeta(import.meta.url), '..');
const sourceFont = join(root, 'node_modules/@phenomcanvas/ui/fonts/HuiwenMincho-subset.woff2');
const outputFont = join(root, 'public/fonts/HuiwenMincho-notes-subset.woff2');
const textRoots = [
  join(root, 'src'),
  join(root, 'index.html'),
  join(root, 'node_modules/@phenomcanvas/ui/src'),
];
const readable = /\.(?:css|html|js|jsx|json|md|mdx)$/;
let text = '';

function pathFromImportMeta(url) {
  return new URL('.', url).pathname;
}

function collect(path) {
  const stat = statSync(path);
  if (stat.isDirectory()) {
    for (const entry of readdirSync(path).sort()) collect(join(path, entry));
  } else if (stat.isFile() && readable.test(path)) {
    text += readFileSync(path, 'utf8');
  }
}

for (const path of textRoots) collect(path);
const temp = mkdtempSync(join(tmpdir(), 'phenom-notes-font-'));
const characters = join(temp, 'characters.txt');
writeFileSync(characters, [...new Set(text)].sort().join(''));

const result = spawnSync('pyftsubset', [
  sourceFont,
  `--text-file=${characters}`,
  `--output-file=${outputFont}`,
  '--flavor=woff2',
  '--layout-features=*',
  '--glyph-names',
  '--symbol-cmap',
  '--legacy-cmap',
  '--notdef-glyph',
  '--notdef-outline',
  '--recommended-glyphs',
], { encoding: 'utf8' });
rmSync(temp, { recursive: true, force: true });

if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout || 'pyftsubset 執行失敗\n');
  process.exit(result.status || 1);
}
const bytes = statSync(outputFont).size;
console.log(`匯文明朝子集：${new Set(text).size} 個字元，${bytes.toLocaleString('en-US')} bytes`);
