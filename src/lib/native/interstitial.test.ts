import { describe, expect, it, vi } from 'vitest';
import { AD_TTL, createDailyAds } from './interstitial';
describe('daily interstitial policy', () => {
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