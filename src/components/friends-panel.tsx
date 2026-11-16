import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Check, Share2, RefreshCw, UserPlus, Users, ShieldBan, Trash2, Undo2, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { GameDialog } from './ui/game-dialog';
import { FriendResults } from './friend-results';
import { useTranslation } from '@/lib/i18n';
import { cachedFriends, friendsAction, shareFriendCode, validFriendCode, validFriendName, type FriendAction, type FriendsState } from '@/lib/friends';
import {friendCopy} from '@/lib/i18n/friends-copy';
import {t} from '@/lib/i18n';
import type { Save } from '@/lib/ord/engine';

export function FriendsPanel({open,close,save,day}:{open:boolean;close:()=>void;save:Save;day:string}) {
  const {language}=useTranslation();
  const text=friendCopy(language);
  const [state,setState]=useState<FriendsState | null>(null);
  const [name,setName]=useState('');const [code,setCode]=useState('');
  const [busy,setBusy]=useState(false);const [error,setError]=useState(false);const [notice,setNotice]=useState('');
  const [showTestFriend,setShowTestFriend]=useState(true);
  const [inviteOpen,setInviteOpen]=useState(false);
  const previewFriend=import.meta.env.DEV && !Capacitor.isNativePlatform() && showTestFriend;
  useEffect(()=>{
    if(!open)return;
    let live=true;
    let fresh=false;
    setBusy(true);setError(false);setNotice('');
    void cachedFriends().then(cached=>{if(live&&!fresh&&cached){setState(cached);setName(cached.name);}});
    void friendsAction('sync',{save,day}).then(value=>{fresh=true;if(live){setState(value);setName(value.name);}}).catch(()=>{if(live)setError(true);}).finally(()=>{if(live)setBusy(false);});
    return()=>{live=false;};
  },[open,save,day]);
  useEffect(()=>{
    if(!open||busy)return;
    let live=true,running=false;
    async function refresh(){
      if(running||document.visibilityState==='hidden'||navigator.onLine===false)return;
      running=true;
      try {const value=await friendsAction('sync',{save,day});if(live){setState(value);setError(false);}}
      catch { /* Retain existing friends on temporary connection failure. */ }
      finally {running=false;}
    }
    const timer=setInterval(()=>void refresh(),30000);
    window.addEventListener('online',refresh);document.addEventListener('visibilitychange',refresh);
    return()=>{live=false;clearInterval(timer);window.removeEventListener('online',refresh);document.removeEventListener('visibilitychange',refresh);};
  },[open,busy,save,day]);
  async function act(action:FriendAction,target?:string) {
    if(busy)return;setBusy(true);setError(false);setNotice('');
    try {const value=await friendsAction(action,{name,code,target,save,day});setState(value);setName(value.name);if(action==='invite'){setCode('');setNotice(text.sent);}}
    catch{setError(true);}finally{setBusy(false);}
  }
  async function share() {
    if(!state||busy)return;setBusy(true);
    try {const outcome=await shareFriendCode(`${text.share} ${state.code}`);if(outcome==='copied')setNotice(text.copied);if(outcome==='failed')setError(true);}catch{setError(true);}finally{setBusy(false);}
  }
  const accepted=state?.people.filter(p=>p.status==='accepted') ?? [];
  const pending=state?.people.filter(p=>p.status==='pending') ?? [];
  const blocked=state?.people.filter(p=>p.status==='blocked') ?? [];
  return <GameDialog open={open} onClose={close} title={text.friends} description={text.friends} fullscreen>
    <div className="friends-page">
      <div className="friends-topbar"><div><h3>{text.mine} · {accepted.length + (previewFriend ? 1 : 0)}</h3><span>{t('todayWords')}</span></div><Button variant="secondary" aria-expanded={inviteOpen} aria-controls="friends-invite" onClick={()=>setInviteOpen(value=>!value)}><UserPlus />{text.invite}<ChevronDown className={inviteOpen?'friends-chevron-open':''} /></Button><Button variant="ghost" disabled={busy} aria-label={text.refresh} title={text.refresh} onClick={()=>void act('sync')}><RefreshCw className={busy?'friends-loading':''} /></Button></div>
      {error&&<p className="privacy-error" role="alert">{text.error}</p>}
      {notice&&<p role="status">{notice}</p>}
      {inviteOpen&&<section id="friends-invite" className="friends-invite-area">
      <form onSubmit={e=>{e.preventDefault();void act('name');}}><label htmlFor="friend-name">{text.nickname}</label><div className="friends-input-row"><Input id="friend-name" value={name} maxLength={24} onChange={e=>setName(e.target.value)} autoComplete="nickname" /><Button type="submit" variant="secondary" disabled={busy||!validFriendName(name)} aria-label={text.saveName} title={text.saveName}><Check /></Button></div></form>
      <section className="friend-code-section"><span>{text.code}</span><strong>{state?.code.match(/.{1,3}/g)?.join(' ') ?? '—'}</strong><Button variant="secondary" disabled={busy||!state} onClick={()=>void share()}><Share2 />{text.inviteFriend}</Button></section>
      <form onSubmit={e=>{e.preventDefault();void act('invite');}}><label htmlFor="friend-code">{text.addCode}</label><div className="friends-input-row"><Input id="friend-code" value={code} onChange={e=>setCode(e.target.value)} maxLength={16} autoCapitalize="characters" autoCorrect="off" autoComplete="off" /><Button type="submit" disabled={busy||!state?.name||!validFriendCode(code)} aria-label={text.send} title={text.send}><UserPlus /></Button></div></form>
      </section>}
      {!!pending.length&&<h3>{text.invitations} · {pending.length}</h3>}
      {pending.map(person=><div className="friend-row" key={person.id}><div className="friend-details"><strong>{person.name}</strong><span>{person.incoming?text.incoming:text.pending}</span></div>{person.incoming&&<Button variant="secondary" disabled={busy} aria-label={`${text.accept} ${person.name}`} title={text.accept} onClick={()=>void act('accept',person.id)}><Check /></Button>}<Button variant="ghost" disabled={busy} aria-label={`${text.remove} ${person.name}`} title={text.remove} onClick={()=>void act('remove',person.id)}><Trash2 /></Button><Button variant="ghost" disabled={busy} aria-label={`${text.block} ${person.name}`} title={text.block} onClick={()=>void act('block',person.id)}><ShieldBan /></Button></div>)}
      {previewFriend && <FriendResults person={{id:'preview-alex',name:'Alex',status:'accepted',incoming:false,hcp:-0.8,day,completed:3,results:[{won:true,attempts:3,score:-1},{won:true,attempts:4,score:0},{won:false,attempts:6,score:3}]}} day={day} language={language} busy={false} test onRemove={()=>setShowTestFriend(false)} />}
      {!state&&busy ? <p>{text.refresh}</p> : !accepted.length&&!previewFriend&&<div className="friends-empty"><Users /><p>{text.empty}</p></div>}
      {accepted.map(person=><FriendResults key={person.id} person={person} day={day} language={language} busy={busy} onRemove={()=>void act('remove',person.id)} onBlock={()=>void act('block',person.id)} />)}
      {!!blocked.length&&<h3>{text.block}</h3>}{blocked.map(person=><div className="friend-row" key={person.id}><strong className="friend-details">{person.name}</strong><Button variant="ghost" disabled={busy} aria-label={`${text.unblock} ${person.name}`} title={text.unblock} onClick={()=>void act('unblock',person.id)}><Undo2 /></Button></div>)}
    </div>
  </GameDialog>;
}