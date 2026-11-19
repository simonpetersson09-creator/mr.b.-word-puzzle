import { describe, expect, it } from 'vitest';
import { validAdminKey, adminWinPercent, adminVisibleDays, adminRollingAverage, type AdminDay } from './admin';

describe('admin access', () => {
  const row = (day: string, played: number): AdminDay => ({ day, played, ios: played, android: 0, finished: played * 3, wins: played, average: 0 });
  it('starts on November 19, 2026 and excludes older statistics without changing input', () => {
    const days = [row('2026-11-18', 8), row('2026-11-19', 2), row('2026-11-20', 4)];
    expect(adminVisibleDays(days).map(day => day.day)).toEqual(['2026-11-20', '2026-11-19']);
    expect(days).toHaveLength(3);
  });
  it('calculates means from available days since the start, not old records', () => {
    expect(adminRollingAverage([row('2026-11-18', 100), row('2026-11-19', 2), row('2026-11-20', 4)], '2026-11-20', 'played')).toBe(3);
  });
  it('rejects an unconfigured, empty or incorrect credential', async () => {
    expect(await validAdminKey('test-only', undefined)).toBe(false);
    expect(await validAdminKey('', 'test-only')).toBe(false);
    expect(await validAdminKey('other-test', 'test-only')).toBe(false);
  });
  it('accepts only the matching credential', async () => {
    expect(await validAdminKey('test-only', 'test-only')).toBe(true);
  });
  it('does not claim a win percentage without completed words', () => {
    expect(adminWinPercent({ finished: 0, wins: 0 })).toBeNull();
    expect(adminWinPercent({ finished: 3, wins: 2 })).toBe(67);
  });
});