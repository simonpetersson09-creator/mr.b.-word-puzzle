import { beforeEach, describe, expect, it, vi } from 'vitest';
const native = vi.hoisted(() => ({ values: new Map<string, string>(), set: vi.fn(), enabled: true }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => native.enabled } }));
vi.mock('@capacitor/preferences', () => ({ Preferences: {
  get: async ({ key }: { key: string }) => ({ value: native.values.get(key) ?? null }),
  set: async ({ key, value }: { key: string; value: string }) => { native.set(key, value); native.values.set(key, value); },
} }));
import { emptySave, newRound, submitGuess, statistics } from './engine';
import { initializeSave, persistSave, flushNativeSave, mergeRound, SAVE_KEY, BACKUP_KEY } from './storage';
describe('iPhone result durability', () => {
  beforeEach(async () => { await flushNativeSave(); localStorage.clear(); native.values.clear(); native.set.mockClear(); });
  it('restores wins, settings and streak from native storage after WebView eviction', async () => {
    const save = mergeRound(emptySave(), submitGuess(newRound('2026-11-12'),'KANEL').round);
    save.settings.haptics = false;
    persistSave(save); await flushNativeSave(); localStorage.clear();
    const restored = await initializeSave();
    expect(restored).toEqual(save);
    expect(statistics(restored.rounds,'2026-11-12')).toMatchObject({played:1,current:1,longest:1});
    expect(native.values.get(SAVE_KEY)).toBe(native.values.get(BACKUP_KEY));
  });
  it('serializes consecutive native writes so older guesses cannot overwrite the final win', async () => {
    const first = mergeRound(emptySave(),submitGuess(newRound('2026-11-12'),'TIGER').round);
    const active = first.rounds['2026-11-12'];
    if (!active) throw new Error('Missing round');
    const won = mergeRound(first,submitGuess(active,'KANEL').round);
    persistSave(first); persistSave(won); await flushNativeSave();
    const saved = JSON.parse(native.values.get(SAVE_KEY) ?? '{}');
    expect(saved.rounds['2026-11-12'].guesses).toEqual(['TIGER','KANEL']);
    expect(native.set).toHaveBeenCalledTimes(4);
  });
});