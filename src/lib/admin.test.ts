import { describe, expect, it } from 'vitest';
import { validAdminKey, validHubToken, adminWinPercent, adminVisibleDays, adminRollingAverage, type AdminDay } from './admin';

describe('admin access', () => {
  const row = (day: string, played: number): AdminDay => ({ day, played, ios: played, android: 0, finished: played * 3, wins: played, average: 0 });
  it('starts on November 24, 2026 and excludes older statistics without changing input', () => {
    const days = [row('2026-11-23', 8), row('2026-11-24', 2), row('2026-11-25', 4)];
    expect(adminVisibleDays(days).map(day => day.day)).toEqual(['2026-11-25', '2026-11-24']);
    expect(days).toHaveLength(3);
  });
  it('calculates means from available days since the start, not old records', () => {
    expect(adminRollingAverage([row('2026-11-23', 100), row('2026-11-24', 2), row('2026-11-25', 4)], '2026-11-25', 'played')).toBe(3);
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

describe('MrB admin hub token', () => {
  const secret = 'test-only-hub-secret';
  const now = 1795528260000;
  async function token(exp: number, signingSecret = secret) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(signingSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(`mrb-hub:${exp}`));
    return `${exp}.${Array.from(new Uint8Array(mac), byte => byte.toString(16).padStart(2, '0')).join('')}`;
  }
  it('accepts a matching HMAC-SHA256 signature and future millisecond expiry', async () => {
    expect(await validHubToken(await token(now + 60000), secret, now)).toBe(true);
  });
  it('rejects a wrong signature', async () => {
    expect(await validHubToken(await token(now + 60000, 'wrong-test-secret'), secret, now)).toBe(false);
  });
  it('rejects expired tokens and expiry exactly at now', async () => {
    expect(await validHubToken(await token(now - 1), secret, now)).toBe(false);
    expect(await validHubToken(await token(now), secret, now)).toBe(false);
  });
  it('rechecks expiry on each request for the same token', async () => {
    const signed = await token(now + 1);
    expect(await validHubToken(signed, secret, now)).toBe(true);
    expect(await validHubToken(signed, secret, now + 1)).toBe(false);
  });
  it('rejects missing secrets and malformed tokens', async () => {
    expect(await validHubToken(await token(now + 1), undefined, now)).toBe(false);
    for (const malformed of ['', '123.abc', `${now}.` + 'g'.repeat(64), `${now}.` + '0'.repeat(64) + '.extra']) {
      expect(await validHubToken(malformed, secret, now)).toBe(false);
    }
  });
});