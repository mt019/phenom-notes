import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const dataDir = resolve(process.env.NOTES_DATA_DIR || '../notes-data');
const output = resolve('.notes-snapshot');
execFileSync('npm', ['run', 'export:web', '--', '--out', output, '--require-clean'], {
  cwd: dataDir,
  stdio: 'inherit',
});
