import { Check, CheckCheck, Clock3, ShieldBan, Trash2, Trophy, X, MoreHorizontal } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { friendToday, type Friend } from '@/lib/friends';

export function FriendResults({person,day,language,busy,onRemove,onBlock,test=false}:{person:Friend;day:string;language:string;busy:boolean;onRemove:()=>void;onBlock?:()=>void;test?:boolean}) {
  const copy=(sv:string,en:string)=>language==='sv'?sv:en;
  const today=friendToday(person,day);
  const number=new Intl.NumberFormat(language==='no'?'nb':language,{minimumFractionDigits:1,maximumFractionDigits:1});
  return <article className="friend-player">
    <div className="friend-player-heading">
      <span className="friend-avatar" aria-hidden="true">{person.name.slice(0,1).toLocaleUpperCase()}</span>
      <div className="friend-player-name"><strong>{person.name}</strong>{test&&<span>{copy('Testvän','Test friend')}</span>}</div>
      <div className="friend-hcp"><small>HCP</small><strong>{person.hcp===null?'—':number.format(person.hcp)}</strong></div>
      <div className="friend-player-tools"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" disabled={busy} aria-label={`${copy('Hantera','Manage')} ${person.name}`} title={copy('Hantera vän','Manage friend')}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="friend-action-menu"><DropdownMenuItem onSelect={onRemove}><Trash2 />{copy('Ta bort vän','Remove friend')}</DropdownMenuItem>{onBlock&&<DropdownMenuItem onSelect={onBlock}><ShieldBan />{copy('Blockera','Block')}</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu></div>
    </div>
    <div className={`friend-day-status ${today.complete?'complete':''}`}>
      {today.complete?<CheckCheck />:<Clock3 />}<span>{today.complete?copy('Dagens spel är klara','Today’s games complete'):`${today.completed}/3 ${copy('klara idag','complete today')}`}</span>
    </div>
    <div className="friend-results-grid">{today.results.map((result,slot)=><div key={slot} className={`friend-result ${result ? result.won?'won':'lost':'waiting'}`}>
      <span className="friend-result-label">{copy('Ord','Word')} {slot+1}</span>
      <div className="friend-result-value">{result ? <>{result.won?<Check />:<X />}<strong>{result.won?`${result.attempts}/6`:'6/6'}</strong></> : <strong>—</strong>}</div>
      <span className="friend-result-score">{result ? `${result.score>0?'+':''}${result.score} ${copy('poäng','points')}` : today.current&&slot<today.completed?copy('Avslutat','Completed'):copy('Ej klart','Not complete')}</span>
    </div>)}</div>
    {today.complete && today.results.every(result=>result!==null)&&<div className="friend-day-total"><Trophy /><span>{copy('Dagens resultat','Today’s score')}</span><strong>{(()=>{const sum=today.results.reduce((total,result)=>total+(result?.score??0),0);return `${sum>0?'+':''}${sum}`;})()}</strong></div>}
    {!today.current&&person.day&&<p className="friend-last-update">{copy('Senaste speldag','Last game day')}: {person.day}</p>}
  </article>;
}