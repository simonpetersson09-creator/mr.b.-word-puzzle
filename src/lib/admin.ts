export interface AdminDay {
  day: string;
  played: number;
  ios: number;
  android: number;
  finished: number;
  wins: number;
  average: number | null;
}

export const ADMIN_START_DAY = '2026-11-19';
export function adminVisibleDays(days: AdminDay[]) {
  return days.filter(day => day.day >= ADMIN_START_DAY).sort((a, b) => b.day.localeCompare(a.day));
}

export function adminRollingAverage(days: AdminDay[], day: string, key: 'played' | 'ios' | 'android' | 'finished' | 'wins') {
  const start = new Date(`${day}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 29);
  const earliest = start.toISOString().slice(0, 10);
  const rows = adminVisibleDays(days).filter(row => row.day >= earliest && row.day <= day);
  return rows.length ? rows.reduce((sum, row) => sum + row[key], 0) / rows.length : null;
}

// Fixed-size digests avoid leaking the credential through early comparisons.
export async function validAdminKey(provided: string, expected: string | undefined) {
  if (!expected || !provided || provided.length > 1024) return false;
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const left = new Uint8Array(a), right = new Uint8Array(b);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= (left[i] ?? 0) ^ (right[i] ?? 0);
  return difference === 0;
}

export function adminWinPercent(day: Pick<AdminDay, 'finished' | 'wins'>) {
  return day.finished ? Math.round(day.wins / day.finished * 100) : null;
}