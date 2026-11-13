export const AD_START_TIMEOUT = 8000;
export const AD_LOAD_TIMEOUT = 20000;
export const AD_REQUEST_TIMEOUT = 10000;

export async function withDeadline<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([work,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('native_timeout')),ms);})]);
  } finally { if (timer !== undefined) clearTimeout(timer); }
}

export interface PresentationBridge {
  listen(event: 'shown' | 'dismissed' | 'failed', callback: () => void): Promise<{remove(): Promise<void>}>;
  show(deadline: number): Promise<void>;
  isShowing(): Promise<boolean>;
  discard(): Promise<void>;
}

// The native deadline prevents a queued bridge call from presenting after timeout.
// Once visible, never unlock a new word merely because the ad has taken a long time.
export async function presentPreparedAd(bridge: PresentationBridge) {
  let visible=false, finished=false, closed=false;
  const handles: Array<{remove(): Promise<void>}> = [];
  const register = async (event: 'shown' | 'dismissed' | 'failed', callback: () => void) => {
    const handle=await bridge.listen(event,callback);
    if(closed) await handle.remove().catch(()=>{}); else handles.push(handle);
  };
  try {
    await withDeadline(Promise.all([
      register('shown',()=>{visible=true;}),
      register('dismissed',()=>{finished=true;}),
      register('failed',()=>{finished=true;}),
    ]),AD_START_TIMEOUT);
    const deadline=Date.now()+AD_START_TIMEOUT;
    try { await withDeadline(bridge.show(deadline),AD_START_TIMEOUT); }
    catch {
      if (!visible) {
        const active=await withDeadline(bridge.isShowing(),2000).catch(()=>false);
        if (!active) { await withDeadline(bridge.discard(),2000).catch(()=>{}); return; }
      }
    }
    while (!finished) {
      const active=await withDeadline(bridge.isShowing(),2000).catch(()=>true);
      if (!active) return;
      await new Promise<void>(resolve=>setTimeout(resolve,250));
    }
  } finally {
    closed=true;
    await Promise.all(handles.map(handle=>withDeadline(handle.remove(),2000).catch(()=>{})));
  }
}