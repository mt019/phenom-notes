import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const snapshotManifestPath = resolve(process.env.NOTES_SNAPSHOT_DIR || '.notes-snapshot', 'manifest.json');
const snapshotManifestBytes = readFileSync(snapshotManifestPath);
const snapshot = JSON.parse(snapshotManifestBytes);
let webCommit = process.env.WEB_COMMIT || '';
if (!webCommit) {
  try {
    webCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    webCommit = '';
  }
}
if (!/^[0-9a-f]{40}$/.test(webCommit)) {
  throw new Error('WEB_COMMIT 必須是完整 40 字元 Git SHA；先提交或在 CI 傳入精確 revision');
}
const manifest = {
  schemaVersion: 1,
  site: 'notes',
  hostname: 'notes.phenomcanvas.com',
  webRepository: 'mt019/phenom-notes',
  webCommit,
  dataRepository: 'mt019/phenom-notes-data',
  dataCommit: snapshot.source.commit,
  snapshotManifestSha256: createHash('sha256').update(snapshotManifestBytes).digest('hex'),
  generatedAt: new Date().toISOString(),
};
writeFileSync(resolve('dist', 'deployment-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
