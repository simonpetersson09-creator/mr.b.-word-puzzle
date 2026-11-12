import dictionary from './words/guesses.json';
import { answers } from './words/answers';

export type Mark = 'correct' | 'present' | 'absent';
export interface Round { date: string; answer: string; guesses: string[] }
export interface Settings { sound: boolean; haptics: boolean }
export interface Save { version: 1; rounds: Record<string, Round>; settings: Settings }
export const dictionarySet = new Set<string>(dictionary);
export const emptySave = (): Save => ({ version: 1, rounds: {}, settings: { sound: true, haptics: true } });
export function stockholmDate(now = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export const dayNumber = (date: string) => Math.floor(Date.parse(date + 'T00:00:00Z') / 86400000);
export function dailyAnswer(date: string): string {
  const index = dayNumber(date) - dayNumber('2026-11-12');
  return answers[((index % answers.length) + answers.length) % answers.length];
}
export const newRound = (date: string): Round => ({ date, answer: dailyAnswer(date), guesses: [] });
export const hasWon = (round: Round) => round.guesses.includes(round.answer);
export const isFinished = (round: Round) => hasWon(round) || round.guesses.length === 6;
export function evaluate(guess: string, answer: string): Mark[] {
  const marks: Mark[] = Array(5).fill('absent');
  const remaining = answer.split('');
  for (let i = 0; i < 5; i++) if (guess[i] === answer[i]) { marks[i] = 'correct'; remaining[i] = ''; }
  for (let i = 0; i < 5; i++) {
    if (marks[i] === 'correct') continue;
    const at = remaining.indexOf(guess[i]);
    if (at >= 0) { marks[i] = 'present'; remaining[at] = ''; }
  }
  return marks;
}
export function keyboardMarks(round: Round): Record<string, Mark> {
  const result: Record<string, Mark> = {};
  const rank = { absent: 0, present: 1, correct: 2 };
  for (const guess of round.guesses) evaluate(guess, round.answer).forEach((mark, i) => {
    const prior = result[guess[i]];
    if (!prior || rank[mark] > rank[prior]) result[guess[i]] = mark;
  });
  return result;
}
export function submitGuess(round: Round, raw: string): { round: Round; error?: 'short' | 'unknown' | 'finished' } {
  if (isFinished(round)) return { round, error: 'finished' };
  const guess = raw.normalize('NFC').toLocaleUpperCase('sv-SE');
  if (!/^[A-ZÅÄÖ]{5}$/.test(guess)) return { round, error: 'short' };
  if (!dictionarySet.has(guess)) return { round, error: 'unknown' };
  return { round: { ...round, guesses: [...round.guesses, guess] } };
}
export function statistics(rounds: Record<string, Round>, today: string) {
  const completed = Object.values(rounds).filter(isFinished).sort((a,b) => a.date.localeCompare(b.date));
  const distribution = Array<number>(6).fill(0);
  let longest = 0, streak = 0, previous = '', wins = 0;
  for (const round of completed) {
    if (hasWon(round)) {
      wins++; distribution[round.guesses.length - 1]++;
      streak = previous && dayNumber(round.date) - dayNumber(previous) === 1 ? streak + 1 : 1;
      longest = Math.max(longest, streak);
    } else streak = 0;
    previous = round.date;
  }
  const last = completed.at(-1);
  const current = last && dayNumber(today) - dayNumber(last.date) <= 1 ? streak : 0;
  return { played: completed.length, wins, percentage: completed.length ? Math.round(wins / completed.length * 100) : 0, current, longest, distribution };
}