import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { runFontDelivery } from '@phenomcanvas/ui/validators/lib/font-delivery.mjs';

const dist = resolve('dist');

// 產物裡的字型檔要有東西引用它，字型的 preload 也要指向被引用的檔。判定在
// @phenomcanvas/ui 的 scripts/lib/font-delivery.mjs（站群共用一份），來歷寫在那裡：
// 本站 2026-08-01 那份 1.75 MB 的固定子集自套件 v0.1.34 起沒有任何 @font-face 引用，
// 而 index.html 仍然 preload 它，當時的三條字型檢查全過。
runFontDelivery({ dist });

// 兩面都要在。少了任何一面，正文會掉到堆疊下一個字型，而畫面照樣出得來。
const assetNames = readdirSync(join(dist, 'assets'));
for (const prefix of ['HuiwenMincho-core-subset', 'HuiwenMincho-ext-subset']) {
  if (!assetNames.some((name) => name.startsWith(prefix))) {
    throw new Error(`產物裡沒有 ${prefix}：正文的匯文明朝沒有出貨`);
  }
}

const icon = readFileSync(join(dist, 'phenom-ring.svg'));
if (createHash('sha256').update(icon).digest('hex') !== '20c617f5d4778b6632182f63c5bd93546c047cca533cf6f96b332359b086fb5e') {
  throw new Error('共用 phenom-ring.svg SHA-256 不符');
}
const notes = JSON.parse(readFileSync(resolve(process.env.NOTES_SNAPSHOT_DIR || '.notes-snapshot', 'data', 'notes.json'), 'utf8'));
const kb = JSON.parse(readFileSync(resolve(process.env.NOTES_SNAPSHOT_DIR || '.notes-snapshot', 'data', 'kb.json'), 'utf8'));
const routes = [
  '/', '/archive', '/stream', '/all', '/kb', '/inventory', '/timeline', '/songs',
  ...kb.entries.map((entry) => `/kb/${entry.slug}`),
  ...notes.posts.map((post) => `/${post.slug}`),
];
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
  // 眉標按層級回上一層：條目頁回條目索引（索引自己再回手記），其餘內頁直接回手記。
  // 每一層都要有，否則讀者從搜尋結果直接落在某一頁時走不出去。
  if (route.startsWith('/kb/')) {
    if (!/aria-label="回條目"[^>]*href="\/notes\/kb"/.test(html)) {
      throw new Error(`條目頁眉標沒有回條目索引：${route}`);
    }
  } else if (route !== '/' && !/aria-label="回手記"[^>]*href="\/notes\/?"/.test(html)) {
    throw new Error(`內頁眉標沒有回手記：${route}`);
  }
}
// 條目頁與文章頁一樣要有建置時就轉好的正文；靠瀏覽器補的話，沒有 JS 的讀者與
// 搜尋引擎拿到的是空殼。
for (const entry of kb.entries) {
  const html = readFileSync(htmlFor(`/kb/${entry.slug}`), 'utf8');
  if (!html.includes('prose-scaled prose-body') || !html.includes('notes-html')) {
    throw new Error(`條目沒有 build-time 正文：${entry.slug}`);
  }
  if (!html.includes(entry.id)) throw new Error(`條目頁沒有印出編號：${entry.slug}`);
  // 來源要在頁面上看得到，兩種形狀擇一：逐句掛註的條目印註腳清單，還沒掛註的印章末出處。
  // 只查其中一種，改用另一種的條目就會安靜地把來源整批漏掉。
  const hasNotes = html.includes('class="footnotes"');
  if ((entry.sources ?? []).length > 0 && !hasNotes && !html.includes('出處')) {
    throw new Error(`條目頁既沒有註腳清單也沒有出處那一段：${entry.slug}`);
  }
  if (hasNotes && html.includes('>出處<')) {
    throw new Error(`條目頁同時印了註腳清單與出處清單，兩份來源會被當成兩組：${entry.slug}`);
  }
}
// 總覽要真的把三種都列出來。少了一類不會報錯，只會讓那一類在頁面上整批消失。
const allHtml = readFileSync(htmlFor('/all'), 'utf8');
const allData = JSON.parse(readFileSync(resolve(process.env.NOTES_SNAPSHOT_DIR || '.notes-snapshot', 'data', 'all.json'), 'utf8'));
// 每一項的網址都要真的出現在頁面上。數字或標籤那種字串會隨版面改寫而漂掉，連結不會——
// 而「某一類整批不見」正是這一頁最可能壞的方式。
const missing = allData.items.filter((item) => !allHtml.includes(`href="/notes${item.route}"`));
if (missing.length > 0) {
  const sample = missing.slice(0, 3).map((item) => item.route).join('、');
  throw new Error(`總覽漏了 ${missing.length} 項（例如 ${sample}）`);
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
