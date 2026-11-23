import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
// @ts-expect-error Build-time JavaScript helpers do not enter the application.
import { checkNode, checkAndroidBuildMode, javaMajor, localSdk, androidEnvironment } from '../../../scripts/android-tools.mjs';

describe('Android build tool prerequisites', () => {
  it('never builds a debug APK from release preparation', () => {
    expect(() => checkAndroidBuildMode('build', true)).toThrow('test APK');
    expect(() => checkAndroidBuildMode('build', false)).not.toThrow();
    expect(() => checkAndroidBuildMode('bundle', true)).not.toThrow();
  });
  it('guards both direct Gradle debug and release builds with variant-matched verification', () => {
    const gradle = readFileSync('android/app/build.gradle', 'utf8');
    expect(gradle).toContain("task.name == 'preReleaseBuild' || task.name == 'preDebugBuild'");
    expect(gradle).toContain("if (task.name == 'preReleaseBuild') verifyArgs.add('--release')");
    expect(gradle).toContain('commandLine verifyArgs');
  });
  it('requires Node 22.12 or later', () => {
    expect(() => checkNode('22.11.0')).toThrow('22.12');
    expect(() => checkNode('22.12.0')).not.toThrow();
    expect(() => checkNode('24.0.0')).not.toThrow();
  });
  it('reads JDK 21 versions without confusing them with Java 17', () => {
    expect(javaMajor('openjdk version "21.0.8" 2025-07-15')).toBe(21);
    expect(javaMajor('java version "17.0.1"')).toBe(17);
    expect(javaMajor('command not found')).toBe(0);
  });
  it('reads Android Studio SDK paths including escaped Windows separators', () => {
    expect(localSdk('sdk.dir=/Users/simon/Library/Android/sdk\n')).toBe('/Users/simon/Library/Android/sdk');
    expect(localSdk('sdk.dir=C\\:\\Users\\simon\\Android\\Sdk')).toBe('C:\\Users\\simon\\Android\\Sdk');
  });
  it('rejects conflicting SDK environment configuration', () => {
    expect(() => androidEnvironment({ ANDROID_HOME: '/sdk-one', ANDROID_SDK_ROOT: '/sdk-two' })).toThrow('disagree');
  });
  it('requires Platform 36 and Build Tools 36.0.0 rather than an older installed SDK', () => {
    const root = mkdtempSync(join(tmpdir(), 'word-sdk-'));
    try {
      const sdk = join(root, 'sdk');
      expect(() => androidEnvironment({ ANDROID_HOME: sdk }, root)).toThrow('platforms/android-36/android.jar');
      const path = join(sdk, 'platforms/android-36/android.jar');
      mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, 'fixture');
      expect(() => androidEnvironment({ ANDROID_HOME: sdk }, root)).toThrow('build-tools/36.0.0');
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
  it('preserves existing app IDs and version numbers without adding release signing', () => {
    const gradle = readFileSync('android/app/build.gradle', 'utf8');
    expect(gradle).toContain('applicationId "com.mrb.wordpuzzle"');
    expect(gradle).toContain('versionCode 1');
    expect(gradle).toContain('versionName "1.0"');
    expect(gradle).not.toContain('signingConfigs');
  });
});