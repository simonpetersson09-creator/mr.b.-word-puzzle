import { Capacitor } from '@capacitor/core';
export function installOpeningListener(onOpen: () => void): () => void {
 let disposed=false;
 let cleanup: (()=>void) | undefined;
 if (Capacitor.isNativePlatform()) {
  void import('@capacitor/app').then(async ({App})=>{
   const handle=await App.addListener('appStateChange',({isActive})=>{if (isActive && !disposed) onOpen();});
   if (disposed) void handle.remove(); else cleanup=()=>{void handle.remove();};
  });
 } else {
  let hidden=document.hidden;
  const change=()=>{if (!document.hidden && hidden) onOpen();hidden=document.hidden;};
  document.addEventListener('visibilitychange',change);
  cleanup=()=>document.removeEventListener('visibilitychange',change);
 }
 return ()=>{disposed=true;cleanup?.();};
}