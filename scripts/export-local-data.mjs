import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const dataDir = resolve(process.env.NOTES_DATA_DIR || '../phenom-notes-data');
const output = resolve('.notes-snapshot');
const args = ['run', 'export:web', '--', '--out', output];
if (process.env.NOTES_ALLOW_DIRTY !== '1') args.push('--require-clean');
execFileSync('npm', args, {
  cwd: dataDir,
  stdio: 'inherit',
});
