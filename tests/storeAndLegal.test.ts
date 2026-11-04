import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { APP_VERSION, ANDROID_VERSION_CODE, storeBuild } from '../src/config';
import { APP_VERSION as SERVER_APP_VERSION } from '../functions/_lib/config';

describe('Part 21: Store readiness, versions and legal checks', () => {
  const root = process.cwd();

  // Версия сайта (1.0.1+) может обгонять версию APK: сайт обновляется сам, APK — только при изменении нативной части.
  // Проверяем согласованность внутри каждой группы, а не одну жёсткую цифру (исправление Claude, 1.0.1).
  it('site, server and package versions match; APK versions match each other', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const versionJson = JSON.parse(fs.readFileSync(path.join(root, 'public/version.json'), 'utf8'));
    const gradle = fs.readFileSync(path.join(root, 'android/app/build.gradle'), 'utf8');

    expect(SERVER_APP_VERSION).toBe(APP_VERSION);
    expect(pkg.version).toBe(APP_VERSION);
    expect(gradle).toContain(`versionName "${versionJson.versionName}"`);
  });

  it('ANDROID_VERSION_CODE is 5 across mobile configs', () => {
    const versionJson = JSON.parse(fs.readFileSync(path.join(root, 'public/version.json'), 'utf8'));
    const gradle = fs.readFileSync(path.join(root, 'android/app/build.gradle'), 'utf8');

    expect(ANDROID_VERSION_CODE).toBe(5);
    expect(versionJson.versionCode).toBe(5);
    expect(gradle).toContain('versionCode 5');
  });

  it('store/ directory contains complete store assets', () => {
    const storeDir = path.join(root, 'store');
    expect(fs.existsSync(path.join(storeDir, 'DESCRIPTIONS.md'))).toBe(true);
    expect(fs.existsSync(path.join(storeDir, 'RUSTORE.md'))).toBe(true);
    expect(fs.existsSync(path.join(storeDir, 'icon-512.png'))).toBe(true);
    expect(fs.existsSync(path.join(storeDir, 'tv-banner-1280x720.png'))).toBe(true);

    const shotsDir = path.join(storeDir, 'screenshots');
    const expectedPhoneShots = [
      'phone_01_translate.png',
      'phone_02_card.png',
      'phone_03_study.png',
      'phone_04_phrasebook.png',
      'phone_05_letter.png',
      'phone_06_dialog.png',
      'phone_07_grammar.png',
      'phone_08_offline.png',
    ];
    for (const shot of expectedPhoneShots) {
      expect(fs.existsSync(path.join(shotsDir, shot)), `Missing ${shot}`).toBe(true);
    }

    const expectedTvShots = ['tv_01_translate.png', 'tv_02_dictionary.png'];
    for (const shot of expectedTvShots) {
      expect(fs.existsSync(path.join(shotsDir, shot)), `Missing ${shot}`).toBe(true);
    }
  });

  it('storeBuild() correctly handles store types', () => {
    const origEnv = import.meta.env.VITE_STORE;
    try {
      import.meta.env.VITE_STORE = 'play';
      expect(storeBuild()).toBe('play');

      import.meta.env.VITE_STORE = 'rustore';
      expect(storeBuild()).toBe('rustore');
    } finally {
      import.meta.env.VITE_STORE = origEnv;
    }
  });
});
