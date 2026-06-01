// project backup — zip entire project with timestamp
// Usage: node scripts/backup.mjs [备注]
import { join } from 'path';
import { execSync } from 'child_process';
import { mkdirSync, existsSync } from 'fs';

const PROJECT = join(import.meta.dirname, '..');
const BACKUP_DIR = join(PROJECT, 'backups');
if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR);

const now = new Date();
const pad = n => String(n).padStart(2, '0');
const ts = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
const note = process.argv[2] ? `-${process.argv[2]}` : '';
const name = `backup-${ts}${note}.zip`;
const out = join(BACKUP_DIR, name);

// Windows: use PowerShell Compress-Archive
const cmd = `powershell -Command "Compress-Archive -Path '${PROJECT}\\*.html','${PROJECT}\\*.md','${PROJECT}\\*.json','${PROJECT}\\*.txt','${PROJECT}\\notes','${PROJECT}\\scripts' -DestinationPath '${out}' -Force"`;

try {
  execSync(cmd, { stdio: 'inherit', cwd: PROJECT });
  console.log('[backup] Created:', out);
} catch (e) {
  console.error('[backup] FAIL:', e.message);
  process.exit(1);
}
