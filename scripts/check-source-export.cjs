const { execFileSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 128 * 1024 * 1024 });
const environmentFile = (name) => /(^|\/)\.env(?:$|\.)/.test(name);
const tracked = git('ls-files', '-z').toString().split('\0').filter(Boolean);
const unsafe = tracked.filter((name) => environmentFile(name) && !name.endsWith('.env.example'));
if (unsafe.length) throw new Error(`Local environment files must not be tracked: ${unsafe.join(', ')}`);

// Validate the artifact used for Hashlist/source datasets, including templates.
const archive = git('archive', '--format=tar', 'HEAD');
const exported = [];
for (let offset = 0; offset + 512 <= archive.length;) {
  const header = archive.subarray(offset, offset + 512);
  if (header.every((byte) => byte === 0)) break;
  const read = (start, length) => header.subarray(start, start + length).toString().split('\0')[0];
  const name = [read(345, 155), read(0, 100)].filter(Boolean).join('/');
  const size = parseInt(read(124, 12).trim() || '0', 8);
  if (!Number.isSafeInteger(size)) throw new Error('Invalid source archive');
  exported.push(name);
  offset += 512 + Math.ceil(size / 512) * 512;
}
const forbidden = exported.filter((name) => environmentFile(name) || /(^|\/)\.git(?:\/|$)/.test(name));
if (forbidden.length) throw new Error(`Source export contains excluded files: ${forbidden.join(', ')}`);
console.log('Source hygiene passed: no tracked local environment files; source archive excludes all dotenv files and Git objects.');
