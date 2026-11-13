import { beforeEach, describe, expect, it, vi } from 'vitest';
const native = vi.hoisted(() => ({ values: new Map<string, string>(), set: vi.fn(), enabled: true, readFailures: new Set<string>(), writeFailures: new Set<string>() }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => native.enabled } }));
vi.mock('@capacitor/preferences', () => ({ Preferences: {
  get: async ({ key }: { key: string }) => { if (native.readFailures.has(key)) throw new Error('read failed'); return { value: native.values.get(key) ?? null }; },
  set: async ({ key, value }: { key: string; value: string }) => { native.set(key, value); if (native.writeFailures.has(key)) throw new Error('write failed'); native.values.set(key, value); },
} }));
import { emptySave, newRound, submitGuess, statistics } from './engine';
import { initializeSave, loadSave, persistSave, flushNativeSave, retrySave, mergeRound, onSaveError, SAVE_KEY, BACKUP_KEY, RECOVERY_KEY } from './storage';
describe('iPhone result durability', () => {
  it('retains guesses in memory when both local writes fail and retries them later',async()=>{
    native.enabled=false;
    const save=mergeRound(emptySave(),{date:'2026-11-13',answer:'KANEL',guesses:['KANEL']});
    const spy=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('full');});
    expect(persistSave(save)).toBe(false);
    expect(loadSave().rounds['2026-11-13']?.guesses).toEqual(['KANEL']);
    spy.mockRestore();
    await retrySave(save);
    expect(JSON.parse(localStorage.getItem(SAVE_KEY) ?? '{}').rounds['2026-11-13'].answer).toBe('KANEL');
    native.enabled=true;
  });
  it('retries a temporary native read failure without replacing guesses entered meanwhile',async()=>{
    native.readFailures.add(SAVE_KEY); await initializeSave();
    const save=mergeRound(emptySave(),{date:'2026-11-13',answer:'KANEL',guesses:['KANEL']});
    expect(persistSave(save)).toBe(false);
    native.readFailures.clear();await retrySave(save);
    expect(JSON.parse(native.values.get(SAVE_KEY) ?? '{}').rounds['2026-11-13'].guesses).toEqual(['KANEL']);
  });
  it('keeps a witnessed win over a conflicting completed loss in every mirror order',()=>{
    const won=emptySave(),lost=emptySave();
    won.rounds['2026-11-12']={date:'2026-11-12',answer:'KANEL',guesses:['KANEL']};
    lost.rounds['2026-11-12']={date:'2026-11-12',answer:'KANEL',guesses:Array(6).fill('TIGER')};
    for(const [a,b] of [[won,lost],[lost,won]]) {
      localStorage.setItem(SAVE_KEY,JSON.stringify(a));localStorage.setItem(BACKUP_KEY,JSON.stringify(b));
      localStorage.setItem(RECOVERY_KEY,JSON.stringify(lost));
      expect(statistics(loadSave().rounds,'2026-11-12')).toMatchObject({played:1,wins:1,current:1});
    }
  });
  it('rejects rewritten attempts rather than replacing an existing guess with a first-guess win',()=>{
    const save=emptySave();save.rounds['2026-11-12']={date:'2026-11-12',answer:'TIGER',guesses:['KANEL']};
    expect(mergeRound(save,{date:'2026-11-12',answer:'TIGER',guesses:['TIGER']})).toBe(save);
  });
  it('locks the saved language even when both languages assign the same answer',()=>{
    const save=emptySave();save.rounds['2026-11-12']={date:'2026-11-12',answer:'TIGER',guesses:['KANEL']};
    expect(mergeRound(save,{date:'2026-11-12',answer:'TIGER',language:'en',guesses:['KANEL','TIGER']})).toBe(save);
  });
  beforeEach(async () => { await flushNativeSave().catch(() => {}); localStorage.clear(); native.values.clear(); native.readFailures.clear(); native.writeFailures.clear(); await initializeSave();localStorage.clear();native.values.clear();native.set.mockClear(); });
  it('never replaces native history when all reads fail and later writes would succeed',async()=>{
    const save=mergeRound(emptySave(),submitGuess(newRound('2026-11-12'),'KANEL').round);
    for(const key of [SAVE_KEY,BACKUP_KEY,RECOVERY_KEY]) {native.values.set(key,JSON.stringify(save));native.readFailures.add(key);}
    await initializeSave();expect(persistSave(emptySave())).toBe(false);await flushNativeSave();
    expect(native.set).not.toHaveBeenCalled();expect(JSON.parse(native.values.get(SAVE_KEY) ?? '{}')).toEqual(save);
  });
  it('preserves an unsupported native schema instead of overwriting it with defaults',async()=>{
    const raw=JSON.stringify({version:2,rounds:{important:'future migration'}});native.values.set(SAVE_KEY,raw);
    await initializeSave();expect(persistSave(emptySave())).toBe(false);expect(native.values.get(SAVE_KEY)).toBe(raw);expect(native.set).not.toHaveBeenCalled();
  });
  it('recovers valid later slots without applying gameplay unlock checks',()=>{
    const save=emptySave();save.rounds['2026-11-12:3']={date:'2026-11-12',slot:2,answer:'KANEL',guesses:['KANEL']};
    localStorage.setItem(SAVE_KEY,JSON.stringify(save));expect(statistics(loadSave().rounds,'2026-11-12').wins).toBe(1);
  });
  it('retains unsupported local payloads in quarantine before writing a recovered save',()=>{
    native.enabled=false;
    const raw=JSON.stringify({version:2,rounds:{important:'future schema'}});localStorage.setItem(SAVE_KEY,raw);
    persistSave(emptySave());expect(localStorage.getItem(`${SAVE_KEY}:quarantine`)).toBe(raw);
    native.enabled=true;
  });
  it('retains prior completed results when a stale empty snapshot is saved',async()=>{
    const save=mergeRound(emptySave(),submitGuess(newRound('2026-11-12'),'KANEL').round);persistSave(save);await flushNativeSave();persistSave(emptySave());await flushNativeSave();
    expect(statistics(loadSave().rounds,'2026-11-12')).toMatchObject({played:1,wins:1});expect(native.values.has(RECOVERY_KEY)).toBe(true);
  });
  it('reads local backup even if the primary storage read throws', () => {
    const save = mergeRound(emptySave(), submitGuess(newRound('2026-11-12'), 'KANEL').round);
    localStorage.setItem(BACKUP_KEY, JSON.stringify(save));
    const original = Storage.prototype.getItem;
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function(this: Storage, key: string) {
      if (key === SAVE_KEY) throw new Error('read failed');
      return original.call(this, key);
    });
    expect(loadSave()).toEqual(save);
    spy.mockRestore();
  });
  it('keeps a recovered win in memory when rewriting both native copies fails', async () => {
    const save = mergeRound(emptySave(), submitGuess(newRound('2026-11-12'), 'KANEL').round);
    native.values.set(BACKUP_KEY, JSON.stringify(save));
    native.writeFailures.add(SAVE_KEY); native.writeFailures.add(BACKUP_KEY);
    expect(await initializeSave()).toEqual(save);
  });
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
    expect(native.set).toHaveBeenCalledTimes(5);
  });
});