import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Check, Share2, RefreshCw, UserPlus, Users, ShieldBan, Trash2, Undo2, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { GameDialog } from './ui/game-dialog';
import { FriendResults } from './friend-results';
import { useTranslation } from '@/lib/i18n';
import { cachedFriends, friendsAction, shareFriendCode, validFriendCode, validFriendName, type FriendAction, type FriendsState } from '@/lib/friends';
import type { Save } from '@/lib/ord/engine';

export function FriendsPanel({open,close,save,day}:{open:boolean;close:()=>void;save:Save;day:string}) {
  const {language}=useTranslation();
  const sv=language==='sv';
  const copy=(swedish:string,english:string)=>sv ? swedish : english;
  const [state,setState]=useState<FriendsState | null>(null);
  const [name,setName]=useState('');const [code,setCode]=useState('');
  const [busy,setBusy]=useState(false);const [error,setError]=useState(false);const [notice,setNotice]=useState('');
  const [showTestFriend,setShowTestFriend]=useState(true);
  const [inviteOpen,setInviteOpen]=useState(false);
  const previewFriend=import.meta.env.DEV && !Capacitor.isNativePlatform() && showTestFriend;
  useEffect(()=>{
    if(!open)return;
    let live=true;
    setBusy(true);setError(false);setNotice('');
    void cachedFriends().then(cached=>{if(live&&cached){setState(cached);setName(cached.name);}});
    void friendsAction('sync',{save,day}).then(value=>{if(live){setState(value);setName(value.name);}}).catch(()=>{if(live)setError(true);}).finally(()=>{if(live)setBusy(false);});
    return()=>{live=false;};
  },[open,save,day]);
  async function act(action:FriendAction,target?:string) {
    if(busy)return;setBusy(true);setError(false);setNotice('');
    try {const value=await friendsAction(action,{name,code,target,save,day});setState(value);setName(value.name);if(action==='invite'){setCode('');setNotice(copy('Inbjudan skickad','Invitation sent'));}}
    catch{setError(true);}finally{setBusy(false);}
  }
  async function share() {
    if(!state||busy)return;setBusy(true);
    try {const outcome=await shareFriendCode(copy(`Spela med mig i Mr.B. Word Puzzle! Min vänkod: ${state.code}`,`Play with me in Mr.B. Word Puzzle! My friend code: ${state.code}`));if(outcome==='copied')setNotice(copy('Vänkoden är kopierad','Friend code copied'));if(outcome==='failed')setError(true);}catch{setError(true);}finally{setBusy(false);}
  }
  const accepted=state?.people.filter(p=>p.status==='accepted') ?? [];
  const pending=state?.people.filter(p=>p.status==='pending') ?? [];
  const blocked=state?.people.filter(p=>p.status==='blocked') ?? [];
  return <GameDialog open={open} onClose={close} title={copy('Vänner','Friends')} description={copy('Vänner och inbjudningar','Friends and invitations')} fullscreen>
    <div className="friends-page">
      <div className="friends-topbar"><div><h3>{copy('Mina vänner','My friends')} · {accepted.length + (previewFriend ? 1 : 0)}</h3><span>{copy('Dagens tre ord','Today’s three words')}</span></div><Button variant="secondary" aria-expanded={inviteOpen} aria-controls="friends-invite" onClick={()=>setInviteOpen(value=>!value)}><UserPlus />{copy('Bjud in','Invite')}<ChevronDown className={inviteOpen?'friends-chevron-open':''} /></Button><Button variant="ghost" disabled={busy} aria-label={copy('Uppdatera','Refresh')} title={copy('Uppdatera','Refresh')} onClick={()=>void act('sync')}><RefreshCw className={busy?'friends-loading':''} /></Button></div>
      {error&&<p className="privacy-error" role="alert">{copy('Kunde inte uppdatera. Kontrollera anslutningen och vänkoden och försök igen.','Could not update. Check your connection and friend code, then try again.')}</p>}
      {notice&&<p role="status">{notice}</p>}
      {inviteOpen&&<section id="friends-invite" className="friends-invite-area">
      <form onSubmit={e=>{e.preventDefault();void act('name');}}><label htmlFor="friend-name">{copy('Ditt smeknamn','Your nickname')}</label><div className="friends-input-row"><Input id="friend-name" value={name} maxLength={24} onChange={e=>setName(e.target.value)} autoComplete="nickname" /><Button type="submit" variant="secondary" disabled={busy||!validFriendName(name)} aria-label={copy('Spara smeknamn','Save nickname')} title={copy('Spara smeknamn','Save nickname')}><Check /></Button></div></form>
      <section className="friend-code-section"><span>{copy('Din vänkod','Your friend code')}</span><strong>{state?.code.match(/.{1,3}/g)?.join(' ') ?? '—'}</strong><Button variant="secondary" disabled={busy||!state} onClick={()=>void share()}><Share2 />{copy('Bjud in en vän','Invite a friend')}</Button></section>
      <form onSubmit={e=>{e.preventDefault();void act('invite');}}><label htmlFor="friend-code">{copy('Lägg till med vänkod','Add with friend code')}</label><div className="friends-input-row"><Input id="friend-code" value={code} onChange={e=>setCode(e.target.value)} maxLength={16} autoCapitalize="characters" autoCorrect="off" autoComplete="off" /><Button type="submit" disabled={busy||!state?.name||!validFriendCode(code)} aria-label={copy('Skicka inbjudan','Send invitation')} title={copy('Skicka inbjudan','Send invitation')}><UserPlus /></Button></div></form>
      </section>}
      {!!pending.length&&<h3>{copy('Inbjudningar','Invitations')} · {pending.length}</h3>}
      {pending.map(person=><div className="friend-row" key={person.id}><div className="friend-details"><strong>{person.name}</strong><span>{copy(person.incoming?'Vill bli din vän':'Väntar på svar',person.incoming?'Wants to be your friend':'Waiting for a reply')}</span></div>{person.incoming&&<Button variant="secondary" disabled={busy} aria-label={`${copy('Godkänn','Accept')} ${person.name}`} title={copy('Godkänn','Accept')} onClick={()=>void act('accept',person.id)}><Check /></Button>}<Button variant="ghost" disabled={busy} aria-label={`${copy('Ta bort','Remove')} ${person.name}`} title={copy('Ta bort','Remove')} onClick={()=>void act('remove',person.id)}><Trash2 /></Button><Button variant="ghost" disabled={busy} aria-label={`${copy('Blockera','Block')} ${person.name}`} title={copy('Blockera','Block')} onClick={()=>void act('block',person.id)}><ShieldBan /></Button></div>)}
      {previewFriend && <FriendResults person={{id:'preview-alex',name:'Alex',status:'accepted',incoming:false,hcp:-0.8,day,completed:3,results:[{won:true,attempts:3,score:-1},{won:true,attempts:4,score:0},{won:false,attempts:6,score:3}]}} day={day} language={language} busy={false} test onRemove={()=>setShowTestFriend(false)} />}
      {!state&&busy ? <p>{copy('Hämtar…','Loading…')}</p> : !accepted.length&&!previewFriend&&<div className="friends-empty"><Users /><p>{copy('Inga vänner ännu','No friends yet')}</p></div>}
      {accepted.map(person=><FriendResults key={person.id} person={person} day={day} language={language} busy={busy} onRemove={()=>void act('remove',person.id)} onBlock={()=>void act('block',person.id)} />)}
      {!!blocked.length&&<h3>{copy('Blockerade','Blocked')}</h3>}{blocked.map(person=><div className="friend-row" key={person.id}><strong className="friend-details">{person.name}</strong><Button variant="ghost" disabled={busy} aria-label={`${copy('Avblockera','Unblock')} ${person.name}`} title={copy('Avblockera','Unblock')} onClick={()=>void act('unblock',person.id)}><Undo2 /></Button></div>)}
    </div>
  </GameDialog>;
}