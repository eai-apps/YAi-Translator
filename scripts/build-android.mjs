/**
 * Сборка веб-части для нативного Android-приложения (Capacitor)
 * с параметрами VITE_STORE_BUILD=android и VITE_API_BASE=https://yai-translator.pages.dev,
 * после чего выполняется синхронизация ассетов в android/ через cap sync.
 */
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const env = {
  ...process.env,
  VITE_STORE_BUILD: 'android',
  VITE_API_BASE: 'https://yai-translator.pages.dev',
};

function run(command, args) {
  console.log(`\n> ${command} ${args.join(' ')}`);
  const isWindows = process.platform === 'win32';
  const executable = isWindows ? `${command}.cmd` : command;
  const res = spawnSync(executable, args, {
    cwd: ROOT,
    env,
    stdio: 'inherit',
    shell: isWindows,
  });
  if (res.status !== 0) {
    console.error(`Command failed with exit code ${res.status}`);
    process.exit(res.status ?? 1);
  }
}

// 1. Проверка типов TypeScript (фронтенд и бэкенд)
run('npm', ['run', 'typecheck']);

// 2. Сборка фронтенда через Vite
run('npx', ['vite', 'build']);

// 3. Синхронизация ассетов и плагинов в нативный проект Android
run('npx', ['cap', 'sync', 'android']);

console.log('\n[success] Android web build and Capacitor sync completed successfully!');
