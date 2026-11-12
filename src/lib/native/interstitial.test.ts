import { describe, expect, it, vi } from 'vitest';
import { AD_TTL, createDailyAds } from './interstitial';
describe('daily interstitial policy', () => {
  it('preloads and shows once for each of all three completed daily words', async () => {
    const adapter = { consent: vi.fn().mockResolvedValue(true), prepare: vi.fn().mockResolvedValue(undefined), show: vi.fn().mockResolvedValue(undefined) };
    const ads = createDailyAds(adapter);
    await ads.initialize();
    for (const id of ['2026-11-12', '2026-11-12:2', '2026-11-12:3']) {
      ads.preload(id, 1); await ads.settled();
      await ads.afterResult(id, false);
      await ads.afterResult(id, true);
      await ads.afterResult(id, true);
    }
    expect(adapter.prepare).toHaveBeenCalledTimes(3);
    expect(adapter.show).toHaveBeenCalledTimes(3);
  });
  it('restores preload when an unfinished word resumes after two guesses', async () => {
    const adapter = { consent: vi.fn().mockResolvedValue(true), prepare: vi.fn().mockResolvedValue(undefined), show: vi.fn().mockResolvedValue(undefined) };
    const ads = createDailyAds(adapter); await ads.initialize();
    ads.preload('2026-11-12:2', 2); await ads.settled();
    await ads.afterResult('2026-11-12:2', true);
    expect(adapter.prepare).toHaveBeenCalledTimes(1);
    expect(adapter.show).toHaveBeenCalledTimes(1);
  });
  it('starts preload only on the first valid submitted word', async () => {
    const adapter = { consent: vi.fn().mockResolvedValue(true), prepare: vi.fn().mockResolvedValue(undefined), show: vi.fn() };
    const ads = createDailyAds(adapter);
    await ads.initialize();
    ads.preload('2026-11-12', 0); expect(adapter.prepare).not.toHaveBeenCalled();
    ads.preload('2026-11-12', 1); ads.preload('2026-11-12', 1); ads.preload('2026-11-12', 2);
    await ads.settled(); expect(adapter.prepare).toHaveBeenCalledTimes(1);
  });
  it('shows at most once after the finished result, not during play', async () => {
    const adapter = { consent: vi.fn().mockResolvedValue(true), prepare: vi.fn().mockResolvedValue(undefined), show: vi.fn().mockResolvedValue(undefined) };
    const ads = createDailyAds(adapter);
    await ads.initialize(); ads.preload('2026-11-12', 1); await ads.settled();
    await ads.afterResult('2026-11-12', false); expect(adapter.show).not.toHaveBeenCalled();
    await ads.afterResult('2026-11-12', true); await ads.afterResult('2026-11-12', true);
    expect(adapter.show).toHaveBeenCalledTimes(1);
  });
  it('never requests ads when UMP eligibility is false', async () => {
    const adapter = { consent: vi.fn().mockResolvedValue(false), prepare: vi.fn(), show: vi.fn() };
    const ads = createDailyAds(adapter); await ads.initialize(); ads.preload('2026-11-12', 1);
    await ads.afterResult('2026-11-12', true);
    expect(adapter.prepare).not.toHaveBeenCalled(); expect(adapter.show).not.toHaveBeenCalled();
  });
  it('expires prepared inventory after the reference apps 45 minutes', async () => {
    let now = 1000;
    const adapter = { consent: vi.fn().mockResolvedValue(true), prepare: vi.fn().mockResolvedValue(undefined), show: vi.fn() };
    const ads = createDailyAds(adapter, () => now); await ads.initialize(); ads.preload('2026-11-12', 1); await ads.settled();
    now += AD_TTL; expect(AD_TTL).toBe(2700000);
    await ads.afterResult('2026-11-12', true); expect(adapter.show).not.toHaveBeenCalled();
  });
});