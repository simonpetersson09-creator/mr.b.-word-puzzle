import type { CSSProperties } from 'react';
import type { Mark } from '@/lib/ord/engine';
import { FLIP_DURATION, FLIP_STAGGER } from '@/hooks/use-guess-reveal';

export function GuessTile({ letter, mark, active, revealing, column, label }: {
  letter: string | undefined; mark: Mark | undefined; active: boolean; revealing: boolean; column: number; label: string;
}) {
  return <div role="gridcell" aria-label={label} className={`tile ${active ? 'active' : ''} ${active && letter ? 'filled' : ''} ${revealing ? 'tile-flipping' : mark ?? ''}`}
    style={revealing ? {'--flip-delay':`${column * FLIP_STAGGER}ms`, '--flip-duration':`${FLIP_DURATION}ms`} as CSSProperties : undefined}>
    {revealing ? <span className="tile-rotor" aria-hidden="true"><span className="tile-face tile-front">{letter}</span><span className={`tile-face tile-back ${mark ?? ''}`}>{letter}</span></span> : letter}
  </div>;
}