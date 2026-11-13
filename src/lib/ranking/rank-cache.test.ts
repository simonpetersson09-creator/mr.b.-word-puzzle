import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
import { cacheRank, readCachedRank, restoreCachedRank } from './rank-cache';
beforeEach(() => localStorage.clear());
it('restores the previous country percentile and replaces it only with a valid fresh result', async () => {
  await cacheRank({ country: 'SE', players: 10, betterThan: 70 });
  expect(await restoreCachedRank()).toEqual({ country: 'SE', players: 10, betterThan: 70 });
  await cacheRank({ country: 'SE', players: 12, betterThan: 75 });
  expect(readCachedRank()?.betterThan).toBe(75);
  await cacheRank({ country: 'SE', players: 12, betterThan: 101 });
  expect(readCachedRank()?.betterThan).toBe(75);
});
it('ignores damaged cached values without stopping the game', () => {
  localStorage.setItem('mrb-word-puzzle:country-rank-v1', '{bad');
  expect(readCachedRank()).toBeNull();
});