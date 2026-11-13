import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
// @ts-expect-error JS install-patch module intentionally has no TS declaration.
import {patchInterstitialSafety,patchPluginSafety} from '../../../scripts/admob-safety.mjs';
describe('reproducible native interstitial patch',()=>{
  it('rejects an old-consent load and requires a non-expired presentation deadline',()=>{
    const source=readFileSync('node_modules/@capacitor-community/admob/ios/Sources/AdMobPlugin/Interstitial/AdInterstitialExecutor.swift','utf8');
    const patched=patchInterstitialSafety(source);
    expect(patched).toContain('loadGeneration == self.inventoryGeneration');expect(patched).toContain('Date().timeIntervalSince1970 * 1000 < deadline');
    expect(patched).toContain('call.reject("No active ViewController")');expect(patchInterstitialSafety(patched)).toBe(patched);
  });
  it('registers native cache invalidation and state queries on clean installations',()=>{
    const source=readFileSync('node_modules/@capacitor-community/admob/ios/Sources/AdMobPlugin/AdMobPlugin.swift','utf8');const patched=patchPluginSafety(source);
    expect(patched).toContain('CAPPluginMethod(name: "discardWordPuzzleInterstitial"');expect(patched).toContain('CAPPluginMethod(name: "getWordPuzzleInterstitialState"');
    expect(patchPluginSafety(patched)).toBe(patched);
  });
});