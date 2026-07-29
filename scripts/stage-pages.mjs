import {
  copyFileSync,
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
writeFileSync(
  join(dist, 'index.html'),
  '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/notes/"><title>手記</title><a href="/notes/">前往手記</a>\n',
);

console.log('Cloudflare Pages artifact staged under /notes with a root entry redirect');
