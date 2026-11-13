import { describe, expect, it } from 'vitest';
import { readFileSync, mkdtempSync, mkdirSync, cpSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// @ts-expect-error Build-tool module is plain JavaScript, never shipped to the client.
import { iosSourceChecks } from '../../../scripts/ios-source-checks.mjs';

const check = (label: string, root = '.') => iosSourceChecks(root).find(([name]: [string, boolean]) => name === label)?.[1];
describe('requested iOS release identity', () => {
  it('uses se.shiningdays.mrbwordpuzzle in Capacitor, Debug, Release and export', () => {
    for (const label of ['Capacitor bundle ID', 'Debug bundle ID', 'Release bundle ID', 'no old identity in iOS project', 'export identity/team/profile']) expect(check(label)).toBe(true);
  });
  it('uses Apple team F43HQMHCAT for both configurations', () => {
    expect(check('Apple team in Debug and Release')).toBe(true);
  });
  it('uses Mr B Word Puzzle App Store with Apple Distribution for Release', () => {
    expect(check('manual App Store signing')).toBe(true);
    expect(check('App Store provisioning profile')).toBe(true);
    expect(check('automatic development signing')).toBe(true);
  });
  it('rejects wrong Release bundle, team and provisioning profile', () => {
    const root = mkdtempSync(join(tmpdir(), 'word-puzzle-ios-check-'));
    try {
      for (const path of ['ios', 'native-shell', 'src/lib/ord/words']) {
        mkdirSync(join(root, path), { recursive: true });
        cpSync(path, join(root, path), { recursive: true });
      }
      cpSync('capacitor.config.ts', join(root, 'capacitor.config.ts'));
      const path = join(root, 'ios/App/App.xcodeproj/project.pbxproj');
      const source = readFileSync(path, 'utf8');
      const start = source.indexOf('504EC3181FED79650016851F /* Release */ =');
      const mutated = source.slice(0, start) + source.slice(start).replace('se.shiningdays.mrbwordpuzzle', 'se.shiningdays.wrong').replace('F43HQMHCAT', 'WRONGTEAM').replace('Mr B Word Puzzle App Store', 'Wrong Profile');
      writeFileSync(path, mutated);
      expect(check('Release bundle ID', root)).toBe(false);
      expect(check('Apple team in Debug and Release', root)).toBe(false);
      expect(check('App Store provisioning profile', root)).toBe(false);
      expect(check('Debug bundle ID', root)).toBe(true);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});