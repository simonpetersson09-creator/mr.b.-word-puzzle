import { emptySave, dictionarySet, isFinished, type Save, type Round } from './engine';
// Adapted from Ludo: SSR-safe local storage, separate namespace, guarded reads.
export const SAVE_KEY = 'mrb-ord:v1:save';
export function loadSave(): Save {
  const fallback = emptySave();
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null');
    if (!raw || typeof raw !== 'object') return fallback;
    const value = raw as Partial<Save>;
    if (value.version !== 1) return fallback;
    const rounds: Record<string, Round> = {};
    for (const [date, r] of Object.entries(value.rounds ?? {})) {
      if (!r || !/^\d{4}-\d{2}-\d{2}$/.test(date) || r.date !== date || !dictionarySet.has(r.answer) || !Array.isArray(r.guesses) || r.guesses.length > 6 || !r.guesses.every(g => typeof g === 'string' && dictionarySet.has(g))) continue;
      const win = r.guesses.indexOf(r.answer);
      if (win >= 0 && win !== r.guesses.length - 1) continue;
      rounds[date] = { date, answer: r.answer, guesses: r.guesses };
    }
    return { version: 1, rounds, settings: { sound: value.settings?.sound !== false, haptics: value.settings?.haptics !== false } };
  } catch { return fallback; }
}
// One atomic snapshot: rounds themselves are the result ledger; no double-counted counters.
export function persistSave(save: Save): boolean {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); return true; } catch { return false; }
}
export function mergeRound(save: Save, round: Round): Save {
  const existing = save.rounds[round.date];
  if (existing && (isFinished(existing) || existing.guesses.length > round.guesses.length)) return save;
  return { ...save, rounds: { ...save.rounds, [round.date]: round } };
}