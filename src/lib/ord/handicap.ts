import { hasWon, isFinished, type Round } from './engine';

export const HCP_WINDOW = 30;

export function wordScore(round: Round): number | null {
  if (!isFinished(round)) return null;
  return hasWon(round) ? round.guesses.indexOf(round.answer) + 1 - 4 : 3;
}

/** Derive from the saved ledger; no extra counter or save migration is needed. */
export function handicap(rounds: Record<string, Round>, today: string) {
  const recent = Object.values(rounds)
    .filter(round => round.date <= today && isFinished(round))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.slot ?? 0) - (b.slot ?? 0))
    .slice(-HCP_WINDOW);
  return {
    count: recent.length,
    value: recent.length ? recent.reduce((sum, round) => sum + (wordScore(round) ?? 0), 0) / recent.length : null,
  };
}

export function golfName(score: number): string {
  return ['Albatross', 'Eagle', 'Birdie', 'Par', 'Bogey', 'Double bogey', 'Triple bogey'][score + 3] ?? '';
}