import { Capacitor } from '@capacitor/core';
import type { MonthlyBoard } from './monthly';

const KEY = 'mrb-word-puzzle:monthly-board-v1';
let memory: MonthlyBoard | null = null;
function decode(raw: string | null): MonthlyBoard | null {
  try {
    const value = JSON.parse(raw ?? 'null');
    return value && /^\d{4}-\d{2}$/.test(value.month) && Array.isArray(value.leaders) && typeof value.joined === 'boolean' ? value : null;
  } catch { return null; }
}
export function readMonthlyCache(month: string): MonthlyBoard | null {
  if (!memory) { try { memory = decode(localStorage.getItem(KEY)); } catch { /* native mirror remains */ } }
  return memory?.month === month ? memory : null;
}
export async function restoreMonthlyCache(month: string): Promise<MonthlyBoard | null> {
  const cached = readMonthlyCache(month);
  if (cached || !Capacitor.isNativePlatform()) return cached;
  try {
    const { Preferences } = await import('@capacitor/preferences');
    const restored = decode((await Preferences.get({key: KEY})).value);
    if (restored?.month === month && memory?.month !== month) memory = restored;
    return readMonthlyCache(month);
  } catch { return null; }
}
let writes = Promise.resolve();
export async function cacheMonthlyBoard(board: MonthlyBoard) {
  memory = board;
  const value = JSON.stringify(board);
  try { localStorage.setItem(KEY, value); } catch { /* native mirror may succeed */ }
  if (Capacitor.isNativePlatform()) {
    writes = writes.catch(() => {}).then(async () => {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({key: KEY, value});
    });
    await writes.catch(() => {});
  }
}