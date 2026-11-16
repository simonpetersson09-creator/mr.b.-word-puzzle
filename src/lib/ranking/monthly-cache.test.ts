import {beforeEach,expect,it,vi} from 'vitest';
import type {MonthlyBoard} from './monthly';
const mocks=vi.hoisted(()=>({native:vi.fn(()=>false),get:vi.fn()}));
vi.mock('@capacitor/core',()=>({Capacitor:{isNativePlatform:mocks.native}}));
vi.mock('@capacitor/preferences',()=>({Preferences:{get:mocks.get}}));
beforeEach(()=>{vi.resetModules();localStorage.clear();mocks.native.mockReturnValue(false);mocks.get.mockReset();});
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
it('restores the new month from native storage even when memory retains the previous month',async()=>{
  const cache=await import('./monthly-cache');await cache.cacheMonthlyBoard(board);
  mocks.native.mockReturnValue(true);
  const december={...board,month:'2026-12',leaders:[{name:'December',played:30,average:0,place:1}]};
  mocks.get.mockResolvedValue({value:JSON.stringify(december)});
  expect(await cache.restoreMonthlyCache('2026-12')).toEqual(december);
  expect(cache.readMonthlyCache('2026-12')?.leaders[0]?.name).toBe('December');
});