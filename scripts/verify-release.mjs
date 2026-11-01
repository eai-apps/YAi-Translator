/** Лимиты Pages и независимое чтение всех записей созданного ZIP. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const files = walk('dist');
assert(files.length <= 20000, 'Pages file count');
for (const file of files) assert(fs.statSync(file).size <= 25 * 1024 * 1024, `Oversized file: ${file}`);
const publicBytes = walk('public').reduce((sum, file) => sum + fs.statSync(file).size, 0);
assert(publicBytes <= 150 * 1024 * 1024, 'Public data budget');
const manifest = JSON.parse(fs.readFileSync('dist/app/bundle.json'));
const pkg = JSON.parse(fs.readFileSync('package.json'));
assert.equal(manifest.version, pkg.version);
const zip = fs.readFileSync(`dist/app/bundle-${pkg.version}.zip`);
const end = zip.length - 22;
assert.equal(zip.readUInt32LE(end), 0x06054b50, 'ZIP end record');
const count = zip.readUInt16LE(end + 10);
let cursor = zip.readUInt32LE(end + 16);
const names = new Set();
for (let index = 0; index < count; index++) {
  assert.equal(zip.readUInt32LE(cursor), 0x02014b50, 'ZIP central record');
  const size = zip.readUInt32LE(cursor + 20), nameLen = zip.readUInt16LE(cursor + 28);
  const extraLen = zip.readUInt16LE(cursor + 30), commentLen = zip.readUInt16LE(cursor + 32);
  const name = zip.subarray(cursor + 46, cursor + 46 + nameLen).toString('utf8');
  assert(!/^(word|app)\//.test(name) && !/keystore|\.dev\.vars|\.env/.test(name), `Excluded file: ${name}`);
  assert(!names.has(name), `Duplicate: ${name}`); names.add(name);
  const offset = zip.readUInt32LE(cursor + 42);
  assert.equal(zip.readUInt32LE(offset), 0x04034b50);
  const start = offset + 30 + zip.readUInt16LE(offset + 26) + zip.readUInt16LE(offset + 28);
  const raw = inflateRawSync(zip.subarray(start, start + size));
  assert(raw.equals(fs.readFileSync(path.join('dist', name))), `ZIP bytes differ: ${name}`);
  cursor += 46 + nameLen + extraLen + commentLen;
}
assert(names.has('index.html'));
assert.equal(names.size, files.filter(f => !/^dist[\\/](word|app)[\\/]/.test(f)).length);
const result = { version: pkg.version, distFiles: files.length, publicMiB: publicBytes / 1024 / 1024, archiveEntries: count, archiveMiB: zip.length / 1024 / 1024, sha256: createHash('sha256').update(zip).digest('hex') };
fs.writeFileSync('store/screenshots/release-verification.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
