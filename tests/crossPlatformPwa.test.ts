import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { detectPlatform } from '../src/utils/platform.ts';

test('Cross-Platform Structure & PWA Verification', async (t) => {
  await t.test('detectPlatform returns safe defaults in node environment', () => {
    const platform = detectPlatform();
    assert.strictEqual(typeof platform.isAndroid, 'boolean');
    assert.strictEqual(typeof platform.isIOS, 'boolean');
    assert.strictEqual(typeof platform.isMacOS, 'boolean');
    assert.strictEqual(typeof platform.isStandalone, 'boolean');
    assert.strictEqual(typeof platform.isTouchDevice, 'boolean');
    assert.strictEqual(platform.platformName, 'Web');
  });

  await t.test('Web App Manifest is complete and meets PWA installability requirements', () => {
    const manifestPath = path.resolve('public/manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist in public/');

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.strictEqual(manifest.id, '/');
    assert.strictEqual(manifest.start_url, '/');
    assert.strictEqual(manifest.display, 'standalone');
    assert.ok(manifest.short_name.length <= 12, 'short_name must be 12 chars or fewer for mobile launchers');
    assert.ok(manifest.icons.length >= 2, 'manifest must have multiple icons');

    const has192 = manifest.icons.some((i: { sizes: string }) => i.sizes === '192x192');
    const has512 = manifest.icons.some((i: { sizes: string }) => i.sizes === '512x512');
    const hasMaskable = manifest.icons.some((i: { purpose?: string }) => i.purpose === 'maskable');

    assert.ok(has192, 'Manifest must specify 192x192 icon');
    assert.ok(has512, 'Manifest must specify 512x512 icon');
    assert.ok(hasMaskable, 'Manifest must specify maskable icon for Android adaptive icons');
  });

  await t.test('Public directory contains compliant PNG and SVG icons', () => {
    const publicDir = path.resolve('public');
    const expectedAssets = [
      'pwa-192x192.png',
      'pwa-512x512.png',
      'pwa-maskable-512x512.png',
      'apple-touch-icon.png',
      'icon.svg',
    ];

    for (const asset of expectedAssets) {
      const fullPath = path.join(publicDir, asset);
      assert.ok(fs.existsSync(fullPath), `${asset} must exist in public/`);
      const stat = fs.statSync(fullPath);
      assert.ok(stat.size > 0, `${asset} must not be empty`);
    }
  });

  await t.test('Android structure and Gradle configurations exist', () => {
    const manifestPath = path.resolve('android/app/src/main/AndroidManifest.xml');
    assert.ok(fs.existsSync(manifestPath), 'AndroidManifest.xml must exist');

    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    assert.ok(manifestContent.includes('android.permission.INTERNET'), 'Must declare INTERNET permission');
    assert.ok(manifestContent.includes('android.permission.ACCESS_NETWORK_STATE'), 'Must declare NETWORK_STATE permission');

    assert.ok(fs.existsSync(path.resolve('android/build.gradle')), 'android/build.gradle must exist');
    assert.ok(fs.existsSync(path.resolve('android/app/build.gradle')), 'android/app/build.gradle must exist');
    assert.ok(fs.existsSync(path.resolve('android/settings.gradle')), 'android/settings.gradle must exist');
  });

  await t.test('iOS and macOS bundle configurations exist', () => {
    const iosPlistPath = path.resolve('ios/Runner/Info.plist');
    assert.ok(fs.existsSync(iosPlistPath), 'ios/Runner/Info.plist must exist');

    const iosPlist = fs.readFileSync(iosPlistPath, 'utf8');
    assert.ok(iosPlist.includes('CFBundleDisplayName'), 'iOS Info.plist must have CFBundleDisplayName');

    const macosPlistPath = path.resolve('macos/Runner/Info.plist');
    assert.ok(fs.existsSync(macosPlistPath), 'macos/Runner/Info.plist must exist');

    const macosConfigPath = path.resolve('macos/Runner/Configs/AppInfo.xcconfig');
    assert.ok(fs.existsSync(macosConfigPath), 'macos/Runner/Configs/AppInfo.xcconfig must exist');
  });
});
