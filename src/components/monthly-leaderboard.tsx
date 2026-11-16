import {useEffect,useState} from 'react';
import {Capacitor} from '@capacitor/core';
import {ChevronLeft,ChevronRight,RefreshCw,Trophy} from 'lucide-react';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {useTranslation} from '@/lib/i18n';
import {monthlyBoard,previousMonth,MONTHLY_MINIMUM,type MonthlyBoard} from '@/lib/ranking/monthly';
import {flagFor} from '@/lib/ranking/country';
import type {Save} from '@/lib/ord/engine';

export function MonthlyLeaderboard({save,day,open}:{save:Save;day:string;open:boolean}) {
  const {language}=useTranslation();const copy=(sv:string,en:string)=>language==='sv'?sv:en;
  const current=day.slice(0,7);const [previous,setPrevious]=useState(false);const month=previous?previousMonth(current):current;
  const [board,setBoard]=useState<MonthlyBoard|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState(false);const [name,setName]=useState('');
  useEffect(()=>{if(!open)return;let live=true;setBusy(true);setError(false);void monthlyBoard(month,save,day).then(value=>{if(live){setBoard(value);setName(value.name);}}).catch(()=>{if(live)setError(true);}).finally(()=>{if(live)setBusy(false);});return()=>{live=false;};},[open,month,save,day]);
  async function act(action:'join'|'leave'|'sync') {if(busy)return;setBusy(true);setError(false);try{const value=await monthlyBoard(month,save,day,action,name);setBoard(value);}catch{setError(true);}finally{setBusy(false);}}
  const visible=board?.month===month?board:null;
  const number=new Intl.NumberFormat(language==='no'?'nb':language,{minimumFractionDigits:2,maximumFractionDigits:2});
  const label=new Intl.DateTimeFormat(language==='no'?'nb':language,{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${month}-01T12:00:00Z`));
  return <section className="monthly-leaderboard">
    <div className="monthly-heading"><Trophy /><h3>{copy('Månadens topp 20','Monthly top 20')}</h3><Button variant="ghost" disabled={busy} aria-label={copy('Uppdatera topplistan','Refresh leaderboard')} onClick={()=>void act('sync')}><RefreshCw className={busy?'friends-loading':''}/></Button></div>
    <div className="monthly-navigation"><Button variant="ghost" disabled={previous||busy} aria-label={copy('Föregående månad','Previous month')} onClick={()=>setPrevious(true)}><ChevronLeft/></Button><strong>{label}</strong><Button variant="ghost" disabled={!previous||busy} aria-label={copy('Aktuell månad','Current month')} onClick={()=>setPrevious(false)}><ChevronRight/></Button></div>
    {visible&&<p className="monthly-country">{flagFor(visible.country)} {new Intl.DisplayNames([language==='no'?'nb':language],{type:'region'}).of(visible.country)}</p>}
    {error&&<p role="alert" className="privacy-error">{copy('Kunde inte hämta topplistan. Försök igen när du har anslutning.','Could not load the leaderboard. Try again when connected.')}</p>}
    {!visible&&busy&&<p className="monthly-note" role="status">{copy('Hämtar…','Loading…')}</p>}
    {visible?.leaders.length ? <ol className="monthly-list">{visible.leaders.map((entry,i)=><li key={i} className={entry.self?'monthly-self':''}><span className="monthly-place">{entry.place&&entry.place<=3?['🥇','🥈','🥉'][entry.place-1]:entry.place}</span><div><strong>{entry.name}</strong><small>{entry.played} {copy('spelade ord','words played')}</small></div><strong>{number.format(entry.average)}</strong></li>)}</ol>:visible&&<p className="monthly-note">{copy('Ingen har kvalificerat sig ännu.','No one has qualified yet.')}</p>}
    {visible?.joined&&<div className="monthly-own"><span>{copy('Din placering','Your position')}</span><strong>{visible.self?.place?`#${visible.self.place} · ${number.format(visible.self.average)}`:`${visible.self?.played??0}/${MONTHLY_MINIMUM}`}</strong></div>}
    <p className="monthly-note">{copy('Minst 30 avslutade ord. Lägst månadssnitt vinner. Lika snitt ger delad placering.','At least 30 completed words. Lowest monthly average wins. Equal averages share a place.')}</p>
    {Capacitor.isNativePlatform()?visible&&!visible.joined?<form className="monthly-join" onSubmit={e=>{e.preventDefault();void act('join');}}><Input value={name} maxLength={24} aria-label={copy('Smeknamn i topplistan','Leaderboard nickname')} placeholder={copy('Smeknamn','Nickname')} onChange={e=>setName(e.target.value)}/><Button disabled={busy||!name.trim()} type="submit">{copy('Delta','Join')}</Button></form>:visible?.joined&&<Button variant="link" disabled={busy} onClick={()=>void act('leave')}>{copy('Lämna topplistan','Leave leaderboard')}</Button>:<p className="monthly-note">{copy('Deltagande finns i iPhone- och Android-appen.','Participation is available in the iPhone and Android app.')}</p>}
    <p className="monthly-note">{copy('Frivilligt deltagande. Ditt smeknamn och månadssnitt visas, aldrig orden. Självrapporterade resultat.','Optional participation. Your nickname and monthly average are shown, never words. Self-reported results.')}</p>
  </section>;
}