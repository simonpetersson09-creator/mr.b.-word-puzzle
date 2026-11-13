import {describe,it,expect,vi} from 'vitest';
vi.mock('@capacitor/core',()=>({Capacitor:{isNativePlatform:()=>false}}));
describe('ranking write capability',()=>{
 it('persists a random 256-bit capability across module restarts and does not claim legacy identity',async()=>{
  localStorage.clear();localStorage.setItem('mrb-word-puzzle:ranking-device','11111111-1111-4111-8111-111111111111');
  vi.resetModules();const {rankingIdentity}=await import('./identity');const first=await rankingIdentity();
  expect(first.id).not.toBe('11111111-1111-4111-8111-111111111111');expect(first.token).toMatch(/^[a-f0-9]{64}$/);
  vi.resetModules();const restarted=await import('./identity');expect(await restarted.rankingIdentity()).toEqual(first);
 });
});