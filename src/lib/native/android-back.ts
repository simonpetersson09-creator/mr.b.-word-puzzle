import { Capacitor } from '@capacitor/core';
export interface BackActions { busy(): boolean; dismissOverlay(): boolean; save(): Promise<void>; minimize(): Promise<void> }
export function createAndroidBackHandler(actions: BackActions) {
  let pending=false;
  return async () => {
    if(pending || actions.busy())return;
    if(actions.dismissOverlay())return;
    pending=true;
    try { await actions.save().catch(()=>{}); await actions.minimize(); }
    finally { pending=false; }
  };
}
export function installAndroidBack(actions: Omit<BackActions,'minimize'>) {
  let stopped=false;
  let remove: (()=>Promise<void>) | undefined;
  if(Capacitor.getPlatform()==='android')void import('@capacitor/app').then(async({App})=>{
    const handler=createAndroidBackHandler({...actions,minimize:()=>App.minimizeApp()});
    const listener=await App.addListener('backButton',()=>{void handler().catch(()=>{});});
    if(stopped)await listener.remove();else remove=()=>listener.remove();
  }).catch(()=>{});
  return ()=>{stopped=true;void remove?.();};
}