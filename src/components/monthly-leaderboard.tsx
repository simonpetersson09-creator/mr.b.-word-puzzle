import {useEffect,useState} from 'react';
import {Capacitor} from '@capacitor/core';
import {RefreshCw,Trophy} from 'lucide-react';
import {Button} from './ui/button';
import {playerDisplayName} from '@/lib/i18n/player-copy';
import {useTranslation} from '@/lib/i18n';
import {monthlyBoard,currentMonth,MONTHLY_MINIMUM,type MonthlyBoard} from '@/lib/ranking/monthly';
import type {Save} from '@/lib/ord/engine';
import {monthlyCopy} from '@/lib/i18n/monthly-copy';

export function MonthlyLeaderboard({save,day,open}:{save:Save;day:string;open:boolean}) {
  const {language}=useTranslation();
  const [,title,refresh,failed,loading,played,position]=monthlyCopy[language];
  const month=currentMonth(day);
  const [board,setBoard]=useState<MonthlyBoard|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState(false);
  // Native players join automatically under their settings name (or the default numbered name).
  const name=playerDisplayName(save.settings,language);const auto=Capacitor.isNativePlatform()?'join':'sync';
  useEffect(()=>{if(!open)return;let live=true;setBusy(true);setError(false);void monthlyBoard(month,save,day,auto,name).then(value=>{if(live)setBoard(value);}).catch(()=>{if(live)setError(true);}).finally(()=>{if(live)setBusy(false);});return()=>{live=false;};},[open,month,save,day,auto,name]);
  async function act(action:'join'|'sync') {if(busy)return;setBusy(true);setError(false);try{const value=await monthlyBoard(month,save,day,action,name);setBoard(value);}catch{setError(true);}finally{setBusy(false);}}
  const visible=board?.month===month?board:null;
  const number=new Intl.NumberFormat(language==='no'?'nb':language,{minimumFractionDigits:2,maximumFractionDigits:2});
  const label=new Intl.DateTimeFormat(language==='no'?'nb':language,{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${month}-01T12:00:00Z`));
  return <section className="monthly-leaderboard">
    <div className="monthly-heading"><Trophy /><h3>{title}</h3><Button variant="ghost" disabled={busy} aria-label={refresh} onClick={()=>void act(auto)}><RefreshCw className={busy?'friends-loading':''}/></Button></div>
    <div className="monthly-navigation"><strong>{label}</strong></div>
    {error&&<p role="alert" className="privacy-error">{failed}</p>}
    {!visible&&busy&&<p className="monthly-note" role="status">{loading}</p>}
    {!!visible?.leaders.length && <ol className="monthly-list">{visible.leaders.map((entry,i)=><li key={i} className={entry.self?'monthly-self':''}><span className="monthly-place">{entry.place&&entry.place<=3?['🥇','🥈','🥉'][entry.place-1]:entry.place}</span><div><strong>{entry.name}</strong><small>{entry.played} {played}</small></div><strong>{number.format(entry.average)}</strong></li>)}</ol>}
    {visible?.joined&&<div className="monthly-own"><span>{position}</span><strong>{visible.self?.place?`#${visible.self.place} · ${number.format(visible.self.average)}`:`${visible.self?.played??0}/${MONTHLY_MINIMUM}`}</strong></div>}
  </section>;
}