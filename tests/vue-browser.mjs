import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require(process.env.NOTES_PLAYWRIGHT_MODULE || 'playwright'); }
catch (error) {
  if (process.env.NOTES_PLAYWRIGHT_MODULE) throw error;
  playwright = require(fileURLToPath(new URL('../../ui/packages/vue-demo/node_modules/playwright', import.meta.url)));
}
const base = new URL(process.argv[2] || 'http://127.0.0.1:4195/notes/');
if (!base.pathname.endsWith('/')) base.pathname += '/';
const evidence = resolve(process.env.NOTES_BROWSER_EVIDENCE_DIR || '.test-evidence/vue-notes');
mkdirSync(evidence, { recursive: true });
const data = name => JSON.parse(readFileSync(new URL(`../src/data/generated/${name}.json`, import.meta.url), 'utf8'));
const notes = data('notes'), inventory = data('inventory'), songs = data('songs'), timeline = data('timeline'), content = data('content');
const errors = [], checks = [], screenshots = [];
const browser = await playwright.chromium.launch();
const contexts = [];
const url = path => new URL(path.replace(/^\//, ''), base).href;
const timeout = 20000;
async function hydrated(p) {
  await p.waitForFunction(() => Boolean(document.getElementById('root')?.__vue_app__), null, {timeout: 60000});
}
async function waitFor(check, label) {
  const start = Date.now();
  while (!(await check())) {
    if (Date.now() - start > timeout) throw new Error(`Timed out: ${label}`);
    await new Promise(resolve => setTimeout(resolve, 80));
  }
}
async function context(viewport) {
  const c = await browser.newContext({ viewport }); contexts.push(c);
  // Optional deterministic delivery of original bytes; each asset URL is its SHA-256 manifest.
  if (process.env.NOTES_FONT_ROOT) {
    await c.route('https://assets.phenomcanvas.com/**', async route => {
      const request = new URL(route.request().url());
      const match = request.pathname.match(/^\/v1\/([a-f0-9]{64})\/fonts\/([\w.-]+\.woff2)$/);
      if (!match) return route.continue();
      const bytes = readFileSync(resolve(process.env.NOTES_FONT_ROOT, match[2]));
      assert.equal(createHash('sha256').update(bytes).digest('hex'), match[1], `font manifest: ${match[2]}`);
      await route.fulfill({ status: 200, contentType: 'font/woff2', headers: { 'access-control-allow-origin': '*' }, body: bytes });
    });
  }
  c.on('page', p => {
    p.on('pageerror', e => errors.push({ type: 'pageerror', url: p.url(), message: e.message }));
    p.on('console', message => {
      if (message.type() === 'error' || /hydration|\[Vue warn\]/i.test(message.text())) {
        errors.push({ type: message.type(), url: p.url(), message: message.text() });
      }
    });
  });
  return c;
}
async function load(p, path = '') {
  const response = await p.goto(url(path), { waitUntil: 'domcontentloaded', timeout: 60000 });
  assert.equal(response.status(), 200, `HTTP ${path}`);
  await p.locator('h1').waitFor();
  // SSR controls exist before their listeners are hydrated on a cold public load.
  await hydrated(p);
  await p.getByRole('button', { name: 'Larger text', exact: true }).first().waitFor();
}
async function pick(p, index, label) {
  const button = p.locator('button[aria-haspopup="listbox"]').nth(index);
  await button.click();
  await p.getByRole('option', { name: label, exact: true }).click();
}
async function query(p, name, expected) {
  await waitFor(() => new URL(p.url()).searchParams.get(name) === expected, `query ${name}=${expected}`);
}
async function count(p, selector, expected) {
  await waitFor(async () => await p.locator(selector).count() === expected, `${selector} count ${expected}`);
}
async function scale(p, expected) {
  await waitFor(async () => (await p.getByRole('button', { name: 'Reset text size', exact: true }).first().textContent()).trim() === expected, `scale ${expected}`);
}
async function shot(p, name) {
  const path = resolve(evidence, `${name}.png`); await p.screenshot({ path }); screenshots.push(path);
}
try {
  const desktop = await context({ width: 1440, height: 1000 });
  const p = await desktop.newPage();
  await load(p, '?keep=regression');
  const tag = notes.tags.find(t => t.count > 0 && t.count < notes.posts.length);
  assert(tag, 'real subset tag required');
  await pick(p, 0, `${tag.label}（${tag.count}）`);
  await query(p, 'tag', tag.label);
  assert.equal(new URL(p.url()).searchParams.get('keep'), 'regression');
  await count(p, 'h3[id^="post-"]', tag.count);
  await p.goBack(); await query(p, 'tag', null);
  await count(p, 'h3[id^="post-"]', notes.posts.length);
  checks.push('Home tag changes visible posts; Back restores every post and unrelated query survives');

  await p.getByRole('button', { name: 'Larger text', exact: true }).first().click();
  await scale(p, '110%');
  await p.reload({ waitUntil: 'domcontentloaded' }); await hydrated(p); await scale(p, '110%');
  assert.equal(await p.evaluate(() => localStorage.getItem('canvaslab:fontScale')), '1.1');
  await p.getByRole('button', { name: 'Reset text size', exact: true }).first().click(); await scale(p, '100%');
  checks.push('Reading size changes, persists through reload, and resets');

  await p.getByRole('button', { name: '外觀', exact: true }).click();
  const palette = p.getByRole('menu').locator('button[aria-label][aria-pressed="false"]').first();
  const paletteName = await palette.getAttribute('aria-label');
  assert(paletteName, 'named alternate palette'); await palette.click();
  const savedPalette = await p.evaluate(() => localStorage.getItem('canvaslab:palette'));
  assert(savedPalette, 'palette saved');
  const accent = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--c-accent').trim());
  assert(accent, 'palette applied');
  await p.keyboard.press('Escape'); await count(p, '[role="menu"]', 0);
  await p.reload({ waitUntil: 'domcontentloaded' }); await hydrated(p);
  await p.getByRole('button', { name: '外觀', exact: true }).click();
  assert.equal(await p.getByRole('button', { name: paletteName, exact: true }).getAttribute('aria-pressed'), 'true');
  assert.equal(await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--c-accent').trim()), accent);
  await p.keyboard.press('Escape');
  checks.push('Appearance applies a named palette, persists through reload, and dismisses with Escape');

  await load(p, 'inventory?keep=regression');
  const item = inventory.items.find(i => i.financialClass && i.valueRoles?.length);
  assert(item, 'real inventory item with finance and role required');
  const cat = inventory.categories.find(c => c.id === item.category);
  await pick(p, 0, `${cat.label}（${cat.count}）`); await query(p, 'category', item.category);
  // Labels include counts; use options matching actual filter values to select through the visible UI.
  await p.locator('button[aria-haspopup="listbox"]').nth(1).click();
  const financeLabels = { 'fixed-asset': '固定設備', 'movable-asset': '可移動設備', 'monthly-fixed': '每月固定支出', 'monthly-variable': '每月浮動支出' };
  await p.getByRole('option', { name: `${financeLabels[item.financialClass]}（${inventory.stats.byFinancialClass[item.financialClass] ?? 0}）`, exact: true }).click();
  await query(p, 'finance', item.financialClass);
  const roleLabels = { 'production-tool': '生產工具', 'capability-investment': '能力投資', 'health-investment': '健康投資', 'necessary-cost': '必要成本', consumption: '一般消費' };
  const role = item.valueRoles[0], roleCount = inventory.items.filter(i => i.valueRoles?.includes(role)).length;
  await pick(p, 2, `${roleLabels[role]}（${roleCount}）`); await query(p, 'role', role);
  await count(p, 'h3[id^="item-"]', inventory.items.filter(i => i.category === item.category && i.financialClass === item.financialClass && i.valueRoles?.includes(role)).length);
  const filteredUrl = p.url();
  await p.getByRole('button', { name: '清除', exact: true }).click();
  await query(p, 'category', null); await query(p, 'finance', null); await query(p, 'role', null);
  await count(p, 'h3[id^="item-"]', inventory.items.length);
  assert.equal(new URL(p.url()).searchParams.get('keep'), 'regression');
  await p.goBack(); await waitFor(() => p.url() === filteredUrl, 'one Back restores all three inventory filters');
  checks.push('Inventory combines three filters; one clear and one Back update all dimensions atomically');

  await load(p, 'songs');
  const language = songs.languages.find(l => l.count > 0);
  await pick(p, 0, `${language.label}（${language.count}）`); await query(p, 'language', language.id);
  await count(p, 'h3[id^="song-"]', language.count);
  await p.getByRole('button', { name: '依日期', exact: true }).click(); await query(p, 'group', 'date');
  await count(p, 'h2[id^="language-"]', 0); await count(p, 'h3[id^="song-"]', language.count);
  await p.getByRole('button', { name: '分語言', exact: true }).click(); await query(p, 'group', null);
  await count(p, 'h2[id^="language-"]', 1);
  checks.push('Songs language filter and both grouping modes retain the complete selected song list');

  await load(p, 'timeline');
  const kind = timeline.kinds.find(k => k.count > 0 && k.count < timeline.events.length);
  assert(kind, 'real timeline subset required');
  await pick(p, 0, `${kind.label}（${kind.count}）`); await query(p, 'kind', kind.id);
  await count(p, 'h3[id^="event-"]', kind.count);
  await p.getByRole('button', { name: '清除', exact: true }).click(); await query(p, 'kind', null);
  await count(p, 'h3[id^="event-"]', timeline.events.length);
  checks.push('Timeline kind filter and reset match exact exported counts');

  await load(p);
  const post = notes.posts.find(post => content.posts[post.slug]?.html);
  assert(post, 'real article required');
  await p.locator('h3').filter({ hasText: post.title }).first().click();
  await p.getByRole('heading', { name: post.title, exact: true, level: 1 }).waitFor();
  const prose = p.locator('.notes-html').first();
  assert((await prose.textContent()).trim().length > 40, 'article body present after client navigation');
  const articleText = (await prose.textContent()).replace(/\s+/g, ' ').trim();
  await p.reload({ waitUntil: 'domcontentloaded' }); await hydrated(p);
  await p.getByRole('heading', { name: post.title, exact: true, level: 1 }).waitFor();
  assert.equal((await prose.textContent()).replace(/\s+/g, ' ').trim(), articleText, 'article survives direct SSR reload');
  checks.push('Home article link renders full body and direct reload preserves exact text');
  await shot(p, 'desktop-article');

  const annotated = notes.posts.find(post => content.posts[post.slug]?.notes?.length && content.posts[post.slug].html.includes('data-note'));
  const annotatedKb = !annotated && Object.entries(content.kb || {}).find(([, body]) => body.notes?.length && body.html.includes('data-note'));
  assert(annotated || annotatedKb, 'real annotated content required');
  await load(p, annotated ? annotated.route : `kb/${annotatedKb[0]}`);
  const marker = p.locator('.notes-html [data-note]').first();
  await marker.click();
  const tooltip = p.getByRole('tooltip'); await tooltip.waitFor();
  assert((await tooltip.textContent()).trim().length > 1, 'annotation text is visible');
  await p.mouse.move(1400, 950);
  // Longer than the original 140 ms close delay: a clicked annotation remains pinned.
  await p.waitForTimeout(250); assert(await tooltip.isVisible());
  await p.keyboard.press('Escape'); await count(p, '[role="tooltip"]', 0);
  checks.push('A real annotation opens, remains pinned away from its marker, and closes with Escape');

  const mobile = await context({ width: 390, height: 844 });
  const m = await mobile.newPage();
  await load(m, post.route);
  assert(await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'mobile has no horizontal overflow');
  const toolbar = m.getByRole('toolbar', { name: '頁面導覽', exact: true }); await toolbar.waitFor();
  const trigger = toolbar.getByRole('button', { name: '目次', exact: true });
  const overflow = await m.evaluate(() => document.body.style.overflow);
  await trigger.click(); await m.getByRole('dialog', { name: '目次', exact: true }).waitFor();
  await waitFor(async () => await m.evaluate(() => document.body.style.overflow) === 'hidden', 'drawer locks body scrolling');
  await shot(m, 'mobile-drawer');
  await m.keyboard.press('Escape'); await count(m, '[role="dialog"]', 0);
  assert.equal(await m.evaluate(() => document.body.style.overflow), overflow, 'body scrolling restored');
  assert(await trigger.evaluate(el => el === document.activeElement), 'drawer focus restored');
  await trigger.click();
  const another = notes.posts.find(other => other.slug !== post.slug && content.posts[other.slug]?.html);
  assert(another, 'second real article for mobile navigation');
  await m.getByRole('dialog').getByRole('link', { name: another.title, exact: true }).click();
  await m.getByRole('heading', { name: another.title, exact: true, level: 1 }).waitFor();
  await count(m, '[role="dialog"]', 0);
  assert((await m.locator('.notes-html').first().textContent()).trim().length > 40, 'mobile article body follows navigation');
  assert.equal(await m.evaluate(() => document.body.style.overflow), overflow);
  await shot(m, 'mobile-article');
  checks.push('Mobile drawer locks/restores scrolling and focus; links close it and navigate to full article content');

  assert.deepEqual(errors, [], 'browser runtime/hydration/console errors');
  writeFileSync(resolve(evidence, 'acceptance.json'), JSON.stringify({ base: base.href, checks, screenshots, errors, fontPolicy: process.env.NOTES_FONT_ROOT ? 'Exact local font bytes checked against each immutable asset URL SHA-256' : 'Real network font delivery' }, null, 2) + '\n');
  console.log(`PASS ${checks.length} Notes Vue browser regression groups`);
} catch (error) {
  writeFileSync(resolve(evidence, 'failure.json'), JSON.stringify({ base: base.href, checks, screenshots, errors, failure: error.stack }, null, 2) + '\n');
  throw error;
} finally {
  await Promise.all(contexts.map(c => c.close()));
  await browser.close();
}
