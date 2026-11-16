import {useEffect,useState} from 'react';
import {Capacitor} from '@capacitor/core';
import {RefreshCw,Trophy} from 'lucide-react';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {useTranslation} from '@/lib/i18n';
import {monthlyBoard,currentMonth,MONTHLY_MINIMUM,type MonthlyBoard} from '@/lib/ranking/monthly';
import type {Save} from '@/lib/ord/engine';
import {monthlyCopy} from '@/lib/i18n/monthly-copy';

export function MonthlyLeaderboard({save,day,open}:{save:Save;day:string;open:boolean}) {
  const {language}=useTranslation();
  const [,title,refresh,failed,loading,played,position,nickname,join,leave]=monthlyCopy[language];
  const month=currentMonth(day);
  const [board,setBoard]=useState<MonthlyBoard|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState(false);const [name,setName]=useState('');
  useEffect(()=>{if(!open)return;let live=true;setBusy(true);setError(false);void monthlyBoard(month,save,day).then(value=>{if(live){setBoard(value);setName(value.name);}}).catch(()=>{if(live)setError(true);}).finally(()=>{if(live)setBusy(false);});return()=>{live=false;};},[open,month,save,day]);
  async function act(action:'join'|'leave'|'sync') {if(busy)return;setBusy(true);setError(false);try{const value=await monthlyBoard(month,save,day,action,name);setBoard(value);}catch{setError(true);}finally{setBusy(false);}}
  const visible=board?.month===month?board:null;
  const number=new Intl.NumberFormat(language==='no'?'nb':language,{minimumFractionDigits:2,maximumFractionDigits:2});
  const label=new Intl.DateTimeFormat(language==='no'?'nb':language,{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${month}-01T12:00:00Z`));
  return <section className="monthly-leaderboard">
    <div className="monthly-heading"><Trophy /><h3>{title}</h3><Button variant="ghost" disabled={busy} aria-label={refresh} onClick={()=>void act('sync')}><RefreshCw className={busy?'friends-loading':''}/></Button></div>
    <div className="monthly-navigation"><strong>{label}</strong></div>
    {error&&<p role="alert" className="privacy-error">{failed}</p>}
    {!visible&&busy&&<p className="monthly-note" role="status">{loading}</p>}
    {!!visible?.leaders.length && <ol className="monthly-list">{visible.leaders.map((entry,i)=><li key={i} className={entry.self?'monthly-self':''}><span className="monthly-place">{entry.place&&entry.place<=3?['🥇','🥈','🥉'][entry.place-1]:entry.place}</span><div><strong>{entry.name}</strong><small>{entry.played} {played}</small></div><strong>{number.format(entry.average)}</strong></li>)}</ol>}
    {visible?.joined&&<div className="monthly-own"><span>{position}</span><strong>{visible.self?.place?`#${visible.self.place} · ${number.format(visible.self.average)}`:`${visible.self?.played??0}/${MONTHLY_MINIMUM}`}</strong></div>}
    {Capacitor.isNativePlatform()&&(visible&&!visible.joined?<form className="monthly-join" onSubmit={e=>{e.preventDefault();void act('join');}}><Input value={name} maxLength={24} aria-label={nickname} placeholder={nickname} onChange={e=>setName(e.target.value)}/><Button disabled={busy||!name.trim()} type="submit">{join}</Button></form>:visible?.joined&&<Button variant="link" disabled={busy} onClick={()=>void act('leave')}>{leave}</Button>)}
  </section>;
}