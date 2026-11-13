import {describe,it,expect,vi} from 'vitest';
import {deliverResult,resultText,shareResult} from './result-share';
const native=vi.hoisted(()=>({enabled:true,share:vi.fn(),copy:vi.fn()}));
vi.mock('@capacitor/core',()=>({Capacitor:{isNativePlatform:()=>native.enabled}}));
vi.mock('@capacitor/share',()=>({Share:{canShare:async()=>({value:true}),share:native.share}}));
vi.mock('@capacitor/clipboard',()=>({Clipboard:{write:native.copy}}));
describe('native result sharing',()=>{
 it.each(['ios','android'])('opens the native share sheet for %s without exposing the answer',async()=>{
  native.share.mockResolvedValue({});native.copy.mockClear();
  const round={date:'2026-11-13',answer:'KANEL',guesses:['KANEL'],slot:2};
  expect(await shareResult(round)).toBe('shared');
  expect(native.share.mock.calls.at(-1)?.[0].text).not.toContain('KANEL');
  expect(resultText(round)).toContain('3/3');expect(resultText(round)).toContain('🟩🟩🟩🟩🟩');
  expect(native.copy).not.toHaveBeenCalled();
 });
 it('copies when sharing fails',async()=>{
  const copy=vi.fn().mockResolvedValue(undefined);
  expect(await deliverResult('result',{share:async()=>{throw new Error('unavailable');},copy})).toBe('copied');expect(copy).toHaveBeenCalledWith('result');
 });
 it('does not copy or report failure after cancellation',async()=>{
  const copy=vi.fn();expect(await deliverResult('result',{share:async()=>{throw new DOMException('cancel','AbortError');},copy})).toBe('cancelled');expect(copy).not.toHaveBeenCalled();
 });
 it('returns an observable failure when both paths fail',async()=>{
  expect(await deliverResult('result',{copy:async()=>{throw new Error('denied');}})).toBe('failed');
 });
});