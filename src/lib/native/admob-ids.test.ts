import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ORD_IOS_APP_ID, ORD_IOS_INTERSTITIAL_ID, createDailyAds } from './interstitial';

describe('Word Puzzle AdMob', () => {
  it('uses Word Puzzle IDs in code and Info.plist', () => {
    expect(ORD_IOS_APP_ID).toBe('ca-app-pub-7448540924654868~2156468939');
    expect(ORD_IOS_INTERSTITIAL_ID).toBe('ca-app-pub-7448540924654868/9979118636');
    const plist = readFileSync('ios/App/App/Info.plist', 'utf8');
    expect(plist).toContain('<string>ca-app-pub-7448540924654868~2156468939</string>');
    expect(plist).not.toContain('ca-app-pub-3940256099942544');
  });
  it('never shows an ad before the round is finished, and a failed ad does not block', async () => {
    let shows = 0;
    const ads = createDailyAds({ consent: async () => true, prepare: async () => {}, show: async () => { shows++; throw new Error('no fill'); } });
    await ads.initialize(); ads.preload('d', 1); await ads.settled();
    await ads.afterResult('d', false); expect(shows).toBe(0);
    await expect(ads.afterResult('d', true)).resolves.toBeUndefined(); expect(shows).toBe(1);
  });
});
