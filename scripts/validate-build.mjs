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
const routes = ['/', '/archive', '/stream', ...notes.posts.map((post) => `/${post.slug}`)];
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
