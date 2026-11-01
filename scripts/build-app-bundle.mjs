/** Архив OTA на Node.js: одинаково на Windows и в GitHub Actions, без внешней команды zip. */
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const version = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')).version;
const config = readFileSync(resolve(ROOT, 'src/config.ts'), 'utf8');
const versionCode = Number(config.match(/ANDROID_VERSION_CODE\s*=\s*(\d+)/)?.[1]);
if (!versionCode) throw new Error('ANDROID_VERSION_CODE is missing');
const dist = resolve(ROOT, 'dist');
if (!existsSync(resolve(dist, 'index.html'))) throw new Error('Build dist/index.html first');
const app = resolve(dist, 'app');
mkdirSync(app, { recursive: true });
const table = Array.from({ length: 256 }, (_, n) => {
  for (let bit = 0; bit < 8; bit++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = table[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (dir === dist && ['app', 'word'].includes(entry.name)) return [];
    const file = resolve(dir, entry.name);
    return entry.isDirectory() ? walk(file) : entry.isFile() ? [file] : [];
  });
}
const local = [], central = [];
let offset = 0;
const files = walk(dist).sort();
for (const file of files) {
  const name = Buffer.from(relative(dist, file).replaceAll('\\', '/'));
  const raw = readFileSync(file), compressed = deflateRawSync(raw, { level: 9 });
  const crc = crc32(raw);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4); header.writeUInt16LE(0x0800, 6); header.writeUInt16LE(8, 8);
  header.writeUInt16LE(33, 12);
  header.writeUInt32LE(crc, 14); header.writeUInt32LE(compressed.length, 18); header.writeUInt32LE(raw.length, 22);
  header.writeUInt16LE(name.length, 26);
  const entry = Buffer.alloc(46);
  entry.writeUInt32LE(0x02014b50, 0); entry.writeUInt16LE(20, 4); entry.writeUInt16LE(20, 6);
  entry.writeUInt16LE(0x0800, 8); entry.writeUInt16LE(8, 10); entry.writeUInt16LE(33, 14);
  entry.writeUInt32LE(crc, 16); entry.writeUInt32LE(compressed.length, 20); entry.writeUInt32LE(raw.length, 24);
  entry.writeUInt16LE(name.length, 28); entry.writeUInt32LE(offset, 42);
  local.push(header, name, compressed); central.push(entry, name);
  offset += header.length + name.length + compressed.length;
}
if (files.length > 65535) throw new Error('Too many bundle entries');
const directory = Buffer.concat(central), end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
const archive = Buffer.concat([...local, directory, end]);
if (archive.length > 25 * 1024 * 1024) throw new Error('OTA archive exceeds the Pages 25 MiB file limit');
const zipName = `bundle-${version}.zip`;
writeFileSync(resolve(app, zipName), archive);
writeFileSync(resolve(app, 'bundle.json'), JSON.stringify({ version, url: `https://yai-translator.pages.dev/app/${zipName}`, minVersionCode: versionCode }, null, 2) + '\n');
console.log(`Created ${zipName}: ${files.length} files, ${(archive.length / 1024 / 1024).toFixed(2)} MiB`);
