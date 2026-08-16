import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dist = path.join(root, 'dist');
const template = (await readFile(path.join(dist, 'index.html'), 'utf8'))
  // Vite 會把 public asset 自動加上 base；favicon 是整個 phenomcanvas.com 共用的 root asset。
  .replaceAll('href="/notes/phenom-ring.svg"', 'href="/phenom-ring.svg"');
const notes = JSON.parse(await readFile(path.join(root, 'src/data/generated/notes.json'), 'utf8'));
const archive = JSON.parse(await readFile(path.join(root, 'src/data/generated/archive.json'), 'utf8'));
const stream = JSON.parse(await readFile(path.join(root, 'src/data/generated/stream.json'), 'utf8'));
const inventory = JSON.parse(await readFile(path.join(root, 'src/data/generated/inventory.json'), 'utf8'));
const timeline = JSON.parse(await readFile(path.join(root, 'src/data/generated/timeline.json'), 'utf8'));
const songs = JSON.parse(await readFile(path.join(root, 'src/data/generated/songs.json'), 'utf8'));
const { render } = await import(pathToFileURL(path.join(root, '.ssr/entry-server.js')));
const canonicalBase = 'https://phenomcanvas.com/notes';

const pages = [
  {
    route: '/',
    file: 'index.html',
    title: '手記｜聽講、讀書與整理資料時寫下的短文｜Phenom Canvas Lab',
    description: '個人短文集：學術演講的現場筆記、讀完一批出版品之後的讀後記，以及整理資料途中想到的問題。題材集中在法律制度、法實證研究與學術社群，依發表日期由新到舊排列，每篇標明發表日與閱讀時間。',
    keywords: ['手記', '演講筆記', '讀後記', '法律制度觀察', '法實證研究', '學術演講紀錄', '個人隨筆'],
    type: 'Blog',
  },
  {
    route: '/archive',
    file: 'archive/index.html',
    title: '舊帖｜手記｜Phenom Canvas Lab',
    description: `${archive.dateRange.from.slice(0, 4)}–${archive.dateRange.to.slice(0, 4)} 年寫在 Matters 與一個已經關掉的個人站上的 ${archive.count} 則短記，每則短到只有一兩行，按年份排，正文與當年一字不改。`,
    keywords: ['舊帖', '短記', 'Matters', '舊站存檔', '學生時期筆記', '手記'],
    type: 'CollectionPage',
    temporalCoverage: `${archive.dateRange.from}/${archive.dateRange.to}`,
  },
  {
    route: '/stream',
    file: 'stream/index.html',
    title: '短記｜手記｜Phenom Canvas Lab',
    description: `${stream.count} 則一句話長度的隨手紀錄，每則標明說出來的時刻，由新到舊按月份與日期排列。題材是日常見聞與讀書、聽講途中的即時想法，不成篇也不修飾。`,
    keywords: ['短記', '微網誌', '隨手筆記', '日常紀錄', '時間戳', '手記'],
    type: 'CollectionPage',
    temporalCoverage: `${stream.dateRange.from.slice(0, 10)}/${stream.dateRange.to.slice(0, 10)}`,
  },
  {
    route: '/inventory',
    file: 'inventory/index.html',
    title: '器物｜手記｜Phenom Canvas Lab',
    description: `手上的 ${inventory.stats.count} 件設備，分在 ${inventory.categories.length} 類；附規格、入手時間與價格，實付和市場參考價分開標示。`,
    keywords: ['器物清單', '設備清單', '個人資產', '攝影器材', '儲存裝置', '規格', '手記'],
    type: 'CollectionPage',
  },
  {
    route: '/timeline',
    file: 'timeline/index.html',
    title: '年表｜手記｜Phenom Canvas Lab',
    description: `按日期排的 ${timeline.stats.count} 則事件，從 ${timeline.stats.dateRange?.from ?? ''} 到 ${timeline.stats.dateRange?.to ?? ''}：買了什麼、考了什麼、寫了什麼、決定了什麼。`,
    keywords: ['年表', '個人時間軸', '大事紀', '編年', '手記'],
    type: 'CollectionPage',
    temporalCoverage: timeline.stats.dateRange ? `${timeline.stats.dateRange.from}/${timeline.stats.dateRange.to}` : undefined,
  },
  {
    route: '/songs',
    file: 'songs/index.html',
    title: '歌單｜手記｜Phenom Canvas Lab',
    description: `聲樂課唱過的 ${songs.stats.count} 首歌，分${songs.languages.map((entry) => entry.label).join('、')}四組，一首一列：原唱、發行年份、唱的日期。`,
    keywords: ['歌單', '聲樂課', '台語歌', '粵語歌', '國語歌', '原唱', '手記'],
    type: 'CollectionPage',
    temporalCoverage: songs.stats.dateRange ? `${songs.stats.dateRange.from}/${songs.stats.dateRange.to}` : undefined,
  },
  ...notes.posts.map((post) => ({
    route: `/${post.slug}`,
    file: `${post.slug}/index.html`,
    title: `${post.title}｜手記｜Phenom Canvas Lab`,
    description: post.summary,
    keywords: post.keywords ?? [],
    type: 'BlogPosting',
    post,
  })),
  {
    route: '/404',
    file: '404.html',
    title: '查無此頁｜手記',
    description: '這個網址沒有對應的手記頁面。',
    keywords: [],
    type: 'WebPage',
    indexable: false,
  },
];

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function canonicalFor(route) {
  return route === '/' ? `${canonicalBase}/` : `${canonicalBase}${route}`;
}

for (const page of pages) {
  const canonical = canonicalFor(page.route);
  const schema = {
    '@context': 'https://schema.org',
    '@type': page.type,
    '@id': page.route === '/' ? `${canonicalBase}#blog` : `${canonical}#webpage`,
    url: canonical,
    name: page.post?.title ?? (page.route === '/' ? '手記' : page.title.split('｜')[0]),
    headline: page.post?.title,
    alternativeHeadline: page.post?.subtitle,
    description: page.description,
    inLanguage: 'zh-Hant-TW',
    ...(page.post ? {
      datePublished: page.post.publishedAt,
      ...(page.post.updatedAt ? { dateModified: page.post.updatedAt } : {}),
      timeRequired: `PT${page.post.readingMinutes}M`,
      isPartOf: { '@id': `${canonicalBase}#blog` },
      about: (page.post.tags ?? []).map((tag) => ({ '@type': 'Thing', name: tag })),
    } : {}),
    ...(page.temporalCoverage ? { temporalCoverage: page.temporalCoverage } : {}),
    publisher: {
      '@type': 'Organization',
      '@id': 'https://phenomcanvas.com/#org',
      name: 'Phenom',
      url: 'https://phenomcanvas.com/',
    },
  };
  const head = [
    `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}">`,
    page.keywords.length ? `<meta name="keywords" content="${escapeHtml(page.keywords.join('、'))}">` : '',
    `<meta name="robots" content="${page.indexable === false ? 'noindex,nofollow' : 'index,follow,max-image-preview:large,max-snippet:-1'}">`,
    `<link rel="canonical" href="${canonical}">`,
    '<meta property="og:locale" content="zh_TW">',
    `<meta property="og:type" content="${page.post ? 'article' : 'website'}">`,
    '<meta property="og:site_name" content="手記">',
    `<meta property="og:title" content="${escapeHtml(page.title)}">`,
    `<meta property="og:description" content="${escapeHtml(page.description)}">`,
    `<meta property="og:url" content="${canonical}">`,
    '<meta name="twitter:card" content="summary">',
    `<meta name="twitter:title" content="${escapeHtml(page.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}">`,
    page.post ? `<meta property="article:published_time" content="${page.post.publishedAt}">` : '',
    page.post?.updatedAt ? `<meta property="article:modified_time" content="${page.post.updatedAt}">` : '',
    `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>`,
  ].filter(Boolean).join('\n    ');
  const location = page.route === '/' ? '/notes/' : `/notes${page.route}`;
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, head)
    .replace('<div id="root"></div>', `<div id="root">${render(location)}</div>`);
  const output = path.join(dist, page.file);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, html);
}

const publicPages = pages.filter((page) => page.indexable !== false);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicPages
  .map((page) => `<url><loc>${canonicalFor(page.route)}</loc></url>`)
  .join('')}</urlset>\n`;
await writeFile(path.join(dist, 'sitemap-0.xml'), sitemap);
await writeFile(
  path.join(dist, 'sitemap-index.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${canonicalBase}/sitemap-0.xml</loc></sitemap></sitemapindex>\n`,
);

console.log(`static render complete: ${pages.length} routes`);
