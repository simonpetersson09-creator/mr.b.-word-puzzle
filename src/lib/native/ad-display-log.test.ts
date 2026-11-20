import { describe, expect, it, vi } from 'vitest';
import { createAdDisplayLog, type AdDisplay } from './ad-display-log';

const event: AdDisplay = { roundId: '2026-11-20', platform: 'ios', isTest: false, displayedAt: '2026-11-20T20:00:00.000Z' };
const clock = () => Date.parse('2026-11-20T21:00:00Z');
describe('confirmed native ad display queue', () => {
  it('retains an offline display, recovers after restart and acknowledges it once', async () => {
    let saved: AdDisplay[] = [];
    const storage = { read: async () => saved, write: async (value: AdDisplay[]) => { saved = [...value]; } };
    const offline = createAdDisplayLog(storage, async () => { throw new Error('offline'); }, clock);
    await offline.record(event); await offline.flush(); expect(saved).toEqual([event]);
    const send = vi.fn(async (_event: AdDisplay) => {});
    const restarted = createAdDisplayLog(storage, send, clock);
    await restarted.flush(); await restarted.flush(); expect(send).toHaveBeenCalledExactlyOnceWith(event); expect(saved).toEqual([]);
  });
  it('ignores duplicated Showed callbacks for the same round', async () => {
    const send = vi.fn(async (_event: AdDisplay) => {});
    const log = createAdDisplayLog({ read: async () => [], write: async () => {} }, send, clock);
    await Promise.all([log.record(event), log.record(event)]); await log.flush();
    await log.record(event); await log.flush(); expect(send).toHaveBeenCalledTimes(1);
  });
  it('rejects browser events and preserves test versus production modes', async () => {
    const send = vi.fn(async (_event: AdDisplay) => {});
    const log = createAdDisplayLog({ read: async () => [], write: async () => {} }, send, clock);
    await log.record({ ...event, platform: 'web' } as unknown as AdDisplay);
    await log.record(event); await log.record({ ...event, roundId: '2026-11-20:2', platform: 'android', isTest: true });
    await log.flush(); expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls.map(call => call[0])).toEqual([event, { ...event, roundId: '2026-11-20:2', platform: 'android', isTest: true }]);
  });
  it('never overwrites the native queue after a failed recovery read', async () => {
    const write = vi.fn(async () => {}), send = vi.fn(async () => {});
    const log = createAdDisplayLog({ read: async () => { throw new Error('native read'); }, write }, send, clock);
    await log.record(event); await log.flush(); expect(write).not.toHaveBeenCalled(); expect(send).not.toHaveBeenCalled();
  });
});