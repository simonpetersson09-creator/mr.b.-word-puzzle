import {describe,expect,it} from 'vitest';
import {playerDisplayName,cleanPlayerName,randomPlayerNumber} from './player-copy';
const base={sound:false,haptics:true};
describe('player name',()=>{
  it('defaults to a numbered player name like Yatzy',()=>{expect(playerDisplayName({...base,playerNumber:4821},'sv')).toBe('Spelare 4821');expect(playerDisplayName({...base,playerNumber:4821},'en')).toBe('Player 4821');});
  it('uses the chosen settings name, trimmed to 24 characters',()=>{expect(playerDisplayName({...base,playerNumber:4821,playerName:'  Simon  '},'sv')).toBe('Simon');expect(cleanPlayerName('x'.repeat(30))).toHaveLength(24);});
  it('falls back to default when the name is blank',()=>{expect(playerDisplayName({...base,playerNumber:1234,playerName:'   '},'sv')).toBe('Spelare 1234');});
  it('random numbers have four digits',()=>{for(let i=0;i<200;i++){const n=randomPlayerNumber();expect(n).toBeGreaterThanOrEqual(1000);expect(n).toBeLessThanOrEqual(9999);}});
});
