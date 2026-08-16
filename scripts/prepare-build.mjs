import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { renderMarkdown } from './render-markdown.mjs';

const root = resolve(process.env.NOTES_SNAPSHOT_DIR || '.notes-snapshot');
const manifestPath = resolve(root, 'manifest.json');
if (!existsSync(manifestPath)) {
  console.error('找不到 .notes-snapshot/manifest.json；先執行 npm run data:local，CI 則先執行 phenom-notes-data export:web。');
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
if (manifest.schemaVersion !== 1 || manifest.source?.repository !== 'mt019/phenom-notes-data') {
  throw new Error('不支援的 Notes snapshot 契約');
}
const allowDirtyLocal = process.env.NOTES_ALLOW_DIRTY === '1';
if (!/^[0-9a-f]{40}$/.test(manifest.source?.commit ?? '') || (manifest.source?.dirty && !allowDirtyLocal)) {
  throw new Error('建置只接受 clean 且帶完整 data commit 的 Notes snapshot');
}
const lock = JSON.parse(readFileSync(resolve('data.lock.json'), 'utf8'));
const expectedDataCommit = process.env.EXPECTED_DATA_COMMIT || lock.commit;
if (lock.schemaVersion !== 1 || lock.repository !== 'mt019/phenom-notes-data' || !/^[0-9a-f]{40}$/.test(expectedDataCommit ?? '')) {
  throw new Error('data.lock.json／EXPECTED_DATA_COMMIT 格式錯誤');
}
if (manifest.source.commit !== expectedDataCommit) {
  throw new Error(`snapshot data commit 不符：${manifest.source.commit} != ${expectedDataCommit}`);
}
for (const [path, expected] of Object.entries(manifest.files ?? {})) {
  const value = readFileSync(resolve(root, path));
  const actual = createHash('sha256').update(value).digest('hex');
  if (value.length !== expected.bytes || actual !== expected.sha256) {
    throw new Error(`snapshot 檔案驗證失敗：${path}`);
  }
}
const actualFiles = [];
const walk = (directory) => {
  for (const name of readdirSync(directory).sort()) {
    const absolute = resolve(directory, name);
    if (statSync(absolute).isDirectory()) walk(absolute);
    else {
      const path = relative(root, absolute).split(sep).join('/');
      if (path !== 'manifest.json') actualFiles.push(path);
    }
  }
};
walk(root);
const declaredFiles = Object.keys(manifest.files ?? {}).sort();
if (JSON.stringify(actualFiles.sort()) !== JSON.stringify(declaredFiles)) {
  throw new Error('snapshot 實際檔案集合與 manifest 不一致');
}

const notes = JSON.parse(readFileSync(resolve(root, 'data', 'notes.json'), 'utf8'));
const slugs = new Set();
for (const post of notes.posts ?? []) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug ?? '')) throw new Error(`slug 格式錯誤：${post.slug}`);
  if (['archive', 'stream', 'inventory', 'timeline', 'songs', '404'].includes(post.slug)) throw new Error(`slug 與保留路由衝突：${post.slug}`);
  if (slugs.has(post.slug)) throw new Error(`slug 重複：${post.slug}`);
  slugs.add(post.slug);
  if (post.route !== `/${post.slug}` || post.legacyRoute !== `/notes/${post.slug}`) {
    throw new Error(`新舊路由契約錯誤：${post.slug}`);
  }
}

const sourceAssets = resolve(root, 'public', 'notes-assets');
const targetAssets = resolve('public', 'notes-assets');
rmSync(targetAssets, { recursive: true, force: true });
if (existsSync(sourceAssets)) {
  mkdirSync(dirname(targetAssets), { recursive: true });
  cpSync(sourceAssets, targetAssets, { recursive: true });
}

const sharedIcon = resolve('node_modules', '@phenomcanvas', 'ui', 'assets', 'phenom-ring.svg');
const iconBytes = readFileSync(sharedIcon);
const iconSha256 = createHash('sha256').update(iconBytes).digest('hex');
if (iconSha256 !== '20c617f5d4778b6632182f63c5bd93546c047cca533cf6f96b332359b086fb5e') {
  throw new Error(`phenom-ring.svg SHA-256 不符：${iconSha256}`);
}
cpSync(sharedIcon, resolve('public', 'phenom-ring.svg'));

const generated = resolve('src', 'data', 'generated');
rmSync(generated, { recursive: true, force: true });
mkdirSync(generated, { recursive: true });
for (const name of ['notes.json', 'archive.json', 'stream.json', 'inventory.json', 'timeline.json', 'songs.json']) {
  cpSync(resolve(root, 'data', name), resolve(generated, name));
}
// 器物清單與年表另外放一份到 public/，讓 agent 直接抓 /notes/inventory.json、/notes/timeline.json，
// 不必解析頁面。內容與頁面渲染的完全同一份，私有欄位在資料倉那一步就沒有寫出來。
for (const name of ['inventory.json', 'timeline.json', 'songs.json']) {
  cpSync(resolve(root, 'data', name), resolve('public', name));
}
const content = {
  archive: renderMarkdown(readFileSync(resolve(root, 'content', 'archive.mdx'), 'utf8')),
  posts: Object.fromEntries(
    notes.posts.map((post) => [
      post.slug,
      renderMarkdown(readFileSync(resolve(root, 'content', 'posts', `${post.slug}.mdx`), 'utf8')),
    ]),
  ),
};
writeFileSync(resolve(generated, 'content.json'), `${JSON.stringify(content)}\n`);
writeFileSync(resolve(generated, 'snapshot.json'), `${JSON.stringify({
  schemaVersion: manifest.schemaVersion,
  source: manifest.source,
})}\n`);
console.log(`snapshot：${Object.keys(manifest.files).length} 檔，data ${manifest.source.commit.slice(0, 12)}，驗證通過`);
