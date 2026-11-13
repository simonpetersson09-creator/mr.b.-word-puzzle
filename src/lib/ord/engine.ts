import dictionary from './words/guesses.json';
import { answers } from './words/answers';
import inflections from './words/inflections.json';
import { acceptsWord, letters, localizedAnswer, uppercase, wordPacks } from './words/localized';
import type { Language } from '@/lib/i18n/languages';
import { answerPool } from './words/answer-policy';

export type Mark = 'correct' | 'present' | 'absent';
export interface Round { date: string; answer: string; guesses: string[]; language?: Language; slot?: number }
export interface Settings { sound: boolean; haptics: boolean; language?: Language | 'auto'; gameLanguage?: Language | 'auto' }
export interface Save { version: 1; rounds: Record<string, Round>; settings: Settings }
export const dictionarySet = new Set<string>([...dictionary,...inflections]);
export const emptySave = (): Save => ({ version: 1, rounds: {}, settings: { sound: true, haptics: true } });
export function stockholmDate(now = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
// Use wall-clock parts, not elapsed-hour subtraction (DST changes are not 24-hour days).
export function gameDate(now = new Date(), timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone): string {
  const parts = new Intl.DateTimeFormat('sv-SE', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value ?? '';
  const date = `${part('year')}-${part('month')}-${part('day')}`;
  return Number(part('hour')) < 3 ? new Date((dayNumber(date) - 1) * 86400000).toISOString().slice(0, 10) : date;
}
export const dayNumber = (date: string) => Math.floor(Date.parse(date + 'T00:00:00Z') / 86400000);
export function dailyAnswer(date: string): string {
  const index = dayNumber(date) - dayNumber('2026-11-12');
  // The original dated schedule stays immutable. Subsequent cycles use a frozen
  // seeded shuffle: random order without changing the answer on restart/offline.
  if (date <= '2026-11-12') return answers[((index % answers.length) + answers.length) % answers.length] ?? answers[0];
  const randomIndex = dayNumber(date) - dayNumber('2026-11-13');
  const cycle = Math.floor(randomIndex / answers.length) + 1;
  const pool: string[] = [...answers];
  let seed = (cycle ^ 0x6d72624f) >>> 0;
  for (let i = pool.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1), a = pool[i], b = pool[j];
    if (a && b) { pool[i] = b; pool[j] = a; }
  }
  return pool[randomIndex % answers.length] ?? answers[0];
}
export const DAILY_WORDS = 3;
export const roundKey = (date: string, slot = 0) => slot === 0 ? date : `${date}:${slot + 1}`;
export function newRound(date: string, language: Language = 'sv', slot = 0, excluded: string[] = []): Round {
  const first = language === 'sv' ? dailyAnswer(date) : localizedAnswer(date,language) ?? '';
  const pool: readonly string[] = language === 'sv' ? answers : answerPool(date,language,wordPacks[language]?.answers ?? []);
  const start = Math.max(0,pool.indexOf(first));
  const selected = [first];
  for (let offset=1; selected.length<=slot && offset<=pool.length; offset++) {
    const candidate=pool[(start+offset)%pool.length];
    if (candidate && !selected.includes(candidate) && !excluded.includes(candidate)) selected.push(candidate);
  }
  return {date,answer:selected[slot] ?? '',guesses:[],...(language !== 'sv' ? {language} : {}),...(slot ? {slot} : {})};
}
export function activeSlot(save: Save, date: string): number {
  for(let slot=0;slot<DAILY_WORDS;slot++) {
    const round=save.rounds[roundKey(date,slot)];
    if (!round || !isFinished(round)) return slot;
  }
  return DAILY_WORDS-1;
}
export const hasWon = (round: Round) => round.guesses.includes(round.answer);
export const isFinished = (round: Round) => hasWon(round) || round.guesses.length === 6;
export function welcomeState(save: Save, round: Round): 'complete' | 'next' | 'resume' | 'new' {
  const rounds = Object.values(save.rounds).filter(r => r.date === round.date);
  if (rounds.filter(isFinished).length === DAILY_WORDS) return 'complete';
  if (isFinished(round)) return 'next';
  return round.guesses.length ? 'resume' : 'new';
}
export function evaluate(guess: string, answer: string): Mark[] {
  const marks: Mark[] = Array(5).fill('absent');
  const guessLetters = letters(guess), answerLetters = letters(answer);
  const remaining = [...answerLetters];
  for (let i = 0; i < 5; i++) if (guessLetters[i] === answerLetters[i]) { marks[i] = 'correct'; remaining[i] = ''; }
  for (let i = 0; i < 5; i++) {
    if (marks[i] === 'correct') continue;
    const letter = guessLetters[i];
    if (!letter) continue;
    const at = remaining.indexOf(letter);
    if (at >= 0) { marks[i] = 'present'; remaining[at] = ''; }
  }
  return marks;
}
export function keyboardMarks(round: Round): Record<string, Mark> {
  const result: Record<string, Mark> = {};
  const rank = { absent: 0, present: 1, correct: 2 };
  for (const guess of round.guesses) evaluate(guess, round.answer).forEach((mark, i) => {
    const letter = letters(guess)[i];
    if (!letter) return;
    const prior = result[letter];
    if (!prior || rank[mark] > rank[prior]) result[letter] = mark;
  });
  return result;
}
export function submitGuess(round: Round, raw: string): { round: Round; error?: 'short' | 'unknown' | 'finished' } {
  if (isFinished(round)) return { round, error: 'finished' };
  const language = round.language ?? 'sv';
  const typed = uppercase(raw,language);
  // Retain the exact saved spelling when a Unicode-equivalent answer is entered.
  const guess = typed.normalize('NFC') === round.answer.normalize('NFC') ? round.answer : typed;
  if (letters(guess).length !== 5 || !/^[\p{L}\p{M}]+$/u.test(guess)) return { round, error: 'short' };
  if (guess !== round.answer && !(language === 'sv' ? dictionarySet.has(guess) : acceptsWord(guess,language))) return { round, error: 'unknown' };
  return { round: { ...round, guesses: [...round.guesses, guess] } };
}
export function statistics(rounds: Record<string, Round>, today: string) {
  const completed = Object.values(rounds).filter(r => r.date <= today && isFinished(r)).sort((a,b) => a.date.localeCompare(b.date));
  const distribution = Array<number>(6).fill(0);
  let longest = 0, streak = 0, previous = '', wins = 0;
  for (const round of completed) {
    if (hasWon(round)) {
      wins++; const bucket = round.guesses.length - 1; distribution[bucket] = (distribution[bucket] ?? 0) + 1;
    }
  }
  // Preserve the daily streak: one or more wins counts as one winning day.
  const dates=[...new Set(completed.map(round=>round.date))];
  for (const date of dates) {
    if (completed.some(round=>round.date===date && hasWon(round))) {
      streak = previous && dayNumber(date)-dayNumber(previous)===1 ? streak+1 : 1;
      longest=Math.max(longest,streak);
    } else streak=0;
    previous=date;
  }
  const last = completed.at(-1);
  const current = last && dayNumber(today) - dayNumber(last.date) <= 1 ? streak : 0;
  return { played: completed.length, wins, percentage: completed.length ? Math.round(wins / completed.length * 100) : 0, current, longest, distribution };
}