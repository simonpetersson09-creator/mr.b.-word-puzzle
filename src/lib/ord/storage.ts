import { Capacitor } from '@capacitor/core';
import { emptySave, isFinished, type Save, type Round } from './engine';
// Adapted from Ludo: SSR-safe local storage, separate namespace, guarded reads.
export const SAVE_KEY = 'mrb-ord:v1:save';
export const BACKUP_KEY = `${SAVE_KEY}:backup`;
let nativeWrites = Promise.resolve();
function decode(text: string | null): Save | null {
  try {
    const raw: unknown = JSON.parse(text ?? 'null');
    if (!raw || typeof raw !== 'object') return null;
    const value = raw as Partial<Save>;
    if (value.version !== 1 || !value.rounds || typeof value.rounds !== 'object') return null;
    const rounds: Record<string, Round> = {};
    for (const [date, r] of Object.entries(value.rounds)) {
      // Historical valid rounds must survive future dictionary revisions.
      if (!r || !/^\d{4}-\d{2}-\d{2}$/.test(date) || r.date !== date || typeof r.answer !== 'string' || !/^[A-ZÅÄÖ]{5}$/.test(r.answer) || !Array.isArray(r.guesses) || r.guesses.length > 6 || !r.guesses.every(g => typeof g === 'string' && /^[A-ZÅÄÖ]{5}$/.test(g))) continue;
      const win = r.guesses.indexOf(r.answer);
      if (win >= 0 && win !== r.guesses.length - 1) continue;
      rounds[date] = { date, answer: r.answer, guesses: [...r.guesses] };
    }
    return { version: 1, rounds, settings: { sound: value.settings?.sound !== false, haptics: value.settings?.haptics !== false } };
  } catch { return null; }
}
function combine(primary: Save | null, backup: Save | null): Save {
  let result = backup ?? emptySave();
  if (!primary) return result;
  for (const round of Object.values(primary.rounds)) result = mergeRound(result, round);
  return { ...result, settings: primary.settings };
}
export function loadSave(): Save {
  try {
    return combine(decode(localStorage.getItem(SAVE_KEY)), decode(localStorage.getItem(BACKUP_KEY)));
  } catch { return emptySave(); }
}
export async function initializeSave(): Promise<Save> {
  const local = loadSave();
  if (!Capacitor.isNativePlatform()) return local;
  try {
    const { Preferences } = await import('@capacitor/preferences');
    const primary = await Preferences.get({ key: SAVE_KEY });
    const backup = await Preferences.get({ key: BACKUP_KEY });
    const native = combine(decode(primary.value), decode(backup.value));
    const recovered = combine(local, native);
    // Native settings remain authoritative after WebView storage eviction.
    if (!localStorage.getItem(SAVE_KEY) && (primary.value || backup.value)) recovered.settings = native.settings;
    persistSave(recovered);
    await flushNativeSave();
    return recovered;
  } catch { return local; }
}
export const flushNativeSave = () => nativeWrites;
// One atomic snapshot: rounds themselves are the result ledger; no double-counted counters.
export function persistSave(save: Save): boolean {
  const snapshot = JSON.stringify(save);
  let saved = false;
  try { localStorage.setItem(SAVE_KEY, snapshot); saved = true; } catch { /* Report failure to the player. */ }
  try { localStorage.setItem(BACKUP_KEY, snapshot); } catch { /* Primary remains usable. */ }
  if (Capacitor.isNativePlatform()) {
    nativeWrites = nativeWrites.catch(() => {}).then(async () => {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({ key: SAVE_KEY, value: snapshot });
      await Preferences.set({ key: BACKUP_KEY, value: snapshot });
    });
    // Keep the rejection observable via flushNativeSave without an unhandled error.
    void nativeWrites.catch(() => {});
  }
  return saved;
}
export function mergeRound(save: Save, round: Round): Save {
  const existing = save.rounds[round.date];
  if (existing && (isFinished(existing) || existing.answer !== round.answer || existing.guesses.length > round.guesses.length)) return save;
  return { ...save, rounds: { ...save.rounds, [round.date]: round } };
}