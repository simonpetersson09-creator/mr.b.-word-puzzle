import {describe,it,expect,vi,afterEach} from 'vitest';
import {AD_START_TIMEOUT,presentPreparedAd} from './ad-presentation';
describe('native result-exit presentation',()=>{
  afterEach(()=>vi.useRealTimers());
  it('unblocks a stalled presentation bridge after eight seconds, before another round',async()=>{
    vi.useFakeTimers();const discard=vi.fn().mockResolvedValue(undefined),remove=vi.fn().mockResolvedValue(undefined);
    const work=presentPreparedAd({listen:async()=>({remove}),show:()=>new Promise(()=>{}),isShowing:async()=>false,discard});
    await vi.advanceTimersByTimeAsync(AD_START_TIMEOUT);
    await work;expect(AD_START_TIMEOUT).toBe(8000);expect(discard).toHaveBeenCalledTimes(1);expect(remove).toHaveBeenCalledTimes(3);
  });
  it('does not unlock a word at two minutes while a fullscreen ad is still visible',async()=>{
    vi.useFakeTimers();let active=true;const events=new Map<string,()=>void>();let exited=false;
    const work=presentPreparedAd({listen:async(e,cb)=>{events.set(e,cb);return{remove:async()=>{}};},show:async()=>{events.get('shown')?.();},isShowing:async()=>active,discard:async()=>{}}).then(()=>{exited=true;});
    await vi.advanceTimersByTimeAsync(120000);expect(exited).toBe(false);
    active=false;events.get('dismissed')?.();await vi.advanceTimersByTimeAsync(250);await work;expect(exited).toBe(true);
  });
});