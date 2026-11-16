import {beforeEach,expect,it,vi} from 'vitest';
import type {MonthlyBoard} from './monthly';
vi.mock('@capacitor/core',()=>({Capacitor:{isNativePlatform:()=>false}}));
beforeEach(()=>{vi.resetModules();localStorage.clear();});
const board:MonthlyBoard={month:'2026-11',country:'SE',joined:true,name:'Spelare 1234',leaders:[{name:'Alex',played:30,average:-1,place:1}],self:null};
it('restores a previously loaded board before opening and never shows it in another month',async()=>{
  const cache=await import('./monthly-cache');await cache.cacheMonthlyBoard(board);
  vi.resetModules();const restored=await import('./monthly-cache');
  expect(restored.readMonthlyCache('2026-11')).toEqual(board);
  expect(restored.readMonthlyCache('2026-12')).toBeNull();
});
it('keeps a successful board available when local persistence fails',async()=>{
  const cache=await import('./monthly-cache');
  vi.spyOn(Storage.prototype,'setItem').mockImplementationOnce(()=>{throw new Error('storage blocked');});
  await cache.cacheMonthlyBoard(board);
  expect(cache.readMonthlyCache('2026-11')?.leaders[0]?.name).toBe('Alex');
});