/**
 * Скрипт сборки архива веб-бандла для обновления приложения по воздуху (этап 12):
 * Создаёт dist/app/bundle-<версия>.zip и манифест dist/app/bundle.json.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));
const version = pkg.version;

// Читаем ANDROID_VERSION_CODE из src/config.ts
const configContent = readFileSync(resolve(ROOT, 'src/config.ts'), 'utf-8');
const codeMatch = configContent.match(/ANDROID_VERSION_CODE\s*=\s*(\d+)/);
const versionCode = codeMatch ? Number.parseInt(codeMatch[1], 10) : 3;

const distDir = resolve(ROOT, 'dist');
const appDir = resolve(distDir, 'app');

if (!existsSync(distDir)) {
  console.error('dist/ does not exist. Run "npm run build" first.');
  process.exit(1);
}

if (!existsSync(appDir)) {
  mkdirSync(appDir, { recursive: true });
}

const zipName = `bundle-${version}.zip`;
const zipPath = resolve(appDir, zipName);

console.log(`\n> Creating app bundle: ${zipName}`);

// Создание zip архива
const isWindows = process.platform === 'win32';
let res;

if (isWindows) {
  // На Windows используем PowerShell Compress-Archive
  const psCmd = `Get-ChildItem -Path '${distDir}' -Exclude 'app' | Compress-Archive -DestinationPath '${zipPath}' -Force`;
  res = spawnSync('powershell', ['-NoProfile', '-Command', psCmd], {
    cwd: ROOT,
    stdio: 'inherit',
  });
} else {
  // На Linux / macOS
  res = spawnSync('zip', ['-r', zipPath, '.', '-x', 'app/*'], {
    cwd: distDir,
    stdio: 'inherit',
  });
}

if (res.status === 0 && existsSync(zipPath)) {
  console.log(`[success] App bundle created: ${zipPath}`);
} else {
  console.warn('Warning: Could not package bundle via native zip/powershell.');
}

// Запись манифеста bundle.json
const manifest = {
  version,
  url: `https://yai-translator.pages.dev/app/${zipName}`,
  minVersionCode: versionCode,
};

const manifestPath = resolve(appDir, 'bundle.json');
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
console.log(`[success] Wrote bundle manifest to ${manifestPath}`);
