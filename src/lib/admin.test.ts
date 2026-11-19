import { describe, expect, it } from 'vitest';
import { validAdminKey, adminWinPercent } from './admin';

describe('admin access', () => {
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