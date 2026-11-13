import { Capacitor } from '@capacitor/core';
import { evaluate, hasWon, type Round } from '@/lib/ord/engine';

export function resultText(round: Round): string {
  return `Mr.B. Word Puzzle · ${round.date} · ${(round.slot ?? 0) + 1}/3\n${hasWon(round) ? round.guesses.length : 'X'}/6\n\n` + round.guesses.map(g => evaluate(g, round.answer).map(m => ({correct:'🟩',present:'🟨',absent:'⬜'})[m]).join('')).join('\n');
}
export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';
export interface ShareAdapter {
  share?: (text: string) => Promise<void>;
  copy: (text: string) => Promise<void>;
}
export async function deliverResult(text: string, adapter: ShareAdapter): Promise<ShareOutcome> {
  if (adapter.share) {
    try { await adapter.share(text); return 'shared'; }
    catch (error) {
      const e = error as {name?:string;message?:string};
      if (e?.name === 'AbortError' || /cancel|dismiss/i.test(e?.message ?? '')) return 'cancelled';
    }
  }
  try { await adapter.copy(text); return 'copied'; } catch { return 'failed'; }
}
export async function shareResult(round: Round): Promise<ShareOutcome> {
  try {
    if (Capacitor.isNativePlatform()) {
      const { Share } = await import('@capacitor/share');
      const { Clipboard } = await import('@capacitor/clipboard');
      const {value} = await Share.canShare().catch(() => ({value:false}));
      return deliverResult(resultText(round), {
        share: value ? async text => { await Share.share({title:'Mr.B. Word Puzzle',text}); } : undefined,
        copy: async text => { await Clipboard.write({string:text}); },
      });
    }
    return deliverResult(resultText(round), {
      share: typeof navigator.share === 'function' ? async text => {await navigator.share({title:'Mr.B. Word Puzzle',text});} : undefined,
      copy: text => navigator.clipboard.writeText(text),
    });
  } catch { return 'failed'; }
}