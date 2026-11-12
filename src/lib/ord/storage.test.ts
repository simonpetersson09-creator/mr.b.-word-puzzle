import { beforeEach, describe, expect, it, vi } from 'vitest';
const native = vi.hoisted(() => ({ values: new Map<string, string>(), set: vi.fn(), enabled: true, readFailures: new Set<string>(), writeFailures: new Set<string>() }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => native.enabled } }));
vi.mock('@capacitor/preferences', () => ({ Preferences: {
  get: async ({ key }: { key: string }) => { if (native.readFailures.has(key)) throw new Error('read failed'); return { value: native.values.get(key) ?? null }; },
  set: async ({ key, value }: { key: string; value: string }) => { native.set(key, value); if (native.writeFailures.has(key)) throw new Error('write failed'); native.values.set(key, value); },
} }));
import { emptySave, newRound, submitGuess, statistics } from './engine';
import { initializeSave, persistSave, flushNativeSave, mergeRound, onSaveError, SAVE_KEY, BACKUP_KEY } from './storage';
describe('iPhone result durability', () => {
  beforeEach(async () => { await flushNativeSave().catch(() => {}); localStorage.clear(); native.values.clear(); native.set.mockClear(); native.readFailures.clear(); native.writeFailures.clear(); });
  it('restores the native backup and settings when the primary read throws', async () => {
    const save = mergeRound(emptySave(), submitGuess(newRound('2026-11-12'), 'KANEL').round);
    save.settings.haptics = false;
    native.values.set(BACKUP_KEY, JSON.stringify(save)); native.readFailures.add(SAVE_KEY);
    const restored = await initializeSave();
    expect(restored).toEqual(save);
    expect(statistics(restored.rounds, '2026-11-12')).toMatchObject({played:1,wins:1,current:1});
  });
  it('reports native write failure immediately and still writes the backup', async () => {
    native.writeFailures.add(SAVE_KEY);
    const listener = vi.fn(), unsubscribe = onSaveError(listener);
    const save = mergeRound(emptySave(), submitGuess(newRound('2026-11-12'), 'KANEL').round);
    persistSave(save);
    await expect(flushNativeSave()).rejects.toThrow('write failed');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(JSON.parse(native.values.get(BACKUP_KEY) ?? '{}')).toEqual(save);
    unsubscribe();
    native.writeFailures.clear(); persistSave(save); await flushNativeSave();
    expect(JSON.parse(native.values.get(SAVE_KEY) ?? '{}')).toEqual(save);
  });
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