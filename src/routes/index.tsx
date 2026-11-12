import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from 'react';
import { ChartNoAxesColumnIncreasing, CircleHelp, Settings2, Delete, ArrowRight } from 'lucide-react';
import mrB from '@/assets/mr-b.png';
import { Button } from '@/components/ui/button';
import { OrdDialogs, type Panel } from '@/components/ord-dialogs';
import { emptySave, evaluate, hasWon, isFinished, keyboardMarks, newRound, gameDate, submitGuess, dayNumber, type Save } from '@/lib/ord/engine';
import { initializeSave, loadSave, mergeRound, persistSave, flushNativeSave, SAVE_KEY } from '@/lib/ord/storage';
import { installViewportSync } from '@/lib/native/viewport';
import { feedback } from '@/lib/native/feedback';
import { deviceLanguage, setAppLanguage, useTranslation } from '@/lib/i18n';
import { type Language } from '@/lib/i18n/languages';
import { keyboardRows, letters, uppercase, wordPacks } from '@/lib/ord/words/localized';
import { installOpeningListener } from '@/lib/native/opening';
import { dailyAds, initializeAds } from '@/lib/native/interstitial';

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
  const {t,language}=useTranslation();
  const [phoneLanguage,setPhoneLanguage]=useState<Language>('sv');
  const [welcome,setWelcome]=useState(true);
  const [save,setSave] = useState<Save>(emptySave);
  const [date,setDate] = useState('2026-11-12');
  const [ready,setReady] = useState(false);
  const [input,setInput] = useState('');
  const [message,setMessage] = useState('');
  const [panel,setPanel] = useState<Panel>(null);
  const panelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(save);
  const desiredLanguage=save.settings.gameLanguage && save.settings.gameLanguage !== 'auto' ? save.settings.gameLanguage : phoneLanguage;
  const round = save.rounds[date] ?? newRound(date,desiredLanguage);
  const wordLanguage=round.language ?? 'sv';
  const available=wordLanguage === 'sv' || !!wordPacks[wordLanguage];
  const rows=keyboardRows(wordLanguage);
  function openWelcome() {
    if (panelTimer.current) clearTimeout(panelTimer.current);
    setDate(gameDate()); setPanel(null); setMessage(''); setWelcome(true);
    void deviceLanguage().then(lang=>{setPhoneLanguage(lang); const choice=saveRef.current.settings.language; setAppLanguage(choice && choice!=='auto' ? choice : lang);});
  }
  const done = isFinished(round), marks = keyboardMarks(round);
  function commit(next: Save) {
    saveRef.current = next; setSave(next);
    if (!persistSave(next)) setMessage(t('storage'));
  }
  useEffect(() => {
    let mounted = true;
    void Promise.all([initializeSave(),deviceLanguage()]).then(([loaded,lang]) => {
      if (!mounted) return;
      saveRef.current = loaded; setSave(loaded); setPhoneLanguage(lang); setAppLanguage(loaded.settings.language && loaded.settings.language!=='auto' ? loaded.settings.language : lang); setDate(gameDate()); setReady(true);
      void initializeAds().then(() => {
        const active = loaded.rounds[gameDate()];
        if (active && !isFinished(active)) dailyAds.preload(active.date, active.guesses.length);
      });
    });
    const cleanup = installViewportSync();
    const cleanupOpening=installOpeningListener(openWelcome);
    const languageChanged=()=>openWelcome();
    window.addEventListener('languagechange',languageChanged);
    function refreshDay() {
      const current = gameDate();
      setDate(prior => { if (prior !== current) { setInput(''); setMessage(''); setPanel(null); if (panelTimer.current) clearTimeout(panelTimer.current); } return current; });
    }
    function reload(event: StorageEvent) { if (event.key === SAVE_KEY) { const updated=loadSave(); saveRef.current=updated; setSave(updated); setInput(''); } }
    const timer=setInterval(refreshDay,1000);
    window.addEventListener('focus',refreshDay); document.addEventListener('visibilitychange',refreshDay); window.addEventListener('storage',reload);
    return () => { mounted = false; cleanup(); cleanupOpening(); window.removeEventListener('languagechange',languageChanged); clearInterval(timer); if(panelTimer.current) clearTimeout(panelTimer.current); window.removeEventListener('focus',refreshDay); document.removeEventListener('visibilitychange',refreshDay); window.removeEventListener('storage',reload); };
  },[]);
  function enter() {
    if (!ready || done || welcome || !available) return;
    const currentDate=gameDate();
    if (currentDate !== date) { setDate(currentDate); setInput(''); setMessage(t('newWord')); return; }
    const latest=loadSave(), active=latest.rounds[date] ?? saveRef.current.rounds[date] ?? round;
    const result=submitGuess(active,input);
    if(result.error) { setMessage(t(result.error)); return; }
    setMessage(''); setInput(''); commit(mergeRound({...latest,rounds:{...saveRef.current.rounds,...latest.rounds},settings:saveRef.current.settings},result.round));
    void initializeAds().then(() => dailyAds.preload(date,result.round.guesses.length));
    void feedback(saveRef.current.settings,hasWon(result.round));
    if(isFinished(result.round)) panelTimer.current=setTimeout(() => setPanel('stats'),650);
  }
  function type(letter: string) { if(!ready || done || welcome || !available) return; setMessage(''); setInput(prior => letters(prior).length < 5 ? prior+letter : prior); }
  function erase() { if(done) return; setMessage(''); setInput(prior => letters(prior).slice(0,-1).join('')); }
  function closePanel() {
    const showAd = panel === 'stats' && done;
    setPanel(null);
    if (showAd) void flushNativeSave().then(() => dailyAds.afterResult(date,true)).catch(() => setMessage(t('storage')));
  }
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if(panel || welcome || !rows || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      if(event.key === 'Enter') { event.preventDefault(); enter(); }
      else if(event.key === 'Backspace') { event.preventDefault(); erase(); }
      else if(/^[\p{L}\p{M}]$/u.test(event.key)) { event.preventDefault(); type(uppercase(event.key,wordLanguage)); }
    }
    window.addEventListener('keydown',keydown); return () => window.removeEventListener('keydown',keydown);
  });
  const formatted = new Intl.DateTimeFormat(language === 'no' ? 'nb' : language,{day:'numeric',month:'long',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
  return (
    <div className="app-screen">
      <header className="app-header"><nav className="header-tools header-tools-left" aria-label={t('rules')}>
        <Button className="tool-button" variant="ghost" aria-label={t('rules')} title={t('rules')} onClick={() => setPanel('rules')}><CircleHelp /></Button>
      </nav><div className="brand"><img src={mrB} alt="" /><div className="brand-label"><h1>MR. B ORD</h1><small>{`${t('word')} #${dayNumber(date)-dayNumber('2026-11-12')+1} · ${formatted}`}</small></div></div><nav className="header-tools header-tools-right" aria-label={t('settings')}>
        <Button className="tool-button" variant="ghost" aria-label={t('stats')} title={t('stats')} onClick={() => setPanel('stats')}><ChartNoAxesColumnIncreasing /></Button>
        <Button className="tool-button" variant="ghost" aria-label={t('settings')} title={t('settings')} onClick={() => setPanel('settings')}><Settings2 /></Button>
      </nav></header>
      <main className="game">
        <div className="board-zone"><div className="board" role="grid" aria-label={t('board')}>{Array.from({length:6},(_,row) => {
          const guess=round.guesses[row], active=!done && row===round.guesses.length;
          const chars=letters(guess ?? (active ? input : '')); const colors=guess ? evaluate(guess,round.answer) : [];
          return Array.from({length:5},(_,col) => <div role="gridcell" key={`${row}-${col}`} aria-label={t('cell',{row:row+1,col:col+1,letter:chars[col] ?? t('empty')})+(colors[col] ? ', '+t(colors[col]) : '')} className={`tile ${active ? 'active' : ''} ${active && chars[col] ? 'filled' : ''} ${colors[col] ?? ''} ${guess ? 'reveal' : ''}`}>{chars[col]}</div>);
        })}</div></div>
        <div className={`game-message ${message ? 'error' : ''}`} aria-live="polite">{message || (done ? (hasWon(round) ? t('found',{word:round.answer,count:round.guesses.length}) : t('answer',{word:round.answer})) : '')}<span className="sr-only">{!done && !message ? t('attempt',{count:round.guesses.length+1}) : ''}</span></div>
        {!available ? <p className="game-message">{t('unavailable')}</p> : rows ? <div className="keyboard" aria-label={t('keyboard')} style={{'--key-columns':Math.max(...rows.map(row=>row.length))} as React.CSSProperties}>{rows.map((row,i) => <div className="key-row" key={i} style={{'--row-columns':row.length+(i===rows.length-1 ? 1 : 0)} as React.CSSProperties}>{row.map(c => <Button key={c} variant="secondary" className={`key ${marks[c] ?? ''}`} disabled={!ready || done || welcome} onClick={() => type(c)} aria-label={t('letter',{letter:c})}>{c}</Button>)}{i===rows.length-1 && <Button variant="secondary" className="key erase-key" disabled={done || !ready || welcome} onClick={erase} aria-label={t('erase')} title={t('erase')}><Delete /></Button>}</div>)}</div> : <input className="word-input" value={input} disabled={!ready || done || welcome} aria-label={t('typeWord')} autoCapitalize="characters" autoCorrect="off" autoComplete="off" spellCheck={false} onChange={event=>setInput(letters(uppercase(event.target.value,wordLanguage)).slice(0,5).join(''))} onKeyDown={event=>{if (event.key==='Enter') enter();}} />}
        <Button className="guess-button" disabled={!ready || !available || welcome} onClick={done ? () => setPanel('stats') : enter}>{done ? <ChartNoAxesColumnIncreasing /> : <ArrowRight />}{done ? t('result') : t('guess')}</Button>
      </main>
      <OrdDialogs welcome={ready && welcome && !panel} dismissWelcome={()=>{setWelcome(false); if(done) setPanel('stats');}} phoneLanguage={phoneLanguage} panel={panel} close={closePanel} save={save} round={round} setSettings={settings => {commit({...saveRef.current,settings});setAppLanguage(settings.language && settings.language!=='auto' ? settings.language : phoneLanguage);setInput('');}} />
    </div>
  );
}
