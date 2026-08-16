import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dist = resolve('dist');
const notesFontPath = join(dist, 'fonts', 'HuiwenMincho-notes-subset.woff2');
if (!existsSync(notesFontPath)) throw new Error('缺少手記用匯文明朝子集');
if (statSync(notesFontPath).size > 2 * 1024 * 1024) throw new Error('手記用匯文明朝子集超過 2 MiB');
const icon = readFileSync(join(dist, 'phenom-ring.svg'));
if (createHash('sha256').update(icon).digest('hex') !== '20c617f5d4778b6632182f63c5bd93546c047cca533cf6f96b332359b086fb5e') {
  throw new Error('共用 phenom-ring.svg SHA-256 不符');
}
const notes = JSON.parse(readFileSync(resolve(process.env.NOTES_SNAPSHOT_DIR || '.notes-snapshot', 'data', 'notes.json'), 'utf8'));
const routes = ['/', '/archive', '/stream', '/inventory', '/timeline', '/songs', ...notes.posts.map((post) => `/${post.slug}`)];
const htmlFor = (route) => route === '/' ? join(dist, 'index.html') : join(dist, route.slice(1), 'index.html');
for (const route of routes) {
  const path = htmlFor(route);
  if (!existsSync(path)) throw new Error(`缺少靜態路由：${route}`);
  const html = readFileSync(path, 'utf8');
  if (html.length < 2500) throw new Error(`靜態頁內容過少：${route} (${html.length} bytes)`);
  const canonical = `https://phenomcanvas.com/notes${route === '/' ? '/' : route}`;
  if (!html.includes(`<link rel="canonical" href="${canonical}">`)) {
    throw new Error(`canonical 不符：${route}`);
  }
  if (!html.includes('application/ld+json')) throw new Error(`缺少 JSON-LD：${route}`);
  if (!html.includes('<link rel="icon" href="/phenom-ring.svg"')) throw new Error(`缺少共用 favicon：${route}`);
  if (!html.includes('rel="preload" href="/notes/fonts/HuiwenMincho-notes-subset.woff2"')) {
    throw new Error(`缺少匯文明朝預載：${route}`);
  }
  if (route !== '/' && !/aria-label="回手記"[^>]*href="\/notes\/?"/.test(html)) {
    throw new Error(`內頁眉標沒有回手記：${route}`);
  }
}
const home = readFileSync(join(dist, 'index.html'), 'utf8');
for (const post of notes.posts) {
  if (!home.includes(`href="/notes/${post.slug}"`)) throw new Error(`首頁缺少文章連結：${post.slug}`);
  const html = readFileSync(htmlFor(`/${post.slug}`), 'utf8');
  if (!html.includes('prose-scaled prose-body') || !html.includes('notes-html')) {
    throw new Error(`文章沒有 build-time 正文：${post.slug}`);
  }
  const source = readFileSync(resolve(process.env.NOTES_SNAPSHOT_DIR || '.notes-snapshot', 'content', 'posts', `${post.slug}.mdx`), 'utf8');
  const marker = source.match(/[\p{Script=Han}]{8,}/u)?.[0];
  if (marker && !html.includes(marker)) throw new Error(`文章正文標記未進 HTML：${post.slug}`);
}
// 器物清單與年表另外送一份可直接抓的 JSON。順便在這裡再擋一次不該公開的欄位——
// 資料倉那道閘管的是產物，這道管的是真的被部署出去的檔案。
const SECRET_KEYS = ['"private"', '"visibility"', '"serial"', '"invoice"', '"warranty"', '"seller"', '"token"'];
for (const name of ['inventory.json', 'timeline.json', 'songs.json']) {
  const path = join(dist, name);
  if (!existsSync(path)) throw new Error(`缺少可直接抓的資料檔：/notes/${name}`);
  const text = readFileSync(path, 'utf8');
  JSON.parse(text);
  for (const key of SECRET_KEYS) {
    if (text.includes(key)) throw new Error(`${name} 帶著不該公開的欄位 ${key}`);
  }
}
const inventoryJson = JSON.parse(readFileSync(join(dist, 'inventory.json'), 'utf8'));
if (inventoryJson.items.some((item) => !item.price?.label)) throw new Error('器物公開資料有缺價格標示的項目');

// 器物與年表兩頁的正文不准出現工程作業語言。它們的內容是資料算出來的，最容易順手寫上
// 「這一頁與某某 .json 讀的是同一份資料」「留在資料倉裡」這種生產端的話——那是寫給我自己
// 看的，讀者不需要，2026-08-06 使用者當場退回過一次。文章頁不掃：〈三十次下載〉那類
// 工程日記本來就在講 npm 與 GitHub，那是題材。
const PRODUCTION_TALK = ['資料倉', '.json', 'snapshot', 'commit', '產物', '欄位', '自動接進來', '建置'];
for (const route of ['/inventory', '/timeline', '/songs']) {
  const text = readFileSync(htmlFor(route), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
  for (const phrase of PRODUCTION_TALK) {
    if (text.includes(phrase)) throw new Error(`${route} 的正文有工程作業語言「${phrase}」`);
  }
}

const sitemap = readFileSync(join(dist, 'sitemap-0.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]).sort();
const expectedUrls = routes.map((route) => `https://phenomcanvas.com/notes${route === '/' ? '/' : route}`).sort();
if (JSON.stringify(sitemapUrls) !== JSON.stringify(expectedUrls)) {
  throw new Error(`sitemap 路由集合不符：${sitemapUrls.length} != ${expectedUrls.length}`);
}
if (/href="\/notes\/(?:iiaspublications|jirsforeignlaw)"/.test(home + routes.map((route) => readFileSync(htmlFor(route), 'utf8')).join(''))) {
  throw new Error('跨產品連結誤落到 Notes host');
}
let files = 0;
let bytes = 0;
const walk = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.isFile()) {
      files += 1;
      bytes += statSync(path).size;
    }
  }
};
walk(dist);
console.log(`靜態驗收：${routes.length} 條內容路由、${files} 檔、${(bytes / 1024 / 1024).toFixed(2)} MiB`);
