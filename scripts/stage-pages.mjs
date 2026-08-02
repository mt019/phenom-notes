import {
  copyFileSync,
  existsSync,
  mkdirSync,
  renameSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const source = resolve(root, '.pages-stage');
const notes = join(dist, 'notes');

rmSync(source, { recursive: true, force: true });
renameSync(dist, source);
mkdirSync(notes, { recursive: true });
for (const name of readdirSync(source)) {
  renameSync(join(source, name), join(notes, name));
}
rmSync(source, { recursive: true, force: true });

copyFileSync(
  join(notes, 'deployment-manifest.json'),
  join(dist, 'deployment-manifest.json'),
);
copyFileSync(
  join(notes, '404.html'),
  join(dist, '404.html'),
);
copyFileSync(
  join(notes, 'phenom-ring.svg'),
  join(dist, 'phenom-ring.svg'),
);
// Cloudflare Pages 只讀部署目錄根層的 _headers。上面那段把整個 dist 搬進 dist/notes，
// 所以要把它搬回根層——留在 dist/notes/_headers 不會報錯，只是完全沒有作用。
// 這一步漏掉的話，phenom-ops 的 smoke-pages.mjs 會在資產的 Cache-Control 上看出來。
const stagedHeaders = join(notes, '_headers');
if (!existsSync(stagedHeaders)) {
  throw new Error('public/_headers 不見了；快取標頭是靠它設的，缺了會安靜地退回 Pages 預設');
}
renameSync(stagedHeaders, join(dist, '_headers'));

writeFileSync(
  join(dist, 'index.html'),
  '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/notes/"><title>手記</title><a href="/notes/">前往手記</a>\n',
);

console.log('Cloudflare Pages artifact staged under /notes with a root entry redirect');
