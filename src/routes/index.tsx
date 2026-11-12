import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from 'react';
import { ChartNoAxesColumnIncreasing, CircleHelp, Settings2, Delete, ArrowRight, LockKeyhole } from 'lucide-react';
import mrB from '@/assets/mr-b.png';
import { Button } from '@/components/ui/button';
import { OrdDialogs, type Panel } from '@/components/ord-dialogs';
import { emptySave, evaluate, hasWon, isFinished, keyboardMarks, newRound, stockholmDate, submitGuess, dayNumber, type Save } from '@/lib/ord/engine';
import { loadSave, mergeRound, persistSave, SAVE_KEY } from '@/lib/ord/storage';
import { installViewportSync } from '@/lib/native/viewport';
import { feedback } from '@/lib/native/feedback';
import { t } from '@/lib/i18n';

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    {title:'Mr. B Ord – dagens svenska ordspel'},
    {name:'description',content:'Dagens svenska ord med Mr. B. Fem bokstäver, sex försök och ett nytt pussel varje dag.'},
    {property:'og:title',content:'Mr. B Ord – ett nytt ord varje dag'},
    {property:'og:description',content:'Gissa dagens svenska ord på sex försök. Spela direkt, utan konto.'},
    {property:'og:type',content:'website'}, {name:'twitter:card',content:'summary_large_image'},
  ]}),
  component: Index,
});

function Index() {
  const [save,setSave] = useState<Save>(emptySave);
  const [date,setDate] = useState('2026-11-12');
  const [ready,setReady] = useState(false);
  const [input,setInput] = useState('');
  const [message,setMessage] = useState('');
  const [panel,setPanel] = useState<Panel>(null);
  const panelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(save);
  const round = save.rounds[date] ?? newRound(date);
  const done = isFinished(round), marks = keyboardMarks(round);
  function commit(next: Save) {
    saveRef.current = next; setSave(next);
    if (!persistSave(next)) setMessage(t('storage'));
  }
  useEffect(() => {
    const loaded = loadSave(); saveRef.current = loaded; setSave(loaded); setDate(stockholmDate()); setReady(true);
    const cleanup = installViewportSync();
    function refreshDay() {
      const current = stockholmDate();
      setDate(prior => { if (prior !== current) { setInput(''); setMessage(''); setPanel(null); if (panelTimer.current) clearTimeout(panelTimer.current); } return current; });
    }
    function reload(event: StorageEvent) { if (event.key === SAVE_KEY) { const updated=loadSave(); saveRef.current=updated; setSave(updated); setInput(''); } }
    const timer=setInterval(refreshDay,1000);
    window.addEventListener('focus',refreshDay); document.addEventListener('visibilitychange',refreshDay); window.addEventListener('storage',reload);
    return () => { cleanup(); clearInterval(timer); if(panelTimer.current) clearTimeout(panelTimer.current); window.removeEventListener('focus',refreshDay); document.removeEventListener('visibilitychange',refreshDay); window.removeEventListener('storage',reload); };
  },[]);
  function enter() {
    if (!ready || done) return;
    const currentDate=stockholmDate();
    if (currentDate !== date) { setDate(currentDate); setInput(''); setMessage('Ett nytt ord är här'); return; }
    const latest=loadSave(), active=latest.rounds[date] ?? round;
    const result=submitGuess(active,input);
    if(result.error) { setMessage(t(result.error)); return; }
    setMessage(''); setInput(''); commit(mergeRound({...latest,settings:saveRef.current.settings},result.round));
    void feedback(saveRef.current.settings,hasWon(result.round));
    if(isFinished(result.round)) panelTimer.current=setTimeout(() => setPanel('stats'),650);
  }
  function type(letter: string) { if(!ready || done) return; setMessage(''); setInput(prior => prior.length < 5 ? prior+letter : prior); }
  function erase() { if(done) return; setMessage(''); setInput(prior => prior.slice(0,-1)); }
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if(panel || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      if(event.key === 'Enter') { event.preventDefault(); enter(); }
      else if(event.key === 'Backspace') { event.preventDefault(); erase(); }
      else if(/^[a-zåäö]$/i.test(event.key)) { event.preventDefault(); type(event.key.toLocaleUpperCase('sv-SE')); }
    }
    window.addEventListener('keydown',keydown); return () => window.removeEventListener('keydown',keydown);
  });
  const formatted = new Intl.DateTimeFormat('sv-SE',{day:'numeric',month:'long',timeZone:'Europe/Stockholm'}).format(new Date(date+'T12:00:00Z'));
  return (
    <div className="app-screen">
      <h1 className="sr-only">Mr. B Ord – dagens svenska ordspel</h1>
      <header className="app-header"><div className="brand"><img src={mrB} alt="Mr. B" /><div className="brand-label">MR. B<span className="sr-only"> Ord</span><small>{`Dagens ord #${dayNumber(date)-dayNumber('2026-11-12')+1} · ${formatted}`}</small></div></div><nav className="header-tools" aria-label="Spelmeny">
        <Button className="tool-button" variant="ghost" aria-label="Regler" title="Regler" onClick={() => setPanel('rules')}><CircleHelp /></Button>
        <Button className="tool-button" variant="ghost" aria-label="Statistik" title="Statistik" onClick={() => setPanel('stats')}><ChartNoAxesColumnIncreasing /></Button>
        <Button className="tool-button" variant="ghost" aria-label="Inställningar" title="Inställningar" onClick={() => setPanel('settings')}><Settings2 /></Button>
      </nav></header>
      <main className="game">
        <div className="board-zone"><div className="board" role="grid" aria-label="Spelplan, sex rader med fem bokstäver">{Array.from({length:6},(_,row) => {
          const guess=round.guesses[row], active=!done && row===round.guesses.length;
          const letters=guess ?? (active ? input : ''); const colors=guess ? evaluate(guess,round.answer) : [];
          return Array.from({length:5},(_,col) => <div role="gridcell" key={`${row}-${col}`} aria-label={`Rad ${row+1}, plats ${col+1}: ${letters[col] ?? 'tom'}${colors[col] ? ', '+({correct:'rätt plats',present:'annan plats',absent:'ingen träff'})[colors[col]] : ''}`} className={`tile ${active ? 'active' : ''} ${active && letters[col] ? 'filled' : ''} ${colors[col] ?? ''} ${guess ? 'reveal' : ''}`}>{letters[col]}</div>);
        })}</div></div>
        <div className={`game-message ${message ? 'error' : ''}`} aria-live="polite">{message || (done ? (hasWon(round) ? `Snyggt! ${round.answer} på ${round.guesses.length} försök.` : `Dagens ord var ${round.answer}.`) : `Försök ${round.guesses.length+1} av 6`)}</div>
        <Button className="guess-button" disabled={!ready} onClick={done ? () => setPanel('stats') : enter}>{done ? <ChartNoAxesColumnIncreasing /> : <ArrowRight />}{done ? 'Visa resultat' : t('guess')}</Button>
        <div className="keyboard" aria-label="Svenskt tangentbord">{['QWERTYUIOPÅ','ASDFGHJKLÖÄ','ZXCVBNM'].map((row,i) => <div className="key-row" key={row}>{row.split('').map(c => <Button key={c} variant="secondary" className={`key ${marks[c] ?? ''}`} disabled={!ready || done} onClick={() => type(c)} aria-label={`Bokstav ${c}`}>{c}</Button>)}{i===2 && <><Button variant="secondary" className="key" disabled={done || !ready} onClick={erase} aria-label="Radera" title="Radera"><Delete /></Button><Button variant="secondary" className="key" disabled={done || !ready} onClick={enter} aria-label="Skicka gissning" title="Gissa"><ArrowRight /></Button></>}</div>)}</div>
      </main>
      <OrdDialogs panel={panel} close={() => setPanel(null)} save={save} round={round} setSettings={settings => commit({...saveRef.current,settings})} />
    </div>
  );
}
