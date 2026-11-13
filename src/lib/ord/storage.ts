import { Capacitor } from '@capacitor/core';
import { emptySave, hasWon, isFinished, roundKey, DAILY_WORDS, type Save, type Round } from './engine';
import { languages, type Language } from '@/lib/i18n/languages';
import { letters } from './words/localized';
// Adapted from Ludo: SSR-safe local storage, separate namespace, guarded reads.
export const SAVE_KEY = 'mrb-ord:v1:save';
export const BACKUP_KEY = `${SAVE_KEY}:backup`;
export const RECOVERY_KEY = `${SAVE_KEY}:recovery`;
let nativeWrites = Promise.resolve();
let recoveryBlocked = false;
const errorListeners = new Set<() => void>();
export function onSaveError(listener: () => void) { errorListeners.add(listener); return () => { errorListeners.delete(listener); }; }
function reportError() { errorListeners.forEach(listener => listener()); }
function readLocal(key: string): string | null {
  try { return localStorage.getItem(key); } catch { reportError(); return null; }
}
function decode(text: string | null): Save | null {
  try {
    const raw: unknown = JSON.parse(text ?? 'null');
    if (!raw || typeof raw !== 'object') return null;
    const value = raw as Partial<Save>;
    if (value.version !== 1 || !value.rounds || typeof value.rounds !== 'object') return null;
    const rounds: Record<string, Round> = {};
    for (const [key, r] of Object.entries(value.rounds)) {
      const date=r?.date, slot=r?.slot ?? 0;
      // Historical valid rounds must survive future dictionary revisions.
      const validWord = (word: unknown) => typeof word === 'string' && letters(word).length === 5 && /^[\p{L}\p{M}]+$/u.test(word);
      if (!r || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(slot) || slot<0 || slot>=DAILY_WORDS || key!==roundKey(date,slot) || !validWord(r.answer) || !Array.isArray(r.guesses) || r.guesses.length > 6 || !r.guesses.every(validWord)) continue;
      if (r.language !== undefined && !(r.language in languages)) continue;
      const win = r.guesses.indexOf(r.answer);
      if (win >= 0 && win !== r.guesses.length - 1) continue;
      rounds[key] = { date, answer: r.answer, guesses: [...r.guesses], ...(r.language ? {language:r.language} : {}), ...(slot ? {slot} : {}) };
    }
    const settingLanguage = (v: unknown): Language | 'auto' | undefined => v === 'auto' ? v : typeof v === 'string' && v in languages ? v as Language : undefined;
    const language = settingLanguage(value.settings?.language), gameLanguage = settingLanguage(value.settings?.gameLanguage);
    return { version: 1, rounds, settings: { sound: value.settings?.sound !== false, haptics: value.settings?.haptics !== false, ...(language ? {language} : {}), ...(gameLanguage ? {gameLanguage} : {}) } };
  } catch { return null; }
}
const samePuzzle = (a: Round, b: Round) => a.answer === b.answer && (a.language ?? 'sv') === (b.language ?? 'sv');
const extendsHistory = (earlier: Round, later: Round) => samePuzzle(earlier,later) && earlier.guesses.every((guess,index)=>later.guesses[index] === guess);
function recoverRound(primary: Round, backup: Round): Round {
  // A witnessed win is never downgraded by a conflicting completed mirror.
  if (hasWon(primary) !== hasWon(backup)) { reportError(); return hasWon(primary) ? primary : backup; }
  if (extendsHistory(backup,primary)) return primary;
  if (extendsHistory(primary,backup)) return backup;
  // Divergent histories cannot be concatenated. Preserve a finished ledger entry,
  // then use a stable tie-break so mirror order cannot change statistics.
  reportError();
  if (isFinished(primary) !== isFinished(backup)) return isFinished(primary) ? primary : backup;
  if (primary.guesses.length !== backup.guesses.length) return primary.guesses.length > backup.guesses.length ? primary : backup;
  const identity = (r: Round) => JSON.stringify([r.answer,r.language ?? 'sv',r.guesses]);
  return identity(primary) <= identity(backup) ? primary : backup;
}
function combine(primary: Save | null, backup: Save | null): Save {
  let result = backup ?? emptySave();
  if (!primary) return result;
  // Recovery is not gameplay: valid later slots must survive a damaged earlier slot.
  const rounds = {...result.rounds};
  for (const [key,round] of Object.entries(primary.rounds)) {
    const existing=rounds[key];
    rounds[key] = existing ? recoverRound(round,existing) : round;
  }
  result={...result,rounds};
  return { ...result, settings: primary.settings };
}
export function loadSave(): Save {
  return combine(combine(decode(readLocal(SAVE_KEY)), decode(readLocal(BACKUP_KEY))),decode(readLocal(RECOVERY_KEY)));
}
export async function initializeSave(): Promise<Save> {
  recoveryBlocked=false;
  const local = loadSave();
  if (!Capacitor.isNativePlatform()) return local;
  let recovered = local;
  try {
    const { Preferences } = await import('@capacitor/preferences');
    let failed=false;
    const read = async (key: string) => {
      try { return (await Preferences.get({ key })).value; } catch { failed=true; reportError(); return null; }
    };
    const [primary, backup, recovery] = await Promise.all([read(SAVE_KEY), read(BACKUP_KEY),read(RECOVERY_KEY)]);
    const primarySave=decode(primary),backupSave=decode(backup),recoverySave=decode(recovery);
    const native = combine(combine(primarySave,backupSave),recoverySave);
    recovered = combine(local, native);
    // Native settings remain authoritative after WebView storage eviction.
    if (!readLocal(SAVE_KEY) && (primary || backup)) recovered.settings = native.settings;
    // Inconclusive reads must never replace unreadable or newer-version native data.
    const invalid=(primary!==null && !primarySave) || (backup!==null && !backupSave) || (recovery!==null && !recoverySave);
    if (failed || invalid) {recoveryBlocked=true;reportError();return recovered;}
    persistSave(recovered);
    await flushNativeSave();
    return recovered;
  } catch { recoveryBlocked=true;reportError(); return recovered; }
}
export const flushNativeSave = () => nativeWrites;
// One atomic snapshot: rounds themselves are the result ledger; no double-counted counters.
export function persistSave(save: Save): boolean {
  if (recoveryBlocked) {reportError();return false;}
  // Keep an older valid generation and union the ledger before replacing either mirror.
  const primary=readLocal(SAVE_KEY),backup=readLocal(BACKUP_KEY);
  // Preserve unknown local schemas before any write, including in the browser.
  if ((primary!==null && !decode(primary)) || (backup!==null && !decode(backup))) {
    try {
      if (primary!==null && !decode(primary)) localStorage.setItem(`${SAVE_KEY}:quarantine`,primary);
      if (backup!==null && !decode(backup)) localStorage.setItem(`${BACKUP_KEY}:quarantine`,backup);
    } catch {reportError();return false;}
  }
  const previous=combine(decode(primary),decode(backup));
  const retained=combine(save,previous);
  save={...retained,settings:save.settings};
  const snapshot = JSON.stringify(save);
  let saved = false;
  if (Object.keys(previous.rounds).length) {try {localStorage.setItem(RECOVERY_KEY,JSON.stringify(previous));} catch {reportError();}}
  try { localStorage.setItem(SAVE_KEY, snapshot); saved = true; } catch { reportError(); }
  try { localStorage.setItem(BACKUP_KEY, snapshot); saved = true; } catch { reportError(); }
  if (Capacitor.isNativePlatform()) {
    nativeWrites = nativeWrites.catch(() => {}).then(async () => {
      const { Preferences } = await import('@capacitor/preferences');
      // Preserve the prior generation separately; never rotate from an unreadable store.
      try {
        const old=await Preferences.get({key:SAVE_KEY});
        if (old.value && decode(old.value)) await Preferences.set({key:RECOVERY_KEY,value:old.value});
      } catch {reportError();}
      // Attempt both copies even if one fails; keep failures observable to flush callers.
      const writes = await Promise.allSettled([Preferences.set({ key: SAVE_KEY, value: snapshot }), Preferences.set({ key: BACKUP_KEY, value: snapshot })]);
      const failure = writes.find(result => result.status === 'rejected');
      if (failure?.status === 'rejected') throw failure.reason;
    });
    // Keep the rejection observable via flushNativeSave without an unhandled error.
    void nativeWrites.catch(reportError);
  }
  return saved;
}
export function mergeRound(save: Save, round: Round): Save {
  const slot=round.slot ?? 0;
  if (!Number.isInteger(slot) || slot<0 || slot>=DAILY_WORDS) return save;
  // Additional words unlock in order, not by changing the language or key.
  for(let prior=0;prior<slot;prior++) { const r=save.rounds[roundKey(round.date,prior)]; if (!r || !isFinished(r)) return save; }
  const key=roundKey(round.date,slot), existing = save.rounds[key];
  if (existing && (isFinished(existing) || !extendsHistory(existing,round))) return save;
  return { ...save, rounds: { ...save.rounds, [key]: round } };
}